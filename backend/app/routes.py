from flask import Blueprint, request, jsonify, g, Response, stream_with_context
import jwt
import json
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from functools import wraps
import time
import psycopg2.extras
from psycopg2.extras import Json
from . import get_db
from .parser import extract_text_from_pdf
from .llm_engine import analyze_cv_with_gemini, extract_job_offer_data

api_bp = Blueprint('api_v1', __name__, url_prefix='/api/v1')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'status': 'error', 'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, os.environ.get('JWT_SECRET_KEY', 'cvsmartai_secret'), algorithms=["HS256"])
            g.user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'status': 'error', 'message': 'Token has expired!'}), 401
        except Exception as e:
            return jsonify({'status': 'error', 'message': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

def get_cursor(db):
    return db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# ----------------- ANALYZE -----------------
@api_bp.route('/analyze', methods=['POST'])
@token_required
def analyze_cv():
    def generate():
        start_time = time.time()
        
        cv_file = request.files.get('cv_file')
        job_offer_text = request.form.get('job_offer_text')
        user_id = g.user_id
        job_offer_id = request.form.get('job_offer_id') # If they pass an explicit job offer ID
        
        if not cv_file or not job_offer_text:
            yield f"data: {json.dumps({'status': 'error', 'error': 'cv_file and job_offer_text are required.'})}\n\n"
            return
            
        yield f"data: {json.dumps({'status': 'progress', 'message': 'Inicializando análisis...'})}\n\n"
        
        cv_version_id = None
        db = None
        cursor = None
        
        # Step 1: Pre-insert cv_versions record before processing
        if user_id:
            try:
                db = get_db()
                cursor = get_cursor(db)
                
                if not job_offer_id:
                    cursor.execute(
                        "INSERT INTO job_offers (title, description) VALUES (%s, %s) RETURNING id",
                        ("Oferta Evaluada", job_offer_text)
                    )
                    job_offer_id = cursor.fetchone()['id']
                    
                cursor.execute(
                    "SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM cv_versions WHERE user_id = %s",
                    (int(user_id),)
                )
                next_version = cursor.fetchone()['next_version']
                
                cursor.execute(
                    "INSERT INTO cv_versions (user_id, job_offer_id, version_number) VALUES (%s, %s, %s) RETURNING id",
                    (int(user_id), job_offer_id, next_version)
                )
                cv_version_id = cursor.fetchone()['id']
                db.commit()
            except Exception as e:
                print("DB Pre-Insert Error:", e)
                if db:
                    db.rollback()

        yield f"data: {json.dumps({'status': 'progress', 'message': 'Extrayendo texto del PDF...'})}\n\n"
        
        # Call Google Document AI OCR
        cv_bytes = cv_file.read()
        try:
            extracted_text = extract_text_from_pdf(cv_bytes)
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'error': f'Fallo en analísis OCR (GCloud): {str(e)}'})}\n\n"
            return
            
        yield f"data: {json.dumps({'status': 'progress', 'message': 'Enviando a Gemini...'})}\n\n"

        # Call Gemini LLM logic
        try:
            gemini_analysis = analyze_cv_with_gemini(extracted_text, job_offer_text)
            compatibility_score = gemini_analysis.get('compatibility_score', 0)
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'error': f'Fallo en analísis LLM (Gemini): {str(e)}'})}\n\n"
            return
            
        yield f"data: {json.dumps({'status': 'progress', 'message': 'Calculando Score...'})}\n\n"

        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Step 2: Update records after processing
        if cv_version_id is not None and db is not None and cursor is not None:
            try:
                cursor.execute(
                    "UPDATE cv_versions SET extracted_text = %s, compatibility_score = %s WHERE id = %s",
                    (extracted_text[:5000], compatibility_score, cv_version_id)
                )
                
                cursor.execute(
                    "INSERT INTO feedback_logs (cv_version_id, suggested_corrections) VALUES (%s, %s)",
                    (cv_version_id, Json(gemini_analysis.get('analysis', {})))
                )
                
                cursor.execute(
                    "INSERT INTO analysis_logs (user_id, cv_version_id, compatibility_score, processing_time_ms) VALUES (%s, %s, %s, %s)",
                    (int(user_id), cv_version_id, compatibility_score, processing_time_ms)
                )
                
                db.commit()
            except Exception as e:
                print("DB Update Error:", e)
                if db:
                    db.rollback()
            finally:
                if cursor:
                    cursor.close()

        # Final result
        result = {
            "status": "success",
            "extracted_text_preview": extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text,
            "compatibility_score": compatibility_score,
            "analysis": gemini_analysis.get('analysis', {}),
            "processing_time_ms": processing_time_ms
        }
        yield f"data: {json.dumps(result)}\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

# ----------------- JOB OFFERS -----------------
@api_bp.route('/job-offers/extract', methods=['POST'])
@token_required
def extract_job_offer():
    data = request.json
    if not data or 'url' not in data:
        return jsonify({"status": "error", "message": "Falta la URL de la oferta."}), 400
        
    url = data['url']
    try:
        # Scrape the URL
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.extract()
            
        text = soup.get_text(separator=' ', strip=True)
        
        # Limit text to avoid exceeding token limits
        text = text[:15000]
        
        # Extract structured data using Gemini
        extracted_data = extract_job_offer_data(text)
        
        # Insert into database
        db = get_db()
        cursor = get_cursor(db)
        # Note: If the schema doesn't have company/keywords, we just save title/description for now, 
        # or we update the schema. I'll save title and description and return the rest.
        cursor.execute(
            "INSERT INTO job_offers (title, description) VALUES (%s, %s) RETURNING id",
            (extracted_data.get('title', 'Oferta Extraída'), extracted_data.get('description', text[:500]))
        )
        job_offer_id = cursor.fetchone()['id']
        db.commit()
        cursor.close()
        
        return jsonify({
            "status": "success",
            "job_offer_id": job_offer_id,
            "data": extracted_data
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ----------------- USER HISTORY -----------------
@api_bp.route('/users/<int:user_id>/history', methods=['GET'])
@token_required
def get_user_history(user_id):
    db = get_db()
    cursor = get_cursor(db)
    
    query = """
    SELECT 
        cv.id as version_id,
        cv.version_number,
        cv.compatibility_score,
        cv.created_at,
        jo.title as job_offer_title
    FROM cv_versions cv
    LEFT JOIN job_offers jo ON cv.job_offer_id = jo.id
    WHERE cv.user_id = %s AND cv.compatibility_score IS NOT NULL
    ORDER BY cv.id ASC, cv.created_at ASC
    """
    try:
        cursor.execute(query, (user_id,))
        history = cursor.fetchall()
        return jsonify([dict(row) for row in history])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

# ----------------- USER EVOLUTION -----------------
@api_bp.route('/users/<int:user_id>/evolution', methods=['GET'])
@token_required
def get_user_evolution(user_id):
    db = get_db()
    cursor = get_cursor(db)
    
    query = """
    SELECT 
        id as version_id,
        version_number,
        job_offer_id,
        compatibility_score,
        created_at
    FROM cv_versions
    WHERE user_id = %s AND compatibility_score IS NOT NULL
    ORDER BY id ASC, created_at ASC
    """
    try:
        cursor.execute(query, (user_id,))
        evolution = cursor.fetchall()
        return jsonify([dict(row) for row in evolution])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

# ----------------- USERS -----------------
@api_bp.route('/users/register', methods=['POST'])
def register_user():
    data = request.json
    db = get_db()
    
    if not data or 'name' not in data or 'email' not in data or 'password' not in data:
        return jsonify({"status": "error", "message": "Faltan campos (name, email, password)."}), 400
        
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (data['name'], data['email'], data['password'])
        )
        user_id = cursor.fetchone()['id']
        db.commit()
        cursor.close()
        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, os.environ.get('JWT_SECRET_KEY', 'cvsmartai_secret'), algorithm="HS256")
        
        return jsonify({
          "status": "success",
          "user_id": user_id,
          "token": token,
          "message": "Usuario registrado correctamente."
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400

@api_bp.route('/users/login', methods=['POST'])
def login_user():
    data = request.json
    db = get_db()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"status": "error", "message": "Faltan campos (email, password)."}), 400
        
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "SELECT id, password_hash FROM users WHERE email = %s",
            (data['email'],)
        )
        user = cursor.fetchone()
        cursor.close()
        
        if not user or user['password_hash'] != data['password']:
            return jsonify({"status": "error", "message": "Credenciales inválidas."}), 401
            
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(days=1)
        }, os.environ.get('JWT_SECRET_KEY', 'cvsmartai_secret'), algorithm="HS256")
        
        return jsonify({
            "status": "success",
            "token": token,
            "user_id": user['id']
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route('/users', methods=['GET'])
def get_users():
    try:
        db = get_db()
        cursor = get_cursor(db)
        cursor.execute("SELECT id, name FROM users")
        users = cursor.fetchall()
        cursor.close()
        return jsonify([dict(ix) for ix in users])
    except Exception as e:
        print("ERROR IN GET_USERS:", e)
        return jsonify({"error": str(e)}), 500

@api_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(dict(user))

@api_bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    db = get_db()
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (data['name'], data['email'], data['password_hash'])
        )
        user_id = cursor.fetchone()['id']
        db.commit()
        cursor.close()
        return jsonify({'id': user_id, 'message': 'User created'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    db = get_db()
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "UPDATE users SET name = %s, email = %s, password_hash = %s WHERE id = %s",
            (data['name'], data['email'], data['password_hash'], user_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'message': 'User updated'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    db.commit()
    cursor.close()
    return jsonify({'message': 'User deleted'})

# ----------------- SKILLS -----------------
@api_bp.route('/skills', methods=['GET'])
def get_skills():
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("SELECT * FROM skills_dictionary")
    skills = cursor.fetchall()
    cursor.close()
    return jsonify([dict(ix) for ix in skills])

@api_bp.route('/skills/<int:skill_id>', methods=['GET'])
def get_skill(skill_id):
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("SELECT * FROM skills_dictionary WHERE id = %s", (skill_id,))
    skill = cursor.fetchone()
    cursor.close()
    if skill is None:
        return jsonify({'error': 'Skill not found'}), 404
    return jsonify(dict(skill))

@api_bp.route('/skills', methods=['POST'])
def create_skill():
    data = request.json
    db = get_db()
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "INSERT INTO skills_dictionary (keyword, category, aliases) VALUES (%s, %s, %s) RETURNING id",
            (data['keyword'], data.get('category'), Json(data.get('aliases', [])))
        )
        skill_id = cursor.fetchone()['id']
        db.commit()
        cursor.close()
        return jsonify({'id': skill_id, 'message': 'Skill created'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/skills/<int:skill_id>', methods=['PUT'])
def update_skill(skill_id):
    data = request.json
    db = get_db()
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "UPDATE skills_dictionary SET keyword = %s, category = %s, aliases = %s WHERE id = %s",
            (data['keyword'], data.get('category'), Json(data.get('aliases', [])), skill_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'message': 'Skill updated'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
def delete_skill(skill_id):
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("DELETE FROM skills_dictionary WHERE id = %s", (skill_id,))
    db.commit()
    cursor.close()
    return jsonify({'message': 'Skill deleted'})

# ----------------- ANALYSIS LOGS -----------------
@api_bp.route('/logs', methods=['GET'])
def get_logs():
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("SELECT * FROM analysis_logs")
    logs = cursor.fetchall()
    cursor.close()
    return jsonify([dict(ix) for ix in logs])

@api_bp.route('/logs/<int:log_id>', methods=['GET'])
def get_log(log_id):
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("SELECT * FROM analysis_logs WHERE id = %s", (log_id,))
    log = cursor.fetchone()
    cursor.close()
    if log is None:
        return jsonify({'error': 'Log not found'}), 404
    return jsonify(dict(log))

@api_bp.route('/logs', methods=['POST'])
def create_log():
    data = request.json
    db = get_db()
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "INSERT INTO analysis_logs (user_id, cv_version_id, compatibility_score, processing_time_ms) VALUES (%s, %s, %s, %s) RETURNING id",
            (data.get('user_id'), data.get('cv_version_id'), data['compatibility_score'], data['processing_time_ms'])
        )
        log_id = cursor.fetchone()['id']
        db.commit()
        cursor.close()
        return jsonify({'id': log_id, 'message': 'Log created'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/logs/<int:log_id>', methods=['PUT'])
def update_log(log_id):
    data = request.json
    db = get_db()
    try:
        cursor = get_cursor(db)
        cursor.execute(
            "UPDATE analysis_logs SET user_id = %s, cv_version_id = %s, compatibility_score = %s, processing_time_ms = %s WHERE id = %s",
            (data.get('user_id'), data.get('cv_version_id'), data['compatibility_score'], data['processing_time_ms'], log_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'message': 'Log updated'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/logs/<int:log_id>', methods=['DELETE'])
def delete_log(log_id):
    db = get_db()
    cursor = get_cursor(db)
    cursor.execute("DELETE FROM analysis_logs WHERE id = %s", (log_id,))
    db.commit()
    cursor.close()
    return jsonify({'message': 'Log deleted'})

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "cvsmartai-backend"
    }), 200

from flask import Blueprint, request, jsonify
import time
from . import get_db

api_bp = Blueprint('api_v1', __name__, url_prefix='/api/v1')

# ----------------- ANALYZE -----------------
@api_bp.route('/analyze', methods=['POST'])
def analyze_cv():
    start_time = time.time()
    
    cv_file = request.files.get('cv_file')
    job_offer_text = request.form.get('job_offer_text')
    user_id = request.form.get('user_id')

    if not cv_file or not job_offer_text:
        return jsonify({"status": "error", "error": "cv_file and job_offer_text are required."}), 400

    # Mock timeout reflecting "Document AI" call
    time.sleep(0.5)
    processing_time_ms = int((time.time() - start_time) * 1000)

    # Guardamos historial si viene user_id válido
    if user_id and str(user_id).isdigit():
        try:
            db = get_db()
            db.execute(
                "INSERT INTO analysis_logs (user_id, compatibility_score, processing_time_ms) VALUES (?, ?, ?)",
                (int(user_id), 75, processing_time_ms)
            )
            db.commit()
        except:
            pass # Falla de llave foránea ignorada en el mock

    return jsonify({
      "status": "success",
      "compatibility_score": 75,
      "analysis": {
        "matched_skills": ["React", "JavaScript", "Trabajo en equipo"],
        "missing_keywords": ["Python", "Flask", "MySQL"],
        "priority_improvements": [
          "Añade referencias a proyectos desarrollados con Python y Flask.",
          "Menciona conocimientos en bases de datos relacionales como MySQL."
        ]
      },
      "processing_time_ms": processing_time_ms
    })

# ----------------- USERS -----------------
@api_bp.route('/users/register', methods=['POST'])
def register_user():
    data = request.json
    db = get_db()
    
    if not data or 'name' not in data or 'email' not in data or 'password' not in data:
        return jsonify({"status": "error", "message": "Faltan campos (name, email, password)."}), 400
        
    try:
        cursor = db.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (data['name'], data['email'], data['password'])
        )
        db.commit()
        return jsonify({
          "status": "success",
          "user_id": cursor.lastrowid,
          "message": "Usuario registrado correctamente."
        }), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@api_bp.route('/users', methods=['GET'])
def get_users():
    db = get_db()
    users = db.execute("SELECT * FROM users").fetchall()
    return jsonify([dict(ix) for ix in users])

@api_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(dict(user))

@api_bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (data['name'], data['email'], data['password_hash'])
        )
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'message': 'User created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    db = get_db()
    try:
        db.execute(
            "UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?",
            (data['name'], data['email'], data['password_hash'], user_id)
        )
        db.commit()
        return jsonify({'message': 'User updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    db = get_db()
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    return jsonify({'message': 'User deleted'})

# ----------------- SKILLS -----------------
@api_bp.route('/skills', methods=['GET'])
def get_skills():
    db = get_db()
    skills = db.execute("SELECT * FROM skills_dictionary").fetchall()
    return jsonify([dict(ix) for ix in skills])

@api_bp.route('/skills/<int:skill_id>', methods=['GET'])
def get_skill(skill_id):
    db = get_db()
    skill = db.execute("SELECT * FROM skills_dictionary WHERE id = ?", (skill_id,)).fetchone()
    if skill is None:
        return jsonify({'error': 'Skill not found'}), 404
    return jsonify(dict(skill))

@api_bp.route('/skills', methods=['POST'])
def create_skill():
    data = request.json
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO skills_dictionary (keyword, category, aliases) VALUES (?, ?, ?)",
            (data['keyword'], data.get('category'), data.get('aliases', '[]'))
        )
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'message': 'Skill created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/skills/<int:skill_id>', methods=['PUT'])
def update_skill(skill_id):
    data = request.json
    db = get_db()
    try:
        db.execute(
            "UPDATE skills_dictionary SET keyword = ?, category = ?, aliases = ? WHERE id = ?",
            (data['keyword'], data.get('category'), data.get('aliases', '[]'), skill_id)
        )
        db.commit()
        return jsonify({'message': 'Skill updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
def delete_skill(skill_id):
    db = get_db()
    db.execute("DELETE FROM skills_dictionary WHERE id = ?", (skill_id,))
    db.commit()
    return jsonify({'message': 'Skill deleted'})

# ----------------- ANALYSIS LOGS -----------------
@api_bp.route('/logs', methods=['GET'])
def get_logs():
    db = get_db()
    logs = db.execute("SELECT * FROM analysis_logs").fetchall()
    return jsonify([dict(ix) for ix in logs])

@api_bp.route('/logs/<int:log_id>', methods=['GET'])
def get_log(log_id):
    db = get_db()
    log = db.execute("SELECT * FROM analysis_logs WHERE id = ?", (log_id,)).fetchone()
    if log is None:
        return jsonify({'error': 'Log not found'}), 404
    return jsonify(dict(log))

@api_bp.route('/logs', methods=['POST'])
def create_log():
    data = request.json
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO analysis_logs (user_id, compatibility_score, processing_time_ms) VALUES (?, ?, ?)",
            (data.get('user_id'), data['compatibility_score'], data['processing_time_ms'])
        )
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'message': 'Log created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/logs/<int:log_id>', methods=['PUT'])
def update_log(log_id):
    data = request.json
    db = get_db()
    try:
        db.execute(
            "UPDATE analysis_logs SET user_id = ?, compatibility_score = ?, processing_time_ms = ? WHERE id = ?",
            (data.get('user_id'), data['compatibility_score'], data['processing_time_ms'], log_id)
        )
        db.commit()
        return jsonify({'message': 'Log updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/logs/<int:log_id>', methods=['DELETE'])
def delete_log(log_id):
    db = get_db()
    db.execute("DELETE FROM analysis_logs WHERE id = ?", (log_id,))
    db.commit()
    return jsonify({'message': 'Log deleted'})

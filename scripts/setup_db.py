import psycopg2
from psycopg2.extras import Json
import random
import json
from datetime import datetime, timedelta
import os
import hashlib
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cvsmartai')

def create_tables(cursor):
    # Drop tables if they exist
    cursor.execute('DROP TABLE IF EXISTS feedback_logs CASCADE;')
    cursor.execute('DROP TABLE IF EXISTS analysis_logs CASCADE;')
    cursor.execute('DROP TABLE IF EXISTS cv_versions CASCADE;')
    cursor.execute('DROP TABLE IF EXISTS job_offers CASCADE;')
    cursor.execute('DROP TABLE IF EXISTS skills_dictionary CASCADE;')
    cursor.execute('DROP TABLE IF EXISTS users CASCADE;')

    # Table users
    cursor.execute('''
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Table skills_dictionary
    cursor.execute('''
    CREATE TABLE skills_dictionary (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(100) NOT NULL,
        category VARCHAR(50) CHECK(category IN ('hard_skill', 'soft_skill')),
        aliases JSONB
    )
    ''')

    # Table job_offers
    cursor.execute('''
    CREATE TABLE job_offers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        keywords JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Table cv_versions
    cursor.execute('''
    CREATE TABLE cv_versions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        job_offer_id INTEGER REFERENCES job_offers(id),
        extracted_text TEXT,
        version_number INTEGER NOT NULL,
        compatibility_score INTEGER CHECK(compatibility_score >= 0 AND compatibility_score <= 100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Table analysis_logs
    cursor.execute('''
    CREATE TABLE analysis_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        cv_version_id INTEGER REFERENCES cv_versions(id),
        compatibility_score INTEGER CHECK(compatibility_score >= 0 AND compatibility_score <= 100),
        processing_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Table feedback_logs
    cursor.execute('''
    CREATE TABLE feedback_logs (
        id SERIAL PRIMARY KEY,
        cv_version_id INTEGER REFERENCES cv_versions(id),
        suggested_corrections JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

def generate_fake_data(cursor):
    # Data sizes
    num_users = 20
    num_logs = 50

    # 1. Generate Skills Dictionary
    skills = [
        # Original
        ("React", "hard_skill", ["ReactJS", "React.js"]),
        ("Python", "hard_skill", ["Python 3", "py"]),
        ("Liderazgo", "soft_skill", ["Liderazgo de equipos", "Leadership"]),
        ("Comunicación", "soft_skill", ["Comunicación oral", "Comunicación escrita"]),
        ("SQL", "hard_skill", ["MySQL", "PostgreSQL", "SQLite"]),
        ("Machine Learning", "hard_skill", ["ML", "Aprendizaje Automático", "IA"]),
        ("Proactividad", "soft_skill", ["Iniciativa", "Proactivo", "Autonomía"]),
        
        # New Hard Skills (30+)
        ("Java", "hard_skill", ["Java 8", "Java 11", "Java 17", "J2EE"]),
        ("C++", "hard_skill", ["CPP", "C plus plus"]),
        ("C#", "hard_skill", ["C sharp", ".NET", "CSharp"]),
        ("JavaScript", "hard_skill", ["JS", "ES6", "Vanilla JS"]),
        ("TypeScript", "hard_skill", ["TS"]),
        ("Node.js", "hard_skill", ["Node", "NodeJS"]),
        ("Express.js", "hard_skill", ["Express", "ExpressJS"]),
        ("Django", "hard_skill", ["Django Rest Framework", "DRF"]),
        ("Flask", "hard_skill", ["Flask API"]),
        ("Spring Boot", "hard_skill", ["Spring", "SpringBoot"]),
        ("Angular", "hard_skill", ["AngularJS", "Angular 2+"]),
        ("Vue.js", "hard_skill", ["Vue", "VueJS"]),
        ("AWS", "hard_skill", ["Amazon Web Services", "AWS Cloud"]),
        ("Azure", "hard_skill", ["Microsoft Azure"]),
        ("Google Cloud", "hard_skill", ["GCP", "Google Cloud Platform"]),
        ("Docker", "hard_skill", ["Docker Compose", "Contenedores"]),
        ("Kubernetes", "hard_skill", ["K8s"]),
        ("Git", "hard_skill", ["GitHub", "GitLab", "Bitbucket"]),
        ("CI/CD", "hard_skill", ["Integración Continua", "Despliegue Continuo", "Jenkins", "GitHub Actions"]),
        ("MongoDB", "hard_skill", ["Mongo", "NoSQL"]),
        ("Redis", "hard_skill", ["Redis Cache"]),
        ("Elasticsearch", "hard_skill", ["ELK"]),
        ("GraphQL", "hard_skill", ["Graph QL", "Apollo"]),
        ("REST API", "hard_skill", ["RESTful", "APIs REST"]),
        ("Linux", "hard_skill", ["Ubuntu", "CentOS", "Debian", "Unix"]),
        ("Terraform", "hard_skill", ["IaC", "Infraestructura como código"]),
        ("Ansible", "hard_skill", ["Automatización", "Ansible Tower"]),
        ("Ciberseguridad", "hard_skill", ["Seguridad Informática", "Pentesting", "OWASP"]),
        ("Figma", "hard_skill", ["Diseño UI", "Diseño UX"]),
        ("Data Science", "hard_skill", ["Ciencia de Datos", "Pandas", "NumPy"]),
        ("TensorFlow", "hard_skill", ["Keras", "Deep Learning"]),
        ("PyTorch", "hard_skill", ["Torch"]),
        
        # New Soft Skills (15+)
        ("Gestión del tiempo", "soft_skill", ["Time Management", "Organización"]),
        ("Resolución de problemas", "soft_skill", ["Problem Solving", "Pensamiento Crítico"]),
        ("Trabajo en equipo", "soft_skill", ["Teamwork", "Colaboración"]),
        ("Adaptabilidad", "soft_skill", ["Flexibilidad", "Resiliencia"]),
        ("Empatía", "soft_skill", ["Inteligencia Emocional"]),
        ("Pensamiento Analítico", "soft_skill", ["Análisis Crítico", "Analytical Thinking"]),
        ("Creatividad", "soft_skill", ["Innovación", "Pensamiento Creativo"]),
        ("Negociación", "soft_skill", ["Capacidad de Negociación", "Persuasión"]),
        ("Toma de decisiones", "soft_skill", ["Decision Making", "Criterio"]),
        ("Atención al detalle", "soft_skill", ["Minuciosidad", "Detallista"]),
        ("Gestión de conflictos", "soft_skill", ["Resolución de Conflictos", "Mediación"]),
        ("Orientación a resultados", "soft_skill", ["Logro de Objetivos", "Resultados"]),
        ("Capacidad de aprendizaje", "soft_skill", ["Aprendizaje Rápido", "Curiosidad"]),
        ("Gestión del estrés", "soft_skill", ["Tolerancia a la presión", "Manejo del estrés"]),
        ("Mentoría", "soft_skill", ["Coaching", "Desarrollo de talento"])
    ]
    
    for kw, cat, aliases in skills:
        cursor.execute(
            "INSERT INTO skills_dictionary (keyword, category, aliases) VALUES (%s, %s, %s)",
            (kw, cat, Json(aliases))
        )

    # 2. Generate Users
    first_names = ["Juan", "María", "Carlos", "Laura", "Pedro", "Ana", "Luis", "Elena", "Jorge", "Lucía"]
    last_names = ["Gómez", "López", "Pérez", "Rodríguez", "Sánchez", "Martínez", "García", "Fernández"]
    domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]

    inserted_user_ids = []
    
    # Ensure explicit admin user
    admin_password = b"admin123"
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, created_at) VALUES (%s, %s, %s, %s) RETURNING id",
        ("Admin", "admin@cvsmartai.com", hashlib.sha256(admin_password).hexdigest(), datetime.now() - timedelta(days=40))
    )
    inserted_user_ids.append(cursor.fetchone()[0])
    
    for i in range(num_users - 1):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"{name.lower().replace(' ', '.')}.{i}@{random.choice(domains)}"
        raw_password = f"pass{i}123".encode()
        password_hash = hashlib.sha256(raw_password).hexdigest()
        
        days_ago = random.randint(0, 30)
        created_at = datetime.now() - timedelta(days=days_ago)
        
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, created_at) VALUES (%s, %s, %s, %s) RETURNING id",
            (name, email, password_hash, created_at)
        )
        inserted_user_ids.append(cursor.fetchone()[0])

    # 3. Generate Job Offers
    job_offers_data = [
        ("Desarrollador Full Stack", "Buscamos desarrollador Full Stack con experiencia en React y Python.", ["React", "Python", "SQL", "Git", "Trabajo en equipo"]),
        ("Ingeniero de Datos", "Se busca Data Engineer para construir pipelines de datos robustos y escalables.", ["Python", "SQL", "AWS", "Machine Learning", "Resolución de problemas"]),
        ("Desarrollador Frontend Senior", "Experto en creación de interfaces de usuario dinámicas y accesibles.", ["JavaScript", "TypeScript", "React", "Vue.js", "Figma", "Atención al detalle"]),
        ("Arquitecto Cloud", "Líder técnico para diseñar e implementar soluciones en la nube altamente disponibles.", ["AWS", "Google Cloud", "Kubernetes", "Docker", "Terraform", "Liderazgo"]),
        ("Especialista en Ciberseguridad", "Responsable de auditar y proteger la infraestructura tecnológica de la empresa.", ["Ciberseguridad", "Linux", "Python", "Redes", "Pensamiento Analítico"]),
        ("DevOps Engineer", "Ingeniero DevOps con pasión por la automatización y la cultura CI/CD.", ["CI/CD", "Docker", "Kubernetes", "Git", "Linux", "Gestión del tiempo"])
    ]
    
    job_offer_ids = []
    for title, desc, kws in job_offers_data:
        cursor.execute(
            "INSERT INTO job_offers (title, description, keywords) VALUES (%s, %s, %s) RETURNING id",
            (title, desc, Json(kws))
        )
        job_offer_ids.append(cursor.fetchone()[0])

    # 4. Generate CV Versions and Analysis Logs
    # We want to simulate evolution for each user to make the Dashboard charts look good
    for user_id in inserted_user_ids:
        # Not all users have a CV
        if random.random() < 0.2:
            continue

        num_versions = random.randint(2, 6) # Between 2 and 6 versions per user
        base_score = random.randint(30, 60) # Initial score is low
        
        # Start date between 30 and 10 days ago
        start_date = datetime.now() - timedelta(days=random.randint(10, 30))

        for version in range(1, num_versions + 1):
            # Pick a random job offer for this version
            current_job_offer_id = random.choice(job_offer_ids)
            
            # Score improves with each version, capping at 95-100
            score = min(100, base_score + (version - 1) * random.randint(5, 15))
            time_ms = random.randint(300, 2000)
            
            # Each version is uploaded 1-5 days after the previous
            log_date = start_date + timedelta(days=version * random.randint(1, 5))
            
            # Insert cv_version
            cursor.execute(
                "INSERT INTO cv_versions (user_id, job_offer_id, extracted_text, version_number, compatibility_score, created_at) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (user_id, current_job_offer_id, f"Texto extraído de la versión {version}...", version, score, log_date)
            )
            cv_version_id = cursor.fetchone()[0]

            # Generate realistic feedback
            feedback_data = {
                "matched_skills": ["Python", "SQL"] if score > 50 else ["Python"],
                "missing_keywords": ["React", "Liderazgo"] if score < 80 else [],
                "priority_improvements": ["Añade más impacto en tus logros"] if score < 90 else ["El CV está casi perfecto"]
            }

            cursor.execute(
                "INSERT INTO feedback_logs (cv_version_id, suggested_corrections, created_at) VALUES (%s, %s, %s)",
                (cv_version_id, Json(feedback_data), log_date)
            )

            # Insert analysis log
            cursor.execute(
                "INSERT INTO analysis_logs (user_id, cv_version_id, compatibility_score, processing_time_ms, created_at) VALUES (%s, %s, %s, %s, %s)",
                (user_id, cv_version_id, score, time_ms, log_date)
            )

def main():
    print(f"Connecting to database at {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print("Creating tables...")
        create_tables(cursor)

        print("Generating fake data...")
        generate_fake_data(cursor)

        conn.commit()
        cursor.close()
        conn.close()
        print("Database setup complete.")
    except psycopg2.OperationalError as e:
        print(f"Connection failed: {e}")
        print("Please ensure PostgreSQL is running and the database 'cvsmartai' exists.")

if __name__ == "__main__":
    main()

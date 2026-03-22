import sqlite3
import random
import json
from datetime import datetime, timedelta
import os
import hashlib

# Database path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
db_dir = os.path.join(project_dir, "database")
os.makedirs(db_dir, exist_ok=True)
db_path = os.path.join(db_dir, "cvsmartai.db")

def create_tables(cursor):
    # Table users
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Table skills_dictionary
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS skills_dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword VARCHAR(100) NOT NULL,
        category VARCHAR(50) CHECK(category IN ('hard_skill', 'soft_skill')),
        aliases JSON
    )
    ''')

    # Table analysis_logs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS analysis_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        compatibility_score INTEGER CHECK(compatibility_score >= 0 AND compatibility_score <= 100),
        processing_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')

def generate_fake_data(cursor):
    # Data sizes
    num_users = 20
    num_logs = 50

    # 1. Generate Skills Dictionary
    skills = [
        ("React", "hard_skill", ["ReactJS", "React.js"]),
        ("Python", "hard_skill", ["Python 3", "py"]),
        ("Liderazgo", "soft_skill", ["Liderazgo de equipos", "Leadership"]),
        ("Comunicación", "soft_skill", ["Comunicación oral", "Comunicación escrita"]),
        ("SQL", "hard_skill", ["MySQL", "PostgreSQL", "SQLite"]),
        ("Machine Learning", "hard_skill", ["ML", "Aprendizaje Automático", "IA"]),
        ("Proactividad", "soft_skill", ["Iniciativa", "Proactivo", "Autonomía"])
    ]
    
    for kw, cat, aliases in skills:
        cursor.execute(
            "INSERT INTO skills_dictionary (keyword, category, aliases) VALUES (?, ?, ?)",
            (kw, cat, json.dumps(aliases))
        )

    # 2. Generate Users
    first_names = ["Juan", "María", "Carlos", "Laura", "Pedro", "Ana", "Luis", "Elena", "Jorge", "Lucía"]
    last_names = ["Gómez", "López", "Pérez", "Rodríguez", "Sánchez", "Martínez", "García", "Fernández"]
    domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]

    inserted_user_ids = []
    
    for i in range(num_users):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"{name.lower().replace(' ', '.')}.{i}@{random.choice(domains)}"
        # Simple fake hash
        raw_password = f"pass{i}123".encode()
        password_hash = hashlib.sha256(raw_password).hexdigest()
        
        # Random created_at within the last 30 days
        days_ago = random.randint(0, 30)
        created_at = datetime.now() - timedelta(days=days_ago)
        
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (name, email, password_hash, created_at)
        )
        inserted_user_ids.append(cursor.lastrowid)

    # 3. Generate Analysis Logs
    for _ in range(num_logs):
        user_id = random.choice(inserted_user_ids) if random.random() > 0.1 else None # 10% guest users
        score = random.randint(20, 100)
        time_ms = random.randint(150, 2000)
        
        days_ago = random.randint(0, 30)
        log_date = datetime.now() - timedelta(days=days_ago)

        cursor.execute(
            "INSERT INTO analysis_logs (user_id, compatibility_score, processing_time_ms, created_at) VALUES (?, ?, ?, ?)",
            (user_id, score, time_ms, log_date)
        )

def main():
    if os.path.exists(db_path):
        os.remove(db_path) # Start fresh to avoid unique constraint errors during dev

    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Creating tables...")
    create_tables(cursor)

    print("Generating fake data...")
    generate_fake_data(cursor)

    conn.commit()
    conn.close()
    print("Database setup complete.")

if __name__ == "__main__":
    main()

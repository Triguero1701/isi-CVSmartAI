import psycopg2
import random
from datetime import datetime, timedelta
import json

DB_URI = "postgresql://postgres:postgrespassword@localhost:5432/cvsmartai"

def generate_history():
    try:
        conn = psycopg2.connect(DB_URI)
        cur = conn.cursor()

        # Get all users
        cur.execute("SELECT id FROM users")
        users = cur.fetchall()

        if not users:
            print("No users found. Please ensure users are populated.")
            return

        # Check for job_offer
        cur.execute("SELECT id FROM job_offers LIMIT 1")
        job_offer = cur.fetchone()
        job_offer_id = job_offer[0] if job_offer else None

        # Clean existing data to avoid duplicates/mess (Optional but recommended for clean history)
        print("Cleaning up old logs and versions...")
        cur.execute("DELETE FROM feedback_logs")
        cur.execute("DELETE FROM analysis_logs")
        cur.execute("DELETE FROM cv_versions")
        
        print("Generating new history data...")
        total_versions = 0
        
        for (user_id,) in users:
            num_versions = random.randint(3, 8)
            base_date = datetime.now() - timedelta(days=num_versions * 15) # Start in the past
            
            # Start with a low score and improve
            current_score = random.randint(30, 50)
            
            for version_num in range(1, num_versions + 1):
                # Ensure score doesn't exceed 100
                current_score = min(100, current_score + random.randint(5, 15))
                
                # Advance date
                created_at = base_date + timedelta(days=version_num * random.randint(7, 20))
                if created_at > datetime.now():
                    created_at = datetime.now() - timedelta(days=1)
                
                # Insert cv_version
                cur.execute(
                    """
                    INSERT INTO cv_versions (user_id, job_offer_id, extracted_text, version_number, compatibility_score, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                    """,
                    (user_id, job_offer_id, f"Mocked CV content for version {version_num}", version_num, current_score, created_at)
                )
                cv_version_id = cur.fetchone()[0]
                
                # Insert analysis_log
                cur.execute(
                    """
                    INSERT INTO analysis_logs (user_id, cv_version_id, compatibility_score, processing_time_ms, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (user_id, cv_version_id, current_score, random.randint(800, 3500), created_at)
                )
                
                # Insert feedback_log
                fake_feedback = json.dumps([
                    {"category": "Skills", "feedback": "Consider adding more relevant keywords."},
                    {"category": "Experience", "feedback": "Quantify your achievements."}
                ])
                cur.execute(
                    """
                    INSERT INTO feedback_logs (cv_version_id, suggested_corrections, created_at)
                    VALUES (%s, %s, %s)
                    """,
                    (cv_version_id, fake_feedback, created_at)
                )
                
                total_versions += 1
                
        conn.commit()
        print(f"Successfully generated {total_versions} CV versions and associated logs for {len(users)} users.")

    except Exception as e:
        print(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    generate_history()

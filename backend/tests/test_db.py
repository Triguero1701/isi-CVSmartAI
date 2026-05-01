import psycopg2
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from scripts.setup_db import create_tables, generate_fake_data

# Need to make sure conftest is loaded or just duplicate logic if pytest doesn't run it as module
# It's better to just import TEST_DB_URL from conftest
from tests.conftest import TEST_DB_URL

def test_database_creation_and_population(setup_test_db):
    conn = psycopg2.connect(TEST_DB_URL)
    cursor = conn.cursor()

    # Create schema and fake data
    create_tables(cursor)
    generate_fake_data(cursor)
    conn.commit()

    # Check that tables exist
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = [row[0] for row in cursor.fetchall()]
    assert 'users' in tables
    assert 'skills_dictionary' in tables
    assert 'analysis_logs' in tables
    assert 'job_offers' in tables
    assert 'cv_versions' in tables
    assert 'feedback_logs' in tables

    # Validate data was actually inserted
    cursor.execute("SELECT COUNT(*) FROM users")
    users_count = cursor.fetchone()[0]
    assert users_count == 20

    cursor.execute("SELECT COUNT(*) FROM skills_dictionary")
    skills_count = cursor.fetchone()[0]
    assert skills_count > 0

    cursor.execute("SELECT COUNT(*) FROM analysis_logs")
    logs_count = cursor.fetchone()[0]
    assert logs_count == 50

    cursor.execute("SELECT COUNT(*) FROM job_offers")
    jobs_count = cursor.fetchone()[0]
    assert jobs_count > 0

    cursor.close()
    conn.close()


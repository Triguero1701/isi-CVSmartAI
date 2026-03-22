import sqlite3
import os
import tempfile
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from scripts.setup_db import create_tables, generate_fake_data

def test_database_creation_and_population():
    # Use memory database for fast discrete testing
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()

    # Create schema
    create_tables(cursor)

    # Check that tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    assert 'users' in tables
    assert 'skills_dictionary' in tables
    assert 'analysis_logs' in tables

    # Insert fake data
    generate_fake_data(cursor)
    conn.commit()

    # Validate data was actually inserted
    cursor.execute("SELECT COUNT(*) FROM users")
    users_count = cursor.fetchone()[0]
    assert users_count == 20  # Explicitly defined in generate_fake_data

    cursor.execute("SELECT COUNT(*) FROM skills_dictionary")
    skills_count = cursor.fetchone()[0]
    assert skills_count > 0

    cursor.execute("SELECT COUNT(*) FROM analysis_logs")
    logs_count = cursor.fetchone()[0]
    assert logs_count == 50

    conn.close()

import pytest
import sqlite3
import os
import tempfile
import sys

# Ensure backend directory is in the path to import 'app' and 'scripts'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app import create_app
from scripts.setup_db import create_tables

@pytest.fixture
def app():
    # Setup temporary database file
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app()
    app.config.update({
        "TESTING": True,
        "DATABASE": db_path
    })
    
    # Overwrite the DATABASE constant in the module momentarily for the fixture
    import app as app_module
    original_db = getattr(app_module, 'DATABASE', None)
    app_module.DATABASE = db_path
    
    # Initialize the temporary database scheme
    with app.app_context():
        # Get connection
        conn = sqlite3.connect(db_path)
        create_tables(conn.cursor())
        conn.commit()
        conn.close()

    yield app

    # Teardown database
    os.close(db_fd)
    os.unlink(db_path)
    if original_db:
        app_module.DATABASE = original_db

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

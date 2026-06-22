import pytest
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import sys
from unittest.mock import patch

# Ensure backend directory is in the path to import 'app' and 'scripts'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app import create_app
from scripts.setup_db import create_tables

TEST_DB_NAME = "cvsmartai_test"
BASE_DB_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/postgres')
TEST_DB_URL = BASE_DB_URL.rsplit('/', 1)[0] + '/' + TEST_DB_NAME

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Crea una base de datos de prueba al inicio de la sesión y la elimina al final."""
    conn = psycopg2.connect(BASE_DB_URL)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Asegurarse de que no exista
    cursor.execute(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}")
    cursor.execute(f"CREATE DATABASE {TEST_DB_NAME}")
    cursor.close()
    conn.close()

    yield

    # Limpiar después de las pruebas
    conn = psycopg2.connect(BASE_DB_URL)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    # Terminar conexiones activas antes de borrar
    cursor.execute(f"SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '{TEST_DB_NAME}' AND pid <> pg_backend_pid();")
    cursor.execute(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}")
    cursor.close()
    conn.close()

@pytest.fixture(autouse=True)
def mock_document_ai():
    """Mocks Google Document AI globally for all tests."""
    with patch('app.routes.extract_text_from_pdf') as mock_extract:
        mock_extract.return_value = "Texto del CV extraído correctamente (MOCK)."
        yield mock_extract

@pytest.fixture(autouse=True)
def mock_gemini_llm():
    """Mocks Google Gemini LLM globally for all tests."""
    with patch('app.routes.analyze_cv_with_gemini') as mock_llm:
        mock_llm.return_value = {
            "compatibility_score": 80,
            "analysis": {
                "matched_skills": ["Python", "Flask", "Docker"],
                "missing_keywords": ["Kubernetes"],
                "priority_improvements": ["Aprender k8s"]
            }
        }
        yield mock_llm

@pytest.fixture(autouse=True)
def mock_extract_job_offer():
    """Mocks extract_job_offer_data globally for all tests."""
    with patch('app.routes.extract_job_offer_data') as mock:
        mock.return_value = {
            "job_title": "Desarrollador Python",
            "company": "Empresa de Prueba",
            "seniority": "mid",
            "required_skills": ["Python", "SQL"],
            "nice_to_have_skills": ["Docker"],
            "keywords_ats": ["Flask"],
            "description": "Buscamos un desarrollador Python."
        }
        yield mock

@pytest.fixture(autouse=True)
def mock_optimize_cv():
    """Mocks optimize_cv_json globally for all tests."""
    with patch('app.routes.optimize_cv_json') as mock:
        mock.return_value = {
            "personal_info": {"name": "Juan Lopez", "title": "Developer"},
            "summary": "Resumen optimizado",
            "experience": [],
            "education": [],
            "skills": ["Python", "SQL", "Docker"]
        }
        yield mock

@pytest.fixture
def app():
    os.environ['DATABASE_URL'] = TEST_DB_URL
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    
    # Initialize the temporary database scheme for each test
    conn = psycopg2.connect(TEST_DB_URL)
    cursor = conn.cursor()
    create_tables(cursor)
    conn.commit()
    cursor.close()
    conn.close()

    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def auth_headers(client):
    import json
    # Register and login a user to get a valid token
    payload = {
        "name": "Test Auth User",
        "email": "testauth@test.com",
        "password": "secure_pass"
    }
    client.post('/api/v1/users/register', data=json.dumps(payload), content_type='application/json')
    login_res = client.post('/api/v1/users/login', data=json.dumps({"email": "testauth@test.com", "password": "secure_pass"}), content_type='application/json')
    token = login_res.json['token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture(autouse=True)
def mock_translate_cv():
    """Mocks translate_cv_with_gemini globally for all tests."""
    with patch('app.routes.translate_cv_with_gemini') as mock:
        mock.return_value = {
            "personalInfo": {"fullName": "Translated Name", "title": "Translated Title"},
            "summary": "Translated summary",
            "experience": [],
            "education": [],
            "skills": []
        }
        yield mock

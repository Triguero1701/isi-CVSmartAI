import json
import sqlite3
from io import BytesIO

def test_get_users_empty(client):
    response = client.get('/api/v1/users')
    assert response.status_code == 200
    assert response.json == []

def test_register_user(client):
    payload = {
        "name": "Test User",
        "email": "test@test.com",
        "password": "hashed_password123"
    }
    response = client.post('/api/v1/users/register',
                           data=json.dumps(payload),
                           content_type='application/json')
    
    assert response.status_code == 201
    assert response.json['status'] == 'success'
    assert 'user_id' in response.json
    assert response.json['message'] == 'Usuario registrado correctamente.'

    # Verify user exists
    get_res = client.get(f"/api/v1/users/{response.json['user_id']}")
    assert get_res.status_code == 200
    assert get_res.json['email'] == 'test@test.com'

def test_register_user_missing_fields(client):
    payload = {"name": "Test"}
    response = client.post('/api/v1/users/register',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 400
    assert response.json['status'] == 'error'

def test_analyze_endpoint(client):
    data = {
        'job_offer_text': 'Se busca desarrollador Python con Flask.',
        'user_id': '1'
    }
    # Simulate a PDF file upload using BytesIO
    data['cv_file'] = (BytesIO(b"dummy pdf content"), 'test_cv.pdf')
    
    response = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
    
    assert response.status_code == 200
    json_data = response.json
    assert json_data['status'] == 'success'
    assert 'compatibility_score' in json_data
    assert 'matched_skills' in json_data['analysis']
    assert 'missing_keywords' in json_data['analysis']
    assert 'processing_time_ms' in json_data

def test_analyze_missing_cv(client):
    data = {
        'job_offer_text': 'Se busca desarrollador React.'
    }
    response = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    # The routes.py currently returns a standard dict not a custom JSON status for 400 on missing files
    assert 'error' in response.json

def test_get_skills(client):
    res = client.get('/api/v1/skills')
    assert res.status_code == 200
    assert isinstance(res.json, list)

def test_create_skill(client):
    payload = {"keyword": "Docker", "category": "hard_skill", "aliases": '["docker-compose"]'}
    res = client.post('/api/v1/skills', data=json.dumps(payload), content_type='application/json')
    assert res.status_code == 201
    assert res.json['message'] == 'Skill created'
    
def test_get_logs(client):
    res = client.get('/api/v1/logs')
    assert res.status_code == 200
    assert isinstance(res.json, list)

def test_create_log(client):
    payload = {"compatibility_score": 88, "processing_time_ms": 450}
    res = client.post('/api/v1/logs', data=json.dumps(payload), content_type='application/json')
    assert res.status_code == 201
    assert res.json['message'] == 'Log created'

import json
from io import BytesIO

# =============================================================================
# USUARIOS - /api/v1/users
# =============================================================================

class TestUsers:
    """Tests CRUD completos para el recurso /users"""

    def test_get_users_empty(self, client):
        """Base de datos vacía → devuelve lista vacía"""
        res = client.get('/api/v1/users')
        assert res.status_code == 200
        assert res.json == []

    def test_register_user_success(self, client):
        """Registro correcto de un usuario nuevo"""
        payload = {
            "name": "María García",
            "email": "maria@test.com",
            "password": "secure_pass_123"
        }
        res = client.post('/api/v1/users/register',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 201
        assert res.json['status'] == 'success'
        assert 'user_id' in res.json
        assert res.json['message'] == 'Usuario registrado correctamente.'

    def test_register_user_verifies_existence(self, client):
        """El usuario recién registrado se puede obtener por ID"""
        payload = {"name": "Carlos López", "email": "carlos@test.com", "password": "pass"}
        post_res = client.post('/api/v1/users/register',
                               data=json.dumps(payload),
                               content_type='application/json')
        user_id = post_res.json['user_id']

        get_res = client.get(f'/api/v1/users/{user_id}')
        assert get_res.status_code == 200
        assert get_res.json['email'] == 'carlos@test.com'
        assert get_res.json['name'] == 'Carlos López'

    def test_register_user_missing_email(self, client):
        """Registro sin email → 400 con estado error"""
        res = client.post('/api/v1/users/register',
                          data=json.dumps({"name": "Solo Nombre"}),
                          content_type='application/json')
        assert res.status_code == 400
        assert res.json['status'] == 'error'

    def test_register_user_missing_password(self, client):
        """Registro sin password → 400"""
        res = client.post('/api/v1/users/register',
                          data=json.dumps({"name": "A", "email": "a@b.com"}),
                          content_type='application/json')
        assert res.status_code == 400
        assert res.json['status'] == 'error'

    def test_get_user_not_found(self, client):
        """GET de usuario inexistente → 404"""
        res = client.get('/api/v1/users/9999')
        assert res.status_code == 404
        assert 'error' in res.json

    def test_get_all_users_after_insert(self, client):
        """Después de insertar usuarios, GET /users devuelve la lista correcta"""
        for i in range(3):
            client.post('/api/v1/users/register',
                        data=json.dumps({"name": f"User {i}", "email": f"u{i}@test.com", "password": "p"}),
                        content_type='application/json')

        res = client.get('/api/v1/users')
        assert res.status_code == 200
        assert len(res.json) == 3

    def test_create_user_direct(self, client):
        """POST /users (ruta directa) crea usuario con password_hash"""
        payload = {"name": "Direct User", "email": "direct@test.com", "password_hash": "abc123hash"}
        res = client.post('/api/v1/users',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 201
        assert 'id' in res.json

    def test_update_user(self, client):
        """PUT /users/<id> actualiza los datos del usuario"""
        # Crear usuario
        create = client.post('/api/v1/users/register',
                             data=json.dumps({"name": "Original", "email": "orig@test.com", "password": "p"}),
                             content_type='application/json')
        user_id = create.json['user_id']

        # Actualizar
        update_payload = {"name": "Updated Name", "email": "orig@test.com", "password_hash": "new_hash"}
        res = client.put(f'/api/v1/users/{user_id}',
                         data=json.dumps(update_payload),
                         content_type='application/json')
        assert res.status_code == 200
        assert res.json['message'] == 'User updated'

        # Verificar cambio
        get_res = client.get(f'/api/v1/users/{user_id}')
        assert get_res.json['name'] == 'Updated Name'

    def test_delete_user(self, client):
        """DELETE /users/<id> elimina el usuario y ya no es accesible"""
        create = client.post('/api/v1/users/register',
                             data=json.dumps({"name": "To Delete", "email": "del@test.com", "password": "p"}),
                             content_type='application/json')
        user_id = create.json['user_id']

        del_res = client.delete(f'/api/v1/users/{user_id}')
        assert del_res.status_code == 200
        assert del_res.json['message'] == 'User deleted'

        # Verificar que ya no existe
        get_res = client.get(f'/api/v1/users/{user_id}')
        assert get_res.status_code == 404


# =============================================================================
# SKILLS - /api/v1/skills
# =============================================================================

class TestSkills:
    """Tests CRUD completos para el recurso /skills"""

    def test_get_skills_empty(self, client):
        """Sin skills → lista vacía"""
        res = client.get('/api/v1/skills')
        assert res.status_code == 200
        assert res.json == []

    def test_create_skill_success(self, client):
        """Crea skill correctamente"""
        payload = {"keyword": "Docker", "category": "hard_skill", "aliases": '["docker-compose", "Dockerfile"]'}
        res = client.post('/api/v1/skills',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 201
        assert res.json['message'] == 'Skill created'
        assert 'id' in res.json

    def test_get_skill_by_id(self, client):
        """GET /skills/<id> devuelve la skill correcta"""
        payload = {"keyword": "Python", "category": "hard_skill", "aliases": '["py", "Python3"]'}
        create = client.post('/api/v1/skills',
                             data=json.dumps(payload),
                             content_type='application/json')
        skill_id = create.json['id']

        res = client.get(f'/api/v1/skills/{skill_id}')
        assert res.status_code == 200
        assert res.json['keyword'] == 'Python'
        assert res.json['category'] == 'hard_skill'

    def test_get_skill_not_found(self, client):
        """GET de skill inexistente → 404"""
        res = client.get('/api/v1/skills/9999')
        assert res.status_code == 404
        assert 'error' in res.json

    def test_create_skill_soft_skill(self, client):
        """Crea una soft skill correctamente"""
        payload = {"keyword": "Liderazgo", "category": "soft_skill", "aliases": '["Leadership"]'}
        res = client.post('/api/v1/skills',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 201

    def test_create_skill_no_category(self, client):
        """Skill sin categoría → se crea con categoría null"""
        payload = {"keyword": "Git"}
        res = client.post('/api/v1/skills',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 201

    def test_get_all_skills_after_insert(self, client):
        """Lista de skills refleja todos los insertados"""
        keywords = ["React", "SQL", "Comunicación"]
        for kw in keywords:
            client.post('/api/v1/skills',
                        data=json.dumps({"keyword": kw}),
                        content_type='application/json')

        res = client.get('/api/v1/skills')
        assert res.status_code == 200
        assert len(res.json) == 3

    def test_update_skill(self, client):
        """PUT /skills/<id> actualiza la skill"""
        create = client.post('/api/v1/skills',
                             data=json.dumps({"keyword": "OldName", "category": "hard_skill", "aliases": "[]"}),
                             content_type='application/json')
        skill_id = create.json['id']

        res = client.put(f'/api/v1/skills/{skill_id}',
                         data=json.dumps({"keyword": "NewName", "category": "soft_skill", "aliases": "[]"}),
                         content_type='application/json')
        assert res.status_code == 200
        assert res.json['message'] == 'Skill updated'

        get_res = client.get(f'/api/v1/skills/{skill_id}')
        assert get_res.json['keyword'] == 'NewName'
        assert get_res.json['category'] == 'soft_skill'

    def test_delete_skill(self, client):
        """DELETE /skills/<id> elimina la skill"""
        create = client.post('/api/v1/skills',
                             data=json.dumps({"keyword": "ToDelete"}),
                             content_type='application/json')
        skill_id = create.json['id']

        del_res = client.delete(f'/api/v1/skills/{skill_id}')
        assert del_res.status_code == 200
        assert del_res.json['message'] == 'Skill deleted'

        get_res = client.get(f'/api/v1/skills/{skill_id}')
        assert get_res.status_code == 404


# =============================================================================
# LOGS - /api/v1/logs
# =============================================================================

class TestLogs:
    """Tests CRUD completos para el recurso /logs"""

    def test_get_logs_empty(self, client):
        """Sin logs → lista vacía"""
        res = client.get('/api/v1/logs')
        assert res.status_code == 200
        assert res.json == []

    def test_create_log_success(self, client):
        """Crea log correctamente"""
        payload = {"compatibility_score": 85, "processing_time_ms": 320}
        res = client.post('/api/v1/logs',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 201
        assert res.json['message'] == 'Log created'
        assert 'id' in res.json

    def test_create_log_with_user(self, client):
        """Crea log asociado a un usuario existente"""
        user = client.post('/api/v1/users/register',
                           data=json.dumps({"name": "Test", "email": "t@t.com", "password": "p"}),
                           content_type='application/json')
        user_id = user.json['user_id']

        payload = {"user_id": user_id, "compatibility_score": 92, "processing_time_ms": 150}
        res = client.post('/api/v1/logs',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 201

    def test_get_log_by_id(self, client):
        """GET /logs/<id> devuelve el log correcto"""
        create = client.post('/api/v1/logs',
                             data=json.dumps({"compatibility_score": 70, "processing_time_ms": 500}),
                             content_type='application/json')
        log_id = create.json['id']

        res = client.get(f'/api/v1/logs/{log_id}')
        assert res.status_code == 200
        assert res.json['compatibility_score'] == 70
        assert res.json['processing_time_ms'] == 500

    def test_get_log_not_found(self, client):
        """GET de log inexistente → 404"""
        res = client.get('/api/v1/logs/9999')
        assert res.status_code == 404
        assert 'error' in res.json

    def test_get_all_logs_after_insert(self, client):
        """Lista de logs refleja todos los insertados"""
        for score in [50, 75, 90]:
            client.post('/api/v1/logs',
                        data=json.dumps({"compatibility_score": score, "processing_time_ms": 100}),
                        content_type='application/json')

        res = client.get('/api/v1/logs')
        assert res.status_code == 200
        assert len(res.json) == 3

    def test_update_log(self, client):
        """PUT /logs/<id> actualiza el log"""
        create = client.post('/api/v1/logs',
                             data=json.dumps({"compatibility_score": 50, "processing_time_ms": 200}),
                             content_type='application/json')
        log_id = create.json['id']

        res = client.put(f'/api/v1/logs/{log_id}',
                         data=json.dumps({"compatibility_score": 99, "processing_time_ms": 100}),
                         content_type='application/json')
        assert res.status_code == 200
        assert res.json['message'] == 'Log updated'

        get_res = client.get(f'/api/v1/logs/{log_id}')
        assert get_res.json['compatibility_score'] == 99

    def test_delete_log(self, client):
        """DELETE /logs/<id> elimina el log"""
        create = client.post('/api/v1/logs',
                             data=json.dumps({"compatibility_score": 60, "processing_time_ms": 400}),
                             content_type='application/json')
        log_id = create.json['id']

        del_res = client.delete(f'/api/v1/logs/{log_id}')
        assert del_res.status_code == 200
        assert del_res.json['message'] == 'Log deleted'

        get_res = client.get(f'/api/v1/logs/{log_id}')
        assert get_res.status_code == 404


# =============================================================================
# ANALYZE - /api/v1/analyze
# =============================================================================

class TestAnalyze:
    """Tests para el endpoint de análisis de CV"""

    def test_analyze_success(self, client):
        """Análisis con CV y oferta → respuesta completa"""
        data = {
            'job_offer_text': 'Se busca desarrollador Python con Flask y Docker.',
            'user_id': '1'
        }
        data['cv_file'] = (BytesIO(b"Soy desarrollador Python con experiencia en Flask"), 'cv.pdf')

        res = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
        assert res.status_code == 200
        assert res.json['status'] == 'success'
        assert 'compatibility_score' in res.json
        assert 'matched_skills' in res.json['analysis']
        assert 'missing_keywords' in res.json['analysis']
        assert 'processing_time_ms' in res.json

    def test_analyze_missing_cv_file(self, client):
        """Sin CV → 400 con campo error"""
        data = {'job_offer_text': 'Se busca desarrollador React.'}
        res = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
        assert res.status_code == 400
        assert 'error' in res.json

    def test_analyze_missing_job_offer(self, client):
        """Sin texto de oferta → 400"""
        data = {'cv_file': (BytesIO(b"dummy"), 'cv.pdf')}
        res = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
        assert res.status_code == 400
        assert 'error' in res.json

    def test_analyze_score_range(self, client):
        """El score de compatibilidad debe estar entre 0 y 100"""
        data = {
            'job_offer_text': 'Se busca ingeniero de datos.',
            'cv_file': (BytesIO(b"pdf content"), 'cv.pdf')
        }
        res = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
        assert res.status_code == 200
        score = res.json['compatibility_score']
        assert 0 <= score <= 100

    def test_analyze_without_user_id(self, client):
        """Análisis sin user_id (usuario anónimo) es válido"""
        data = {
            'job_offer_text': 'Buscamos experto en SQL y análisis de datos.',
            'cv_file': (BytesIO(b"pdf content"), 'cv.pdf')
        }
        res = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
        assert res.status_code == 200
        assert res.json['status'] == 'success'

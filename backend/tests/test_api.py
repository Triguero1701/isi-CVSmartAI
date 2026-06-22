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

    def test_analyze_success(self, client, auth_headers):
        """Análisis con CV y oferta → respuesta completa"""
        data = {
            'job_offer_text': 'Se busca desarrollador Python con Flask y Docker.',
            'user_id': '1'
        }
        data['cv_file'] = (BytesIO(b"Soy desarrollador Python con experiencia en Flask"), 'cv.pdf')

        res = client.post('/api/v1/analyze', data=data, headers=auth_headers, content_type='multipart/form-data')
        assert res.status_code == 200
        assert b'"status": "success"' in res.data
        assert b'"compatibility_score"' in res.data
        assert b'"matched_skills"' in res.data
        assert b'"missing_skills"' in res.data
        assert b'"processing_time_ms"' in res.data

    def test_analyze_missing_cv_file(self, client, auth_headers):
        """Sin CV → 400 con campo error"""
        data = {'job_offer_text': 'Se busca desarrollador React.'}
        res = client.post('/api/v1/analyze', data=data, headers=auth_headers, content_type='multipart/form-data')
        assert res.status_code == 200
        assert b'"status": "error"' in res.data

    def test_analyze_missing_job_offer(self, client, auth_headers):
        """Sin texto de oferta → 400"""
        data = {'cv_file': (BytesIO(b"dummy"), 'cv.pdf')}
        res = client.post('/api/v1/analyze', data=data, headers=auth_headers, content_type='multipart/form-data')
        assert res.status_code == 200
        assert b'"status": "error"' in res.data

    def test_analyze_score_range(self, client, auth_headers):
        """El score de compatibilidad debe estar entre 0 y 100"""
        data = {
            'job_offer_text': 'Se busca ingeniero de datos.',
            'cv_file': (BytesIO(b"pdf content"), 'cv.pdf')
        }
        res = client.post('/api/v1/analyze', data=data, headers=auth_headers, content_type='multipart/form-data')
        assert res.status_code == 200
        # Parse the last event to find the score
        data_str = res.data.decode('utf-8')
        last_event = [line for line in data_str.split('\n') if 'compatibility_score' in line][-1]
        score_data = json.loads(last_event.replace('data: ', ''))
        score = score_data['compatibility_score']
        assert 0 <= score <= 100

    def test_analyze_unauthorized(self, client):
        """Análisis sin token debe devolver 401"""
        data = {
            'job_offer_text': 'Buscamos experto en SQL.',
            'cv_file': (BytesIO(b"pdf content"), 'cv.pdf')
        }
        res = client.post('/api/v1/analyze', data=data, content_type='multipart/form-data')
        assert res.status_code == 401
        assert res.json['message'] == 'Token is missing!'

# =============================================================================
# HISTORY - /api/v1/users/<id>/history
# =============================================================================

class TestHistory:
    """Tests para el endpoint de historial evolutivo"""

    def test_get_history_empty(self, client, auth_headers):
        """Historial vacío para un usuario nuevo"""
        # Obtenemos el user_id a partir del token para asegurarnos
        # que el token corresponde al usuario (aunque la restriccion de g.user_id fue removida)
        res = client.get('/api/v1/users/999/history', headers=auth_headers)
        assert res.status_code == 200
        assert res.json == []

    def test_get_history_after_analysis(self, client):
        """Historial refleja el análisis realizado"""
        # 1. Crear usuario
        create = client.post('/api/v1/users/register',
                             data=json.dumps({"name": "History User", "email": "hist@test.com", "password": "p"}),
                             content_type='application/json')
        user_id = create.json['user_id']
        token = create.json['token']
        my_headers = {'Authorization': f'Bearer {token}'}

        # 2. Hacer un análisis
        data = {
            'job_offer_text': 'Desarrollador React'
        }
        data['cv_file'] = (BytesIO(b"React Developer"), 'cv.pdf')
        res_analyze = client.post('/api/v1/analyze', data=data, headers=my_headers, content_type='multipart/form-data')
        _ = res_analyze.data # Consume the SSE stream to execute DB inserts

        # 3. Consultar historial
        res = client.get(f'/api/v1/users/{user_id}/history', headers=my_headers)
        assert res.status_code == 200
        assert len(res.json) > 0
        assert 'compatibility_score' in res.json[0]
        assert 'version_number' in res.json[0]
        assert 'job_offer_title' in res.json[0]


# =============================================================================
# JOB OFFERS - /api/v1/job-offers/extract
# =============================================================================

class TestJobOffers:
    """Tests para el endpoint de extracción de ofertas de trabajo"""

    def test_extract_job_offer_text_success(self, client, auth_headers):
        """Extracción de oferta de empleo enviando texto plano"""
        payload = {
            "text": "Buscamos un desarrollador Python senior con experiencia en SQL."
        }
        res = client.post('/api/v1/job-offers/extract',
                          data=json.dumps(payload),
                          headers=auth_headers,
                          content_type='application/json')
        assert res.status_code == 200
        assert res.json['status'] == 'success'
        assert 'job_offer_id' in res.json
        assert res.json['data']['job_title'] == 'Desarrollador Python'
        assert res.json['data']['company'] == 'Empresa de Prueba'

    def test_extract_job_offer_missing_payload(self, client, auth_headers):
        """Extracción sin URL ni texto -> 400"""
        payload = {}
        res = client.post('/api/v1/job-offers/extract',
                          data=json.dumps(payload),
                          headers=auth_headers,
                          content_type='application/json')
        assert res.status_code == 400
        assert res.json['status'] == 'error'

    def test_extract_job_offer_unauthorized(self, client):
        """Llamada sin token -> 401"""
        payload = {"text": "dummy"}
        res = client.post('/api/v1/job-offers/extract',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 401


# =============================================================================
# IMPROVE CV - /api/v1/improve-cv
# =============================================================================

class TestImproveCV:
    """Tests para el endpoint de optimización de CV con IA"""

    def test_improve_cv_success(self, client, auth_headers):
        """Optimización de CV exitosa"""
        # 1. Crear usuario y realizar análisis preliminar para generar un cv_version_id
        analysis_data = {
            'job_offer_text': 'Desarrollador React',
            'cv_file': (BytesIO(b"React Developer"), 'cv.pdf')
        }
        
        create = client.post('/api/v1/users/register',
                             data=json.dumps({"name": "CV User", "email": "cvuser@test.com", "password": "p"}),
                             content_type='application/json')
        user_id = create.json['user_id']
        token = create.json['token']
        my_headers = {'Authorization': f'Bearer {token}'}

        res_analyze = client.post('/api/v1/analyze', data=analysis_data, headers=my_headers, content_type='multipart/form-data')
        _ = res_analyze.data # Consumir

        history_res = client.get(f'/api/v1/users/{user_id}/history', headers=my_headers)
        cv_version_id = history_res.json[0]['version_id']

        # 2. Llamar a mejorar CV
        improve_payload = {
            "cv_version_id": cv_version_id,
            "skills_to_add": ["Docker", "Kubernetes"]
        }
        res_improve = client.post('/api/v1/improve-cv',
                                  data=json.dumps(improve_payload),
                                  headers=my_headers,
                                  content_type='application/json')
        assert res_improve.status_code == 200
        assert res_improve.json['status'] == 'success'
        assert 'optimized_json' in res_improve.json
        assert res_improve.json['optimized_json']['personal_info']['name'] == 'Juan Lopez'

    def test_improve_cv_not_found(self, client, auth_headers):
        """Intento de mejorar un CV inexistente -> 404"""
        payload = {
            "cv_version_id": 9999,
            "skills_to_add": ["Docker"]
        }
        res = client.post('/api/v1/improve-cv',
                          data=json.dumps(payload),
                          headers=auth_headers,
                          content_type='application/json')
        assert res.status_code == 404
        assert res.json['status'] == 'error'

    def test_improve_cv_missing_id(self, client, auth_headers):
        """Falta cv_version_id en el payload -> 400"""
        payload = {"skills_to_add": []}
        res = client.post('/api/v1/improve-cv',
                          data=json.dumps(payload),
                          headers=auth_headers,
                          content_type='application/json')
        assert res.status_code == 400


# =============================================================================
# CV VERSIONS - /api/v1/cv-versions/<id>
# =============================================================================

class TestCvVersions:
    """Tests para la obtención y actualización de versiones de CV desde el editor"""

    def test_get_and_update_cv_version(self, client):
        """GET y PUT de versiones de CV en base de datos"""
        # 1. Registrar usuario
        create = client.post('/api/v1/users/register',
                             data=json.dumps({"name": "Editor User", "email": "edituser@test.com", "password": "p"}),
                             content_type='application/json')
        user_id = create.json['user_id']
        token = create.json['token']
        my_headers = {'Authorization': f'Bearer {token}'}

        # 2. Subir un CV para generar una versión
        analysis_data = {
            'job_offer_text': 'Requisitos',
            'cv_file': (BytesIO(b"CV Text"), 'cv.pdf')
        }
        res_analyze = client.post('/api/v1/analyze', data=analysis_data, headers=my_headers, content_type='multipart/form-data')
        _ = res_analyze.data

        # 3. Consultar la versión creada
        history_res = client.get(f'/api/v1/users/{user_id}/history', headers=my_headers)
        cv_version_id = history_res.json[0]['version_id']

        res_get = client.get(f'/api/v1/cv-versions/{cv_version_id}', headers=my_headers)
        assert res_get.status_code == 200
        assert res_get.json['status'] == 'success'
        assert 'data' in res_get.json
        assert 'structured_data' in res_get.json['data']

        # 4. Actualizar los datos estructurados (PUT)
        new_structured_data = {
            "personal_info": {"name": "Juan Lopez Perez", "title": "Lead Dev"},
            "summary": "Resumen actualizado",
            "skills": ["Python", "Flask", "React"]
        }
        res_put = client.put(f'/api/v1/cv-versions/{cv_version_id}',
                             data=json.dumps({"structured_data": new_structured_data}),
                             headers=my_headers,
                             content_type='application/json')
        assert res_put.status_code == 200
        assert res_put.json['status'] == 'success'

        # 5. Volver a consultar y verificar que los cambios persistan
        res_get_updated = client.get(f'/api/v1/cv-versions/{cv_version_id}', headers=my_headers)
        assert res_get_updated.json['data']['structured_data']['personal_info']['name'] == 'Juan Lopez Perez'
        assert res_get_updated.json['data']['structured_data']['summary'] == 'Resumen actualizado'

    def test_get_cv_version_not_found(self, client, auth_headers):
        """GET de versión inexistente -> 404"""
        res = client.get('/api/v1/cv-versions/9999', headers=auth_headers)
        assert res.status_code == 404
        assert res.json['status'] == 'error'

    def test_update_cv_version_missing_data(self, client, auth_headers):
        """PUT de versión sin structured_data -> 400"""
        res = client.put('/api/v1/cv-versions/9999',
                         data=json.dumps({}),
                         headers=auth_headers,
                         content_type='application/json')
        assert res.status_code == 400


# =============================================================================
# USER EVOLUTION - /api/v1/users/<id>/evolution
# =============================================================================

class TestUserEvolution:
    """Tests para el endpoint de evolución histórica de compatibilidad"""

    def test_get_user_evolution_empty(self, client, auth_headers):
        """Evolución vacía para un usuario nuevo"""
        res = client.get('/api/v1/users/999/evolution', headers=auth_headers)
        assert res.status_code == 200
        assert res.json == []

    def test_get_user_evolution_after_analysis(self, client):
        """Evolución muestra los datos del análisis realizado"""
        # 1. Registrar usuario
        create = client.post('/api/v1/users/register',
                             data=json.dumps({"name": "Evolution User", "email": "evol@test.com", "password": "p"}),
                             content_type='application/json')
        user_id = create.json['user_id']
        token = create.json['token']
        my_headers = {'Authorization': f'Bearer {token}'}

        # 2. Hacer un análisis
        analysis_data = {
            'job_offer_text': 'Requisitos de prueba',
            'cv_file': (BytesIO(b"CV Text"), 'cv.pdf')
        }
        res_analyze = client.post('/api/v1/analyze', data=analysis_data, headers=my_headers, content_type='multipart/form-data')
        _ = res_analyze.data

        # 3. Consultar evolución
        res = client.get(f'/api/v1/users/{user_id}/evolution', headers=my_headers)
        assert res.status_code == 200
        assert len(res.json) > 0
        assert 'compatibility_score' in res.json[0]
        assert 'version_id' in res.json[0]
        assert 'version_number' in res.json[0]


# =============================================================================
# HEALTH - /api/v1/health
# =============================================================================

class TestHealth:
    """Tests para el endpoint de health-check del backend"""

    def test_health_check(self, client):
        """El endpoint health debe estar activo y devolver 200"""
        res = client.get('/api/v1/health')
        assert res.status_code == 200
        assert res.json['status'] == 'healthy'
        assert 'timestamp' in res.json
        assert res.json['service'] == 'cvsmartai-backend'


# =============================================================================
# TRANSLATE CV - /api/v1/translate-cv
# =============================================================================

class TestTranslateCV:
    """Tests para el endpoint de traducción de CV con Gemini"""

    def test_translate_cv_success(self, client, auth_headers):
        """Traducción exitosa con datos correctos y autenticación"""
        payload = {
            "cv_data": {
                "personalInfo": {"fullName": "Juan Lopez", "title": "Developer"},
                "summary": "Resumen profesional",
                "experience": [],
                "education": [],
                "skills": []
            },
            "target_language": "en"
        }
        res = client.post('/api/v1/translate-cv',
                          data=json.dumps(payload),
                          headers=auth_headers,
                          content_type='application/json')
        assert res.status_code == 200
        assert res.json['status'] == 'success'
        assert 'translated_data' in res.json
        assert res.json['translated_data']['personalInfo']['fullName'] == "Translated Name"

    def test_translate_cv_missing_data(self, client, auth_headers):
        """Traducción falla si falta cv_data o target_language (400)"""
        payload = {
            "target_language": "en"
        }
        res = client.post('/api/v1/translate-cv',
                          data=json.dumps(payload),
                          headers=auth_headers,
                          content_type='application/json')
        assert res.status_code == 400
        assert res.json['status'] == 'error'

    def test_translate_cv_unauthorized(self, client):
        """Traducción falla si no está autenticado (401)"""
        payload = {
            "cv_data": {},
            "target_language": "en"
        }
        res = client.post('/api/v1/translate-cv',
                          data=json.dumps(payload),
                          content_type='application/json')
        assert res.status_code == 401


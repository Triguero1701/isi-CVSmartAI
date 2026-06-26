import json
from io import BytesIO

class TestIntegrationFlow:
    """Pruebas de integración de extremo a extremo que simulan la interacción

    de los distintos componentes y base de datos de CVSmartAI.
    """

    def test_e2e_user_lifecycle_and_cv_management(self, client):
        # 1. REGISTRO DE UN NUEVO USUARIO
        user_payload = {
            "name": "Integration Tester",
            "email": "tester_int@cvsmartai.com",
            "password": "integration_password_123"
        }
        reg_res = client.post('/api/v1/users/register',
                              data=json.dumps(user_payload),
                              content_type='application/json')
        assert reg_res.status_code == 201
        assert reg_res.json['status'] == 'success'
        assert 'user_id' in reg_res.json
        assert 'token' in reg_res.json
        
        user_id = reg_res.json['user_id']
        token = reg_res.json['token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. INICIO DE SESIÓN PARA VALIDAR CREDENCIALES
        login_payload = {
            "email": "tester_int@cvsmartai.com",
            "password": "integration_password_123"
        }
        login_res = client.post('/api/v1/users/login',
                               data=json.dumps(login_payload),
                               content_type='application/json')
        assert login_res.status_code == 200
        assert login_res.json['status'] == 'success'
        assert login_res.json['user_id'] == user_id
        assert 'token' in login_res.json

        # 3. EXTRACCIÓN DE UNA OFERTA DE EMPLEO
        job_offer_payload = {
            "text": "Buscamos un Ingeniero de Software Senior con conocimientos sólidos de Python, React y PostgreSQL."
        }
        job_res = client.post('/api/v1/job-offers/extract',
                             data=json.dumps(job_offer_payload),
                             headers=headers,
                             content_type='application/json')
        assert job_res.status_code == 200
        assert job_res.json['status'] == 'success'
        assert 'job_offer_id' in job_res.json
        assert job_res.json['data']['job_title'] == "Desarrollador Python" # Mocked in conftest.py
        
        job_offer_id = job_res.json['job_offer_id']

        # 4. ANÁLISIS DE CV FRENTE A LA OFERTA DE TRABAJO
        # Subimos un archivo PDF dummy simulado con BytesIO
        cv_data = {
            'job_offer_text': 'Requisitos de la oferta',
            'job_offer_id': job_offer_id,
            'cv_file': (BytesIO(b"CV del Ingeniero de Software con Python y PostgreSQL"), 'cv_tester.pdf')
        }
        
        analyze_res = client.post('/api/v1/analyze',
                                  data=cv_data,
                                  headers=headers,
                                  content_type='multipart/form-data')
        
        assert analyze_res.status_code == 200
        
        # Como es una respuesta en streaming (SSE), consumimos los datos para procesar la inserción en BD
        response_text = analyze_res.data.decode('utf-8')
        lines = [line for line in response_text.split('\n') if line.startswith('data:')]
        
        # Validamos que se hayan emitido eventos de progreso y éxito
        assert len(lines) > 0
        
        # El último mensaje debe contener el éxito y los datos procesados
        last_event_data = json.loads(lines[-1].replace('data: ', ''))
        assert last_event_data['status'] == 'success'
        assert 'cv_version_id' in last_event_data
        assert last_event_data['compatibility_score'] == 80 # Mocked value in conftest.py
        
        cv_version_id = last_event_data['cv_version_id']

        # 5. CONSULTA DE HISTORIAL DEL USUARIO
        history_res = client.get(f'/api/v1/users/{user_id}/history', headers=headers)
        assert history_res.status_code == 200
        history_list = history_res.json
        assert len(history_list) == 1
        assert history_list[0]['version_id'] == cv_version_id
        assert history_list[0]['compatibility_score'] == 80
        assert history_list[0]['version_number'] == 1

        # 6. OBTENER DETALLE DE LA VERSIÓN DE CV DESDE EL EDITOR
        version_res = client.get(f'/api/v1/cv-versions/{cv_version_id}', headers=headers)
        assert version_res.status_code == 200
        assert version_res.json['status'] == 'success'
        assert 'structured_data' in version_res.json['data']

        # 7. MODIFICAR/GUARDAR CAMBIOS DESDE EL EDITOR
        updated_structured_data = {
            "personal_info": {"name": "Integration Tester Updated", "title": "Senior Staff Engineer"},
            "summary": "Resumen integrado y mejorado",
            "skills": ["Python", "React", "PostgreSQL", "Docker"]
        }
        
        update_res = client.put(f'/api/v1/cv-versions/{cv_version_id}',
                                data=json.dumps({"structured_data": updated_structured_data}),
                                headers=headers,
                                content_type='application/json')
        assert update_res.status_code == 200
        assert update_res.json['status'] == 'success'

        # 8. VERIFICAR LA PERSISTENCIA DE LOS CAMBIOS DEL EDITOR
        version_updated_res = client.get(f'/api/v1/cv-versions/{cv_version_id}', headers=headers)
        assert version_updated_res.status_code == 200
        saved_data = version_updated_res.json['data']['structured_data']
        assert saved_data['personal_info']['name'] == "Integration Tester Updated"
        assert saved_data['summary'] == "Resumen integrado y mejorado"
        assert "Docker" in saved_data['skills']

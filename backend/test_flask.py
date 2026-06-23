import json
from app import create_app

app = create_app()
client = app.test_client()

payload = {"email": "admin@cvsmartai.com", "password": "admin123"}
res = client.post('/api/v1/users/login', data=json.dumps(payload), content_type='application/json')
print("Status Code:", res.status_code)
print("Response JSON:", res.get_json())

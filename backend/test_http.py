import requests
import json

payload = {"email": "admin@cvsmartai.com", "password": "admin123"}
try:
    res = requests.post('http://localhost:5000/api/v1/users/login', json=payload)
    print("Local HTTP Status:", res.status_code)
    print("Local HTTP Response:", res.json())
except Exception as e:
    print("HTTP Request Error:", e)

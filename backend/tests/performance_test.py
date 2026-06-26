import time
import requests
import os
import sys

BASE_URL = os.environ.get('TARGET_URL', 'http://localhost:5000')

print("==================================================")
print("          CVSmartAI - Pruebas de Rendimiento      ")
print("==================================================")
print(f"URL Objetivo: {BASE_URL}")
print("Evaluando cumplimiento de SLAs de Latencia...\n")

# Definir los SLAs (límites máximos en milisegundos para el tiempo promedio)
SLA_LIMITS = {
    "health": 50,       # /api/v1/health
    "register": 200,    # /api/v1/users/register
    "login": 200,       # /api/v1/users/login
    "history": 150,     # /api/v1/users/<id>/history
    "skills": 150       # /api/v1/skills
}

test_user = {
    "name": "Perf Test User",
    "email": f"perftest_{int(time.time())}@test.com",
    "password": "perf_password_123"
}

failed = False

def measure_average_latency(method, url, payload=None, headers=None, iterations=5):
    latencies = []
    for _ in range(iterations):
        try:
            start = time.perf_counter()
            if method == "GET":
                res = requests.get(url, headers=headers, timeout=5)
            elif method == "POST":
                res = requests.post(url, json=payload, headers=headers, timeout=5)
            elapsed = (time.perf_counter() - start) * 1000
            
            # Solo acumulamos latencia si la petición fue exitosa (200 o 201)
            if res.status_code in [200, 201]:
                latencies.append(elapsed)
            else:
                print(f"  [ERROR] HTTP {res.status_code} al llamar a {url}")
                return None
        except Exception as e:
            print(f"  [EXCEPCIÓN] Error de conexión a {url}: {e}")
            return None
        time.sleep(0.02) # Pausa mínima
        
    return sum(latencies) / len(latencies) if latencies else None

# 1. TEST: Health
print("1. Probando `/api/v1/health`...")
avg_health = measure_average_latency("GET", f"{BASE_URL}/api/v1/health")
if avg_health is not None:
    limit = SLA_LIMITS["health"]
    status = "PASS" if avg_health <= limit else "FAIL"
    print(f"   -> Latencia Promedio: {avg_health:.2f} ms (Límite SLA: {limit} ms) - [{status}]")
    if status == "FAIL": failed = True
else:
    print("   -> Falló la obtención de métricas.")
    failed = True

# 2. TEST: Register
print("\n2. Probando `/api/v1/users/register`...")
avg_register = measure_average_latency("POST", f"{BASE_URL}/api/v1/users/register", payload=test_user, iterations=1)
if avg_register is not None:
    limit = SLA_LIMITS["register"]
    status = "PASS" if avg_register <= limit else "FAIL"
    print(f"   -> Latencia Registro: {avg_register:.2f} ms (Límite SLA: {limit} ms) - [{status}]")
    if status == "FAIL": failed = True
else:
    print("   -> Falló la obtención de métricas.")
    failed = True

# 3. TEST: Login
print("\n3. Probando `/api/v1/users/login`...")
login_payload = {"email": test_user["email"], "password": test_user["password"]}
avg_login = measure_average_latency("POST", f"{BASE_URL}/api/v1/users/login", payload=login_payload)
token = None
user_id = None

# Obtener token de login de forma separada para usar en siguientes llamadas
try:
    res = requests.post(f"{BASE_URL}/api/v1/users/login", json=login_payload, timeout=5)
    token = res.json().get("token")
    user_id = res.json().get("user_id")
except:
    pass

if avg_login is not None:
    limit = SLA_LIMITS["login"]
    status = "PASS" if avg_login <= limit else "FAIL"
    print(f"   -> Latencia Promedio: {avg_login:.2f} ms (Límite SLA: {limit} ms) - [{status}]")
    if status == "FAIL": failed = True
else:
    print("   -> Falló la obtención de métricas.")
    failed = True

headers = {"Authorization": f"Bearer {token}"} if token else {}

# 4. TEST: History
print("\n4. Probando `/api/v1/users/<id>/history`...")
if user_id:
    avg_history = measure_average_latency("GET", f"{BASE_URL}/api/v1/users/{user_id}/history", headers=headers)
    if avg_history is not None:
        limit = SLA_LIMITS["history"]
        status = "PASS" if avg_history <= limit else "FAIL"
        print(f"   -> Latencia Promedio: {avg_history:.2f} ms (Límite SLA: {limit} ms) - [{status}]")
        if status == "FAIL": failed = True
    else:
        print("   -> Falló la obtención de métricas.")
        failed = True
else:
    print("   -> Saltado (No se obtuvo ID de usuario).")
    failed = True

# 5. TEST: Skills
print("\n5. Probando `/api/v1/skills`...")
avg_skills = measure_average_latency("GET", f"{BASE_URL}/api/v1/skills")
if avg_skills is not None:
    limit = SLA_LIMITS["skills"]
    status = "PASS" if avg_skills <= limit else "FAIL"
    print(f"   -> Latencia Promedio: {avg_skills:.2f} ms (Límite SLA: {limit} ms) - [{status}]")
    if status == "FAIL": failed = True
else:
    print("   -> Falló la obtención de métricas.")
    failed = True

print("\n==================================================")
if failed:
    print(" [ERROR] Al menos una prueba de rendimiento excedió el SLA.")
    print("==================================================")
    sys.exit(1)
else:
    print(" [ÉXITO] Todas las pruebas de rendimiento cumplen con el SLA.")
    print("==================================================")
    sys.exit(0)

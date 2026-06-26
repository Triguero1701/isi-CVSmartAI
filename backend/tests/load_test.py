import time
import requests
import threading
import statistics
import os
import sys

# Parámetros del test de carga
BASE_URL = os.environ.get('TARGET_URL', 'http://localhost:5000')
CONCURRENCY = int(os.environ.get('CONCURRENCY', '10'))
DURATION_SECONDS = int(os.environ.get('DURATION', '5'))

print("==================================================")
print("             CVSmartAI - Test de Carga            ")
print("==================================================")
print(f"URL Objetivo: {BASE_URL}")
print(f"Usuarios Concurrentes: {CONCURRENCY}")
print(f"Duración: {DURATION_SECONDS} segundos")
print("Preparando entorno de prueba...")

# Registrar un usuario de prueba dedicado para no depender de semillas previas
test_user = {
    "name": "Load Test User",
    "email": f"loadtest_{int(time.time())}@test.com",
    "password": "load_password_123"
}

try:
    reg_res = requests.post(f"{BASE_URL}/api/v1/users/register", json=test_user, timeout=5)
    if reg_res.status_code == 201:
        user_id = reg_res.json()['user_id']
        print(f"Usuario de prueba registrado con éxito (ID: {user_id}).")
    else:
        # Si ya existiera
        print("Advertencia: No se pudo registrar un usuario nuevo. Intentando continuar...")
        user_id = 1
except Exception as e:
    print(f"Error crítico al registrar usuario: {e}")
    sys.exit(1)

# Lista para acumular las latencias de las peticiones individuales en ms
latencies = []
status_codes = {}
lock = threading.Lock()

stop_threads = False

def simulate_user_session():
    global stop_threads
    session = requests.Session()
    
    # Endpoint targets
    login_url = f"{BASE_URL}/api/v1/users/login"
    history_url = f"{BASE_URL}/api/v1/users/{user_id}/history"
    health_url = f"{BASE_URL}/api/v1/health"
    
    login_payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    
    token = None
    
    while not stop_threads:
        # 1. Login
        try:
            start = time.perf_counter()
            res = session.post(login_url, json=login_payload, timeout=3)
            elapsed = (time.perf_counter() - start) * 1000
            
            with lock:
                latencies.append(elapsed)
                status_codes[res.status_code] = status_codes.get(res.status_code, 0) + 1
                
            if res.status_code == 200:
                token = res.json().get('token')
        except requests.RequestException as e:
            with lock:
                status_codes['error'] = status_codes.get('error', 0) + 1
        
        # 2. Health Check
        try:
            start = time.perf_counter()
            res = session.get(health_url, timeout=3)
            elapsed = (time.perf_counter() - start) * 1000
            
            with lock:
                latencies.append(elapsed)
                status_codes[res.status_code] = status_codes.get(res.status_code, 0) + 1
        except requests.RequestException as e:
            with lock:
                status_codes['error'] = status_codes.get('error', 0) + 1
                
        # 3. Fetch History (si tenemos token)
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            try:
                start = time.perf_counter()
                res = session.get(history_url, headers=headers, timeout=3)
                elapsed = (time.perf_counter() - start) * 1000
                
                with lock:
                    latencies.append(elapsed)
                    status_codes[res.status_code] = status_codes.get(res.status_code, 0) + 1
            except requests.RequestException as e:
                with lock:
                    status_codes['error'] = status_codes.get('error', 0) + 1
                    
        # Pequeña pausa para no saturar al 100% de forma irreal
        time.sleep(0.05)

# Iniciar los hilos de simulación
threads = []
start_time = time.time()

for i in range(CONCURRENCY):
    t = threading.Thread(target=simulate_user_session)
    t.daemon = True
    threads.append(t)
    t.start()

print(f"Ejecutando test durante {DURATION_SECONDS} segundos...")
time.sleep(DURATION_SECONDS)

# Parar la ejecución
stop_threads = True
for t in threads:
    t.join(timeout=1)

end_time = time.time()
actual_duration = end_time - start_time
total_requests = len(latencies) + status_codes.get('error', 0)

print("\n==================================================")
print("             RESULTADOS DEL TEST DE CARGA         ")
print("==================================================")
print(f"Duración Real: {actual_duration:.2f} segundos")
print(f"Peticiones Totales: {total_requests}")

if total_requests > 0:
    rps = total_requests / actual_duration
    print(f"Rendimiento (RPS): {rps:.2f} req/seg")
    
    # Códigos de respuesta HTTP
    print("\nCódigos de Estado HTTP:")
    for code, count in status_codes.items():
        pct = (count / total_requests) * 100
        print(f"  - {code}: {count} ({pct:.1f}%)")
        
    if latencies:
        min_lat = min(latencies)
        max_lat = max(latencies)
        avg_lat = statistics.mean(latencies)
        p95_lat = statistics.quantiles(latencies, n=20)[18]  # percentil 95
        
        print("\nEstadísticas de Latencia (ms):")
        print(f"  - Mínimo:       {min_lat:.2f} ms")
        print(f"  - Máximo:       {max_lat:.2f} ms")
        print(f"  - Promedio:     {avg_lat:.2f} ms")
        print(f"  - Percentil 95: {p95_lat:.2f} ms")
else:
    print("No se pudieron completar peticiones durante el test.")
print("==================================================\n")

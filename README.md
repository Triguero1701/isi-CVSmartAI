# CVSmartAI - SaaS de Optimización de CV con IA

[![Licencia](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18-61dafb.svg)](https://reactjs.org/)

---

## 📚 Documentación del Proyecto
- **[Documentación Técnica (Hito 3)](TECHNICAL_DOCUMENTATION.md)**: Arquitectura detallada, diagramas Mermaid, Referencia de API y Modelo de Datos.
- **[Manual de Usuario](USER_MANUAL.md)**: Guía de uso de la plataforma para el usuario final.
- **[Estudio de Viabilidad](FEASIBILITY_STUDY.md)**: Análisis de costes y mercado.

---

## 🚀 Sobre el Proyecto
CVSmartAI es una plataforma integral de análisis y optimización de currículums (CVs) basada en inteligencia artificial. Utiliza **Google Document AI** para extraer el contenido de los currículums con máxima precisión y **Google Gemini** para evaluar semánticamente los perfiles contra ofertas laborales reales, sugiriendo mejoras y permitiendo generar un CV optimizado dinámicamente en PDF.

---

## 🚢 Automatización del Despliegue

Para el **Hito 3**, el despliegue se ha automatizado íntegramente mediante **Docker Compose**, lo que garantiza que la aplicación funcione exactamente igual en cualquier entorno (Local, Staging o Producción).

### ⚙️ Flujo de Despliegue Automatizado
1.  **Construcción de Imágenes**: Las imágenes de Frontend y Backend se basan en entornos optimizados (Node 20-alpine y Python 3.10-slim).
2.  **Orquestación**: Docker Compose gestiona la red interna, el volumen de persistencia para PostgreSQL y el orden de encendido de los servicios.
3.  **Comando Único**: Todo el ecosistema se levanta con un solo comando:
    ```bash
    docker-compose up --build -d
    ```

### 📈 Monitorización de Salud
Una vez desplegado, el sistema cuenta con un endpoint de salud integrado:
- **Salud del Backend**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🛠️ Guía de Despliegue Paso a Paso

### Requisitos Previos
Asegúrate de tener instalado:
- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)


### Paso 1: Clonar el Repositorio

Abre tu terminal y clona el proyecto en tu máquina local:

```bash
git clone https://github.com/Triguero1701/isi-CVSmartAI.git
cd isi-CVSmartAI
```

### 2. Configuración de Credenciales
El backend requiere credenciales para conectarse a Google Cloud y Gemini.
1. **Archivo `.env`**: Coloca tu archivo `.env` en la carpeta `backend/`.
2. **Credenciales de Google**: Guarda tu `service_account.json` en `backend/credentials/`.

### 3. Ejecución
Desde la raíz del proyecto:
```bash
docker-compose up --build -d
```

### 4. Poblar la Base de Datos
Indispensable para el primer uso y para ver datos en el Dashboard:
```bash
docker exec cvsmartai_backend python /scripts/setup_db.py
```
*Esto creará un usuario administrador:*
- **Email:** `admin@cvsmartai.com`
- **Contraseña:** `admin123`

### 5. Acceso
- **Plataforma Web:** [http://localhost:5173](http://localhost:5173)
- **API (Backend):** [http://localhost:5000](http://localhost:5000)

---

## ✅ Comprobación del Sistema (Testing)
Puedes ejecutar la suite de pruebas unitarias para validar los endpoints:
```bash
cd backend
pytest tests/
```



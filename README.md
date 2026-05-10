# CVSmartAI - SaaS de Optimización de CV con IA

[![Licencia](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18-61dafb.svg)](https://reactjs.org/)

---

## 📚 Documentación del Proyecto
- **[Documentación Técnica (Hito 3)](TECHNICAL_DOCUMENTATION.md)**: Arquitectura detallada, diagramas Mermaid, Referencia de API y Modelo de Datos.
- **[Guía de Instalación Rápida (README2)](README2.md)**: Pasos simplificados para desplegar con Docker.

---

## ✨ Características Principales
- **Análisis de Compatibilidad:** Evaluación semántica entre tu CV y ofertas de trabajo mediante Google Gemini.
- **Scraping Automático:** Extracción de ofertas laborales desde URLs (LinkedIn, InfoJobs) automáticamente.
- **Feedback en Tiempo Real:** Carga progresiva de los análisis usando SSE (Server-Sent Events).
- **Seguridad (JWT):** Acceso protegido mediante autenticación por tokens.
- **Dashboard Analítico y Reportes:** Gráficas de evolución, diffing visual de skills entre versiones de CVs, y exportación a PDF.

A continuación, encontrarás la hoja de ruta paso a paso para tener todo el entorno funcionando correctamente en tu máquina local.

## 📋 Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu sistema:

- **Python 3.8+** (Recomendado 3.10 o superior)
- **Git**

---

## 🚀 Instalación y Despliegue (Recomendado: Docker)

La forma más rápida, limpia y recomendada de levantar todo el ecosistema (Base de Datos, Backend Flask y Frontend React) es utilizando Docker Compose.

### 1. Clonar el repositorio y configurar el entorno

Abre tu terminal y clona el proyecto:

```bash
git clone <URL_DEL_REPOSITORIO>
cd CVSmartAi
```

Configura las variables de entorno para el backend copiando el archivo de ejemplo:

```bash
# En Windows
copy backend\.env.example backend\.env
# En macOS/Linux
cp backend/.env.example backend/.env
```

Abre `backend/.env` y asegúrate de rellenar:
- `JWT_SECRET_KEY`: Una clave secreta para la generación de tokens (por ejemplo: `mi_clave_super_secreta_123`).
*(La URL de la base de datos `DATABASE_URL` se sobreescribe automáticamente en la red de Docker Compose).*

### 2. Levantar la plataforma con Docker

Asegúrate de tener **Docker Desktop** (o el servicio de Docker daemon) en ejecución. En la raíz del proyecto, ejecuta:

```bash
docker-compose up --build -d
```

Este comando descargará las imágenes, construirá el Backend y el Frontend, y levantará los tres servicios en segundo plano.

### 3. Poblar la Base de Datos (Estructura y Datos Ficticios)

Una vez que los contenedores estén corriendo, debes inicializar la base de datos y generar usuarios e historiales de prueba. Para ello, ejecuta el script de configuración *dentro* del contenedor del backend:

```bash
docker exec cvsmartai_backend python /scripts/setup_db.py
```

Si todo va bien, verás mensajes indicando que la base de datos se ha creado correctamente y se han insertado los datos ficticios para el Dashboard.

### 4. Acceder a la Aplicación

¡Todo está listo!
- **Frontend (React)**: Abre tu navegador en [http://localhost:5173/](http://localhost:5173/)
- **Backend (API Flask)**: Escuchando de fondo en [http://localhost:5000/](http://localhost:5000/)

Los volúmenes de Docker están configurados para que cualquier cambio que hagas en tu editor sobre el código de `/frontend` o `/backend` se refleje automáticamente (*Hot-Reloading*) sin tener que reiniciar los contenedores manualmente.

---

<details>
<summary><b>Alternativa: Instalación Manual (Sin Dockerizar Frontend/Backend)</b></summary>
<br>

Si prefieres ejecutar el código localmente a la antigua usanza:

1. **Base de Datos**: Levanta solo Postgres (asegúrate de que en el `.env` el `DATABASE_URL` apunte a `localhost:5432`).
   ```bash
   docker-compose up db -d
   ```
2. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   # Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   python run.py
   ```
3. **Datos de Prueba**: (En otra terminal, con el `venv` activado)
   ```bash
   python scripts/setup_db.py
   ```
4. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
</details>

---

## ✅ Comprobación del Sistema (Testing)

El proyecto incluye una robusta suite de pruebas unitarias (`pytest`). Si quieres comprobar que todos los endpoints y la base de datos funcionan según lo esperado, puedes correr los tests:

1. Abre una nueva terminal.
2. Navega a la carpeta `/backend/`.
3. Activa tu entorno virtual (`venv\Scripts\activate`).
4. Ejecuta:

   ```bash
   pytest tests/
   ```

Verás que todos los tests pasarán al 100% de manera exitosa cubriendo rutas, registro de usuarios, base de datos en memoria (aislada), etc.

---

## 👨‍🏫 Instrucciones para la Evaluación (Profesor)

Por motivos de seguridad, **las credenciales de Google Cloud (`.env` y `service_account.json`) no se han subido al repositorio público**.

Si clonas este repositorio y arrancas el servidor, la aplicación lanzará un error si intentas analizar un PDF real. Sin embargo, el proyecto está preparado para su evaluación de dos formas:

1. **Evaluación de Código y Lógica (Sin Facturación Google ni APIs):**
   Puedes ejecutar toda la suite de tests (`pytest backend/tests/ -v`). En el código he implementado un sistema de *Mocks* (`unittest.mock.patch` en `conftest.py`) que simula la respuesta de los servidores de Google Document AI y del LLM Gemini. **Los tests pasarán en verde con un 100% de éxito demostrando que la API funciona** sin necesidad de crear proyectos ni añadir tarjetas de crédito.

2. **Evaluación Funcional Completa (Conexión Real con Google Cloud y Gemini):**
   Si deseas probar el OCR de Google Document AI procesando un archivo PDF real así como el análisis semántico de Gemini LLM:

   - **Opción Rápida (Recomendada para el profesor):** Pide al alumno los archivos de configuración ya preparados (`service_account.json` y un `.env` completo que incluye la `GEMINI_API_KEY`).
     1. Coloca el `service_account.json` en `backend/credentials/`.
     2. Coloca el archivo `.env` en la carpeta `backend/` (tienes un `backend/.env.example` como guía de la estructura).
     3. Arranca el servidor Flask y la API procesará tu petición en directo.

   - **Opción Manual (Si deseas usar tus propias credenciales):**
     1. **Para Gemini LLM**: Obtén tu propia `GEMINI_API_KEY` en Google AI Studio y añádela a tu `.env`.
     2. **Para Document AI**: Configura el procesador OCR y la cuenta de servicio en Google Cloud siguiendo estos pasos detallados:

   **A. Configurar el Procesador en Document AI (Variables para el `.env`)**
   1. Ve a la [Consola de Google Cloud](https://console.cloud.google.com/) e inicia sesión.
   2. Crea un **Nuevo Proyecto** (o selecciona uno existente).
   3. **Habilitar la Facturación (Billing):** Para usar Document AI, Google requiere asociar una **tarjeta de crédito** o débito al proyecto. *(No te preocupes, hay una capa gratuita que cubre de sobra las pruebas de esta evaluación sin generar ningún coste real)*.
      - Abre el menú lateral izquierdo (icono de hamburguesa) y pulsa en **Facturación** (Billing).
      - Selecciona **Vincular una cuenta de facturación** o haz clic en **Gestionar cuentas de facturación** > **Agregar cuenta de facturación**.
      - Sigue los pasos en pantalla para introducir tus datos de pago y vincular la cuenta al proyecto.
   4. En el buscador superior, busca **"Cloud Document AI API"** y haz clic en **Habilitar** (Enable).
   5. En el menú lateral, ve a **Document AI > Procesadores** (Processors).
   6. Haz clic en  galeria del processador y selecciona  **"Document OCR"** .
   7. Asígnale un nombre, selecciona una región (ej. `eu` ) y créalo.
   8. Una vez creado, entra en los detalles del procesador. Aquí encontrarás la información necesaria para el entorno:
      - **ID del Proyecto** (`PROJECT_ID`) este id lo encontraras dandole en el icono de arriba a la izquierda de google coud
      - **ID del Procesador** (`PROCESSOR_ID`) y - **Ubicación** (`LOCATION`, normalmente `eu` o `us`) para encontrar ambos en el buscador escribe document ai y dentro en la barra de la izqu selecciona mis procesadores elige la region que escogiste antes (UE) y aparecera el proceso que creaste antes dandole click aparecera en la informacion basica un campo llamado id que sera el id de procesador y la region (eu)
   9. En la carpeta `backend/`, copia el archivo `.env.example` y renómbralo a `.env`. Rellena las variables con los datos obtenidos en el paso anterior y no olvides tu `GEMINI_API_KEY`.

   **B. Obtener las credenciales de la Cuenta de Servicio (`service_account.json`)**
   1. En la consola de Google Cloud, busca **"Cuentas de servicio"** (Service Accounts) dentro de *IAM y administración*.
   2. Haz clic en **Crear cuenta de servicio** (Create service account). Dale un nombre y pulsa *Crear y continuar*.
   3. En la sección de otorgar acceso, asígnale el rol de **Usuario de Document AI** (Document AI User) para que tenga permisos de invocar el procesador. Pulsa *Continuar* y luego *Listo*.
   4. En la lista de cuentas de servicio, haz clic sobre el email de la cuenta que acabas de crear.
   5. Ve a la pestaña **Claves** (Keys).
   6. Haz clic en **Agregar clave** > **Crear clave nueva** y selecciona el formato **JSON**.
   7. Se descargará un archivo a tu ordenador. Renombra este archivo descargado a `service_account.json`.
   8. Coloca el archivo `service_account.json` dentro de la carpeta `backend/credentials/` del proyecto.

   Una vez completados estos pasos (teniendo el `.env` y el `service_account.json` en sus respectivas rutas y con los datos correctos), puedes arrancar el servidor Flask (`python run.py`) y la API podrá procesar archivos PDF reales a través de tu proyecto de Google Cloud.

---

## 📁 Estructura Principal del Proyecto (Resumen)

- `/backend/`: Contiene la API Flask, rutas REST, y las configuraciones de CORS.
- `/database/`: Aquí se almacena `cvsmartai.db`, generada en el paso 3.
- `/GUI/`: Interfaz moderna con diseño Glassmorphism que ataca a la API.
- `/scripts/`: Utilidades como `setup_db.py` que crea todo lo necesario.
- `/tests/`: Suite de validación en Pytest para la API (dentro de backend).
- `Agent.md`: Contexto arquitectónico interno del proyecto.

¡Ya estás listo para empezar a desarrollar o utilizar **CVSmartAI** localmente!

# CVSmartAI - Guía de Instalación y Uso

¡Bienvenido al repositorio de **CVSmartAI**! Este proyecto es una plataforma SaaS diseñada para optimizar los CVs de perfiles junior mediante inteligencia artificial, ayudando a superar los filtros automatizados ATS.

A continuación, encontrarás la hoja de ruta paso a paso para tener todo el entorno funcionando correctamente en tu máquina local.

## 📋 Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu sistema:

- **Python 3.8+** (Recomendado 3.10 o superior)
- **Git**

---

## 🚀 Instalación Paso a Paso

### 1. Clonar el repositorio

Abre tu terminal y clona el proyecto en la carpeta deseada:

```bash
git clone <URL_DEL_REPOSITORIO>
cd CVSmartAi
```

*(Si ya descargaste el código manualmente, simplemente abre una terminal en la carpeta principal del proyecto `CVSmartAi`)*.

### 2. Configurar el Backend (API de Flask)

El backend expone la API REST que gestiona las peticiones de la plataforma y conecta con la base de datos. Se recomienda utilizar un entorno virtual para instalar las dependencias.

```bash
# 1. Navegar a la carpeta del backend
cd backend

# 2. Crear un entorno virtual (puedes llamarlo 'venv')
python -m venv venv

# 3. Activar el entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# 4. Instalar las dependencias requeridas
pip install -r requirements.txt
```

### 3. Configurar la Base de Datos (PostgreSQL via Docker) y Datos Fake

El proyecto utiliza PostgreSQL para el almacenamiento de datos. Para facilitar el entorno, hemos incluido un archivo `docker-compose.yml` que levanta la base de datos automáticamente.

1. **Asegúrate de tener Docker instalado y en ejecución.**
2. En la **raíz del proyecto**, ejecuta el siguiente comando para levantar el contenedor de la base de datos en segundo plano:

```bash
docker-compose up -d
```

3. **Configurar Variables de Entorno:**
   Copia el archivo `backend/.env.example` y renómbralo a `.env`. Asegúrate de que la variable `DATABASE_URL` apunte a la instancia local de Docker:
   `DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/cvsmartai`

4. **Poblar la base de datos (Estructura y Datos Ficticios):**
   Asegúrate de estar en la **raíz del proyecto** con tu entorno virtual activado, y ejecuta el script de instalación para generar la estructura y los datos de prueba:

```bash
python scripts/setup_db.py
```

Si todo va bien, verás mensajes indicando que la base de datos se ha creado correctamente y se han insertado los datos ficticios en la carpeta `/database`.

### 4. Levantar el Servidor Backend

Ahora que las dependencias están instaladas y la base de datos lista, puedes arrancar el servidor de desarrollo Flask.

```bash
# Navega a la carpeta backend si no estás en ella
cd backend

# Activa el entorno virtual si no está activado
# (venv\Scripts\activate en Windows o source venv/bin/activate en Linux/Mac)

# Ejecuta el servidor
python run.py
```

El servidor arrancará e indicará que está escuchando en el puerto 5000: `http://127.0.0.1:5000`.
**No cierres esta terminal**, mantenla abierta para que el backend siga activo.

---

### 5. Abrir la Interfaz de Usuario (Frontend GUI)

El frontend de la aplicación es Vanilla JS/HTML/CSS muy ligero y no requiere NodeJS ni empaquetadores complejos para funcionar.

1. Navega a la carpeta `/GUI/`.
2. Simplemente **haz doble clic** en el archivo `index.html` para abrirlo en tu navegador preferido (Chrome, Firefox, Edge, etc.).
3. Alternativamente, si usas VSCode, puedes usar la extensión **Live Server** para abrir `index.html`.

La interfaz debería cargar por completo, aplicando los estilos (`style.css`) y conectándose automáticamente al backend a través de `app.js` (el cual hace peticiones directamente a `http://localhost:5000/api/v1/...`).

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

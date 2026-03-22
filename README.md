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

### 3. Configurar la Base de Datos y Datos Fake

El proyecto incluye un script preparado para generar la estructura de la base de datos (SQLite3) y poblarla con datos de prueba (usuarios, logs de análisis y diccionario de habilidades).

Asegúrate de estar en la **raíz del proyecto** (y con el entorno virtual activado si corresponde) y ejecuta:

```bash
# Si sigues en la carpeta backend, sube un nivel:
cd ..

# Ejecuta el script de instalación de la BD
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

## 📁 Estructura Principal del Proyecto (Resumen)

- `/backend/`: Contiene la API Flask, rutas REST, y las configuraciones de CORS.
- `/database/`: Aquí se almacena `cvsmartai.db`, generada en el paso 3.
- `/GUI/`: Interfaz moderna con diseño Glassmorphism que ataca a la API.
- `/scripts/`: Utilidades como `setup_db.py` que crea todo lo necesario.
- `/tests/`: Suite de validación en Pytest para la API (dentro de backend).
- `Agent.md`: Contexto arquitectónico interno del proyecto.

¡Ya estás listo para empezar a desarrollar o utilizar **CVSmartAI** localmente!

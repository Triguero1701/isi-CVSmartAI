# CVSmartAI - SaaS de Optimización de CV con IA

[![Licencia](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18-61dafb.svg)](https://reactjs.org/)

---

## 📚 Documentación del Proyecto
- **[Documentación Técnica (Hito 3)](TECHNICAL_DOCUMENTATION.md)**: Arquitectura detallada, diagramas Mermaid, Referencia de API y Modelo de Datos.
- **[Manual de Usuario](USER_MANUAL.md)**: Guía de uso de la plataforma para el usuario final.

---

## 🚀 Sobre el Proyecto
CVSmartAI es una plataforma integral de análisis y optimización de currículums (CVs) basada en inteligencia artificial. Utiliza **Google Document AI** para extraer el contenido de los currículums con máxima precisión y **Google Gemini** para evaluar semánticamente los perfiles contra ofertas laborales reales, sugiriendo mejoras y permitiendo generar un CV optimizado dinámicamente en PDF.

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
docker compose up --build -d
```

### 4. Poblar la Base de Datos
Indispensable para el primer uso y para ver datos en el Dashboard:
```bash
docker exec cvsmartai_backend python /scripts/setup_db.py
```
*Esto creará un usuario administrador:*
- **Email:** `admin@cvsmartai.com`
- **Contraseña:** `admin123`

### 5. Acceso a la Aplicación
Una vez todo en marcha, puedes acceder aqui a la aplicación: [Host](http://localhost:5174)

---

## 👨‍🏫 Instrucciones para la Evaluación (Profesor)

Por motivos de seguridad, las credenciales de Google Cloud (`.env` y `service_account.json`) no se han subido al repositorio público. El proyecto está preparado para su evaluación de dos formas:

### 1️⃣ Evaluación de Código y Lógica (Sin Facturación Google)
Permite verificar que toda la lógica de la API y los endpoints funcionan mediante **Mocks**.
1. Navega a la carpeta `backend/` y ejecute `pytest tests/ -v`.
2. **Resultado**: Los tests pasarán al 100%, simulando la respuesta de Google Document AI y Gemini.

### 2️⃣ Evaluación Funcional Completa (Conexión Real en Google Cloud)
Si desea probar el flujo real, siga estos pasos detallados:

#### **A. Configurar el Procesador en Document AI**
1. Ve a la **Consola de Google Cloud** e inicia sesión.
2. Cree un **Nuevo Proyecto** y habilite la facturación.
3. Busque **"Cloud Document AI API"** y pulse en **Habilitar**.
4. Ve a **Document AI > Procesadores** y cree uno de tipo **"Document OCR"** (Región: `eu`).
5. Anote el **ID del Proyecto** y el **ID del Procesador**.

#### **B. Obtener credenciales de la Cuenta de Servicio (`service_account.json`)**
1. En la consola, busque **"Cuentas de servicio"** en IAM.
2. Cree una cuenta con el rol **Usuario de Document AI**.
3. Añada una clave **JSON**, descárguela y colóquela en `backend/credentials/service_account.json`.

#### **C. Habilitar Gemini AI y obtener API KEY**
1. Busque **"Generative Language API"** en la consola de Google Cloud y pulse en **Habilitar**.
2. Vaya a **API y servicios > Credenciales**.
3. Pulse en **Crear credenciales > Clave de API**. Esta será su **`GEMINI_API_KEY`**.

#### **D. Habilitar ScraperAPI (Opcional)**
1. Regístrese en [ScraperAPI.com](https://www.scraperapi.com/).
2. Copie su **API Key** y póngala en su `.env`.

#### **E. Configuración del archivo `.env`**
Cree un archivo `.env` en `backend/` con estos valores:

| Variable | Dónde obtenerla |
| :--- | :--- |
| **`PROJECT_ID`** | ID de su proyecto de Google Cloud. |
| **`PROCESSOR_ID`** | ID del procesador OCR creado en el paso A. |
| **`LOCATION`** | Por defecto `eu`. |
| **`GEMINI_API_KEY`** | Clave de API obtenida en el paso C. |
| **`SCRAPERAPI_KEY`** | Clave obtenida en el paso D (Opcional). |
| **`JWT_SECRET_KEY`** | Frase aleatoria para las sesiones. |



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
1.  **Construcción de Imágenes**: Las imágenes de Frontend y Backend se basan en entornos optimizados.
2.  **Orquestación**: Docker Compose gestiona la red interna y la persistencia de datos.
3.  **Comando Único**: Todo el ecosistema se levanta con:
    ```bash
    docker-compose up --build -d
    ```

---

## 👨‍🏫 Instrucciones para la Evaluación (Profesor)

Por motivos de seguridad, las credenciales de Google Cloud (`.env` y `service_account.json`) no se han subido al repositorio público. El proyecto está preparado para su evaluación de dos formas:

### 1️⃣ Evaluación de Código y Lógica (Sin Facturación Google)
Permite verificar que toda la lógica de la API y los endpoints funcionan mediante **Mocks**.
1. Navega a la carpeta `backend/`.
2. Ejecuta los tests: `pytest tests/ -v`.
3. **Resultado**: Los tests pasarán al 100%, simulando la respuesta de Google Document AI y Gemini.

### 2️⃣ Evaluación Funcional Completa (Conexión Real en Google Cloud)
Si desea probar el flujo real, siga estos pasos detallados:

#### **A. Configurar el Procesador en Document AI**
1. Ve a la **Consola de Google Cloud** e inicia sesión.
2. Crea un **Nuevo Proyecto** (o selecciona uno existente).
3. **Habilitar Facturación (Billing)**: Google requiere asociar una tarjeta (hay una capa gratuita generosa).
4. Busca **"Cloud Document AI API"** y haz clic en **Habilitar**.
5. Ve a **Document AI > Procesadores** y selecciona **"Document OCR"**.
6. Asígnale un nombre, selecciona región **`eu`** y créalo.
7. En los detalles del procesador, anote el **ID del Proyecto** (`PROJECT_ID`) y el **ID del Procesador** (`PROCESSOR_ID`).

#### **B. Obtener credenciales de la Cuenta de Servicio (`service_account.json`)**
1. En la consola, busca **"Cuentas de servicio"** en IAM y administración.
2. Crea una cuenta, asígnale el rol **Usuario de Document AI**.
3. En la pestaña **Claves**, añade una nueva clave **JSON**.
4. Descárgala, renómbrala a **`service_account.json`** y colócala en `backend/credentials/`.

#### **C. Habilitar Gemini AI y obtener API KEY**
Para que la IA funcione, debe habilitar el servicio de lenguaje:
1. En el buscador de la consola, busca **"Generative Language API"** y pulsa en **Habilitar**.
2. Vaya a **API y servicios > Credenciales**.
3. Pulse en **Crear credenciales > Clave de API**. Esta será su **`GEMINI_API_KEY`**.

#### **D. Habilitar ScraperAPI (Opcional)**
Para habilitar el scraping automático de ofertas desde URLs (Infojobs, LinkedIn, etc.):
1. Regístrese de forma gratuita en [ScraperAPI.com](https://www.scraperapi.com/).
2. En su Dashboard principal, verá un campo llamado **"API Key"**.
3. Copie esa clave y póngala en su `.env` como **`SCRAPERAPI_KEY`**.
*Nota: El plan gratuito incluye 1000 créditos, suficientes para las pruebas de evaluación.*

#### **E. Configuración del archivo `.env`**
Cree un archivo `.env` en la carpeta `backend/` con los siguientes valores:

| Variable | Dónde obtenerla |
| :--- | :--- |
| **`PROJECT_ID`** | ID de su proyecto de Google Cloud. |
| **`PROCESSOR_ID`** | ID del procesador OCR creado en el paso A. |
| **`LOCATION`** | Por defecto `eu`. |
| **`GEMINI_API_KEY`** | Clave de API obtenida en el paso C. |
| **`SCRAPERAPI_KEY`** | Clave obtenida en el paso D (Opcional). |
| **`JWT_SECRET_KEY`** | Frase aleatoria para las sesiones. |

---

## 🎨 Estética Premium y UX (Hito 3)
- **Glassmorphism**: Interfaces translúcidas y modernas.
- **Micro-interacciones**: Transiciones fluidas y fondo animado sutil.
- **Visualización**: Gráficas interactivas de evolución.

## ✅ Funcionalidad Total y Robustez
- **Análisis Real-Time**: Feedback progresivo mediante SSE.
- **Validación**: Filtros de seguridad para PDFs y límites de 10MB.
- **IA Fallback**: Sistema de contingencia ante errores de formato.

---

## 📁 Estructura Principal
- `/backend/`: API Flask y lógica de IA.
- `/frontend/`: Interfaz en React + Vite.
- `/database/`: Persistencia PostgreSQL.
- `/scripts/`: Script `setup_db.py` para inicializar la base de datos.
- `/tests/`: Suite de validación Pytest.

---

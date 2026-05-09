# CVSmartAI: Agentic CV Screening & Optimization

CVSmartAI es una plataforma integral de análisis y optimización de currículums (CVs) basada en inteligencia artificial. Utiliza **Google Document AI** para extraer el contenido de los currículums con máxima precisión y **Google Gemini** para evaluar semánticamente los perfiles contra ofertas laborales reales, sugiriendo mejoras y permitiendo generar un CV optimizado dinámicamente en PDF.

## 🚀 Arquitectura
- **Frontend:** React + Vite (Interfaz dinámica con modo oscuro/claro y exportación a PDF).
- **Backend:** Flask (Python) para orquestación de IA y lógica de negocio.
- **Base de Datos:** PostgreSQL 15.
- **Despliegue:** 100% contenerizado con Docker Compose.

---

## 📋 Requisitos Previos

Asegúrate de tener instalado en tu máquina local:
- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)

---

## 🛠️ Guía de Despliegue Paso a Paso

### Paso 1: Clonar el Repositorio

Abre tu terminal y clona el proyecto en tu máquina local:

```bash
git clone https://github.com/Triguero1701/isi-CVSmartAI.git
cd isi-CVSmartAI
```

### Paso 2: Configuración de Variables de Entorno y Credenciales

El backend requiere credenciales para conectarse a Google Cloud (Document AI) y Gemini, además de claves de seguridad locales.

1. **Archivo `.env`:**
   En la carpeta del backend copia el archivo `.env` proporcionado.

2. **Credenciales de Google Cloud (Document AI):**
   - Descarga el archivo JSON proporcionado.
   - Guárdalo exactamente en la ruta: `backend/credentials/service_account.json`.

Vuelve a la raíz del proyecto para continuar:
```bash
cd ..
```

### Paso 3: Construcción y Ejecución con Docker

Utiliza Docker Compose para construir todas las imágenes y levantar el ecosistema completo en segundo plano:

```bash
docker-compose up --build -d
```
*Este comando descargará las imágenes base, instalará las dependencias (Node y Python) y levantará PostgreSQL, Flask y React de forma orquestada.*

### Paso 4: Poblar la Base de Datos

Para que la plataforma funcione correctamente (y para tener datos realistas en el Dashboard), debes poblar la base de datos con nuestro script de configuración. Este script crea las tablas, inserta más de 45 habilidades (Hard/Soft Skills), crea ofertas de empleo de prueba y genera un historial generoso de usuarios ficticios y CVs analizados.

Ejecuta el siguiente comando (con los contenedores corriendo):

```bash
docker exec cvsmartai_backend python /scripts/setup_db.py
```

Al finalizar, el script creará automáticamente una **Cuenta de Administrador** para que puedas iniciar sesión sin tener que registrarte:
- **Email:** `admin@cvsmartai.com`
- **Contraseña:** `admin123`

### Paso 5: Acceder a la Aplicación

¡Todo está listo! Puedes acceder a los servicios desde tu navegador:

- **Plataforma Web (Frontend):** [http://localhost:5173](http://localhost:5173)
- **API (Backend):** [http://localhost:5000](http://localhost:5000)
- **Base de Datos:** Puerto `5432` en tu `localhost`.

---

## 🛑 Comandos Útiles

- **Detener la aplicación:**
  ```bash
  docker-compose down
  ```
  *(Nota: Los datos de la base de datos se conservan en el volumen de Docker).*

- **Borrar todo (incluyendo la base de datos):**
  ```bash
  docker-compose down -v
  ```

- **Ver los logs en tiempo real:**
  ```bash
  docker-compose logs -f
  ```

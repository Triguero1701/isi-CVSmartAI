# CVSmartAI - SaaS de Optimización de CV con IA

CVSmartAI es una plataforma de análisis y optimización de currículums (CVs) basada en inteligencia artificial. Utiliza **Google Document AI** para extraer el contenido de los currículums con máxima precisión y **Google Gemini** para evaluar semánticamente los perfiles contra ofertas laborales reales.

---

## 🚀 Guía de Despliegue Directo (Makefile)

Asegúrate de tener instalado:
- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)
- [Make](https://www.gnu.org/software/make/)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Triguero1701/isi-CVSmartAI.git
cd isi-CVSmartAI
```

### 2. Configurar credenciales

> 📄 Las instrucciones detalladas para obtener y configurar todas las credenciales están en [CONFIGURACIÓN_CREDENCIALES.md](./CONFIGURACIÓN_CREDENCIALES.md).

En resumen, necesitas dos ficheros en la carpeta `backend/`:
1. `backend/.env` — copia `backend/.env.example` y rellena tu clave de Gemini y Google Cloud.
2. `backend/credentials/service_account.json` — archivo JSON de tu cuenta de servicio de Google Cloud.

### 3. Poner en marcha la plataforma
Utiliza el `Makefile` desde la raíz para levantar la aplicación:
```bash
# Construir imágenes e iniciar contenedores
make build

# Iniciar contenedores en segundo plano
make up
```

Al iniciarse, el Makefile imprimirá las direcciones de acceso por consola:
👉 **Web Frontend:** `http://localhost:5174`  
👉 **API Backend:** `http://localhost:5001`  

### 4. Poblar la Base de Datos
Para poder visualizar datos históricos, perfiles de ejemplo y gráficos de evolución en el dashboard, debes inicializar y poblar la base de datos PostgreSQL:
```bash
# Inicializar y poblar la base de datos
make setup-db
```
*Esto generará 20 perfiles de prueba y un usuario administrador:*
- **Email:** `admin@cvsmartai.com`
- **Contraseña:** `admin123`

### 5. Acceso a la Aplicación
Una vez todo en marcha, puedes acceder aqui a la aplicación: [Host](http://localhost:5174)

---

## 🛠️ Comandos útiles del Makefile

El `Makefile` automatiza la administración de los contenedores Docker:
* `make up` - Inicia todos los contenedores en segundo plano.
* `make build` - Reconstruye las imágenes de Docker e inicia los contenedores.
* `make down` - Detiene y elimina los contenedores activos.
* `make restart` - Reinicia los contenedores.
* `make logs` - Visualiza los logs de ejecución en caliente.
* `make clean` - Detiene los contenedores y elimina imágenes huérfanas.
* `make setup-db` - Inicializa las tablas y puebla la base de datos con datos simulados de prueba.
* `make db-shell` - Entra a la consola psql interactiva de la base de datos PostgreSQL.
* `make backend-shell` - Entra al terminal bash del contenedor del backend.
* `make frontend-shell` - Entra al terminal shell del contenedor del frontend.

---

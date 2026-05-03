# Guía de Instalación de CVSmartAI con Docker

Esta guía te ayudará a instalar y levantar todo el ecosistema de CVSmartAI (Base de Datos PostgreSQL, Backend en Flask y Frontend en React) utilizando **Docker Compose** desde cero.

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu máquina:
- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🛠️ Paso 1: Clonar el Repositorio

Abre tu terminal y clona el proyecto en tu máquina local:

```bash
git clone https://github.com/Triguero1701/isi-CVSmartAI.git
cd isi-CVSmartAi
```

## ⚙️ Paso 2: Configuración de Variables de Entorno

El backend requiere ciertas credenciales para conectarse a Google Cloud Document AI y Gemini, además de las claves de seguridad.

1. Navega a la carpeta del backend y copia el archivo de ejemplo:
   ```bash
   cd backend
   # En Windows:
   copy .env.example .env
   # En Linux/Mac:
   cp .env.example .env
   ```

2. Abre el nuevo archivo `.env` en tu editor de código y completa los valores necesarios:
   - `DOCAI_PROJECT_ID`: Tu ID de proyecto en Google Cloud.
   - `DOCAI_PROCESSOR_ID`: El ID de tu procesador en Document AI.
   - `GEMINI_API_KEY`: Tu clave de API para Google Gemini.
   - `JWT_SECRET_KEY`: Una cadena segura para firmar los tokens de autenticación.

3. **Credenciales de Google Cloud:** 
   Asegúrate de colocar tu archivo de cuenta de servicio de Google Cloud (`service_account.json`) dentro de la carpeta `backend/credentials/`.

4. Vuelve a la raíz del proyecto:
   ```bash
   cd ..
   ```

## 🚀 Paso 3: Construcción y Ejecución

Una vez configurado el entorno, utiliza Docker Compose para construir las imágenes y levantar los contenedores en segundo plano. 
En la raíz del proyecto (donde se encuentra `docker-compose.yml`), ejecuta:

```bash
docker-compose up --build -d
```

Este comando hará lo siguiente:
- Levantará un contenedor con **PostgreSQL 15**.
- Construirá e iniciará el **Backend (Flask)** instalando todas sus dependencias de Python.
- Construirá e iniciará el **Frontend (React/Vite)** instalando sus paquetes de Node.

## 🗄️ Paso 4: Inicialización de la Base de Datos

Una vez que los contenedores estén corriendo, es necesario crear las tablas en la base de datos y cargar algunos datos iniciales para que la aplicación funcione correctamente (por ejemplo, para poder registrar usuarios).

Ejecuta el siguiente comando en tu terminal para inicializar la base de datos dentro del contenedor del backend:

```bash
docker exec cvsmartai_backend python /scripts/setup_db.py
```

## 🌐 Paso 5: Acceder a los Servicios

Una vez que los contenedores estén corriendo, puedes acceder a la aplicación desde tu navegador:

- **Frontend (Interfaz de Usuario):** [http://localhost:5173](http://localhost:5173)
- **Backend (API Flask):** [http://localhost:5000](http://localhost:5000)
- **Base de Datos:** Accesible de forma externa en el puerto `5432` de tu `localhost` (Usuario: `postgres`, Contraseña: `postgrespassword`, Base de Datos: `cvsmartai`).

## 🛑 Paso 6: Detener el Ecosistema

Para apagar la aplicación y detener los contenedores, simplemente ejecuta en la raíz del proyecto:

```bash
docker-compose down
```

> **Nota:** La base de datos persistirá su información de forma automática incluso después de apagar los contenedores gracias al volumen `pgdata` configurado en Docker Compose. Si alguna vez deseas borrar la base de datos por completo y reiniciar el proyecto completamente desde cero, puedes ejecutar `docker-compose down -v`.

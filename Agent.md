# Agent.md: CVSmartAI Context & Project State

## 1. Project Overview
**CVSmartAI** is a SaaS platform designed to optimize the CVs of students and junior profiles using AI, helping them bypass automated ATS filters by detecting missing keywords and calculating CV-to-Offer compatibility. The system focuses on tracking user evolution across multiple CV iterations to ensure progressive improvement. Recent updates include real-time feedback (SSE), automated job offer web scraping, visual CV diffing, PDF reports, secure JWT authentication, and accurate CV version sequencing.

## 2. Current Architecture & Folder Structure
The project is built on a modular, fully operational architecture, recently migrated to a scalable stack:

* **`/backend/`**: Python Flask REST API.
  * **Core Files**: `run.py` (entry point on `localhost:5000`), `requirements.txt` (Flask, psycopg2-binary, google-cloud-documentai, PyJWT, beautifulsoup4, requests, etc.), `.env` (Google Cloud credentials, `DATABASE_URL`, `JWT_SECRET_KEY`).
  * **Application Factory**: `app/__init__.py` configures CORS, custom JSON datetime formatting, and PostgreSQL connections.
  * **Endpoints (`app/routes.py`)**: 
    - Full CRUD support for `/api/v1/users`, `/api/v1/skills`, and `/api/v1/logs`. All protected routes use a custom `@token_required` middleware.
    - Custom Endpoint: `/api/v1/analyze` (POST) Pre-registers CV versions, utilizes Google Document AI for extraction, and evaluates CVs against job offers using Google Gemini. **Now streams real-time feedback via Server-Sent Events (SSE)**.
    - Custom Endpoint: `/api/v1/job-offers/extract` (POST) Automates web scraping of job descriptions. Now utilizes **ScraperAPI** to bypass advanced anti-bot protections (like DataDome/Cloudflare), extracts HTML with `BeautifulSoup`, and formats structured data using Gemini. Includes defensive prompting to handle scraping errors gracefully.
    - Custom Endpoints: `/api/v1/users/<id>/history` & `/api/v1/users/<id>/evolution` (GET) Return chronological history of a user's CV versions. Recently updated to allow admin-level multi-user visualization with strict chronological ordering (`ORDER BY id ASC, created_at ASC`).
    - Auth Endpoints: `/api/v1/users/register` and `/api/v1/users/login` (POST) handle secure user signup and JWT token generation.
  * **Integrations (`app/parser.py`, `app/llm_engine.py`)**: Connects to Google Document AI and Google Gemini with robust error handling and fallback models.
  * **Testing (`tests/`)**: Robust validation suite (`test_api.py`, `test_db.py`, `conftest.py`). Uses an isolated, dynamically created PostgreSQL test database (`cvsmartai_test`) per session. 100% passing rates.

* **`/database/`**: (Deprecated functionality) Previously used for SQLite, now fully replaced by Dockerized PostgreSQL.

* **`/scripts/`**: Utility & Maintenance.
  * Contains `setup_db.py`, which initializes the PostgreSQL database tables and populates realistic, evolutionary mock data (users, job offers, version progressions, analysis logs).

* **`/frontend/`**: Modern React SPA (Single Page Application).
  * Built with Vite, React Router, Recharts, and Lucide React. PDF Export powered by `html2pdf.js`.
  * Utilizes Glassmorphism and CSS Modules (`Dashboard.module.css`, `Login.module.css`, etc.) for a premium UI.
  * Includes charts mapping the progressive `compatibility_score` evolution of candidates and a `VersionCompare.jsx` component for visual skill diffing between CV versions.

* **`/GUI/`**: Legacy Plain HTML/JS Vanilla Frontend Dashboard.
  * Maintained as a functional lightweight fallback if Node.js is not present in the host environment.
  * Recently updated to include a "User Evolution" tab connecting to the `/history` endpoint.

* **Root Files**:
  * `docker-compose.yml`: Spins up the full stack: a `postgres:15-alpine` container (`cvsmartai_db`), the Flask `cvsmartai_backend` (port 5000), and the Vite React `cvsmartai_frontend` (port 5173).
  * `README.md`: Central documentation for environment setup, Docker configuration, and evaluation protocols.
  * `README2.md`: Additional setup or deployment instructions.

## 3. Database Schema (PostgreSQL)
* **`users`**: `id` SERIAL (PK), `name` VARCHAR, `email` VARCHAR (UNIQUE), `password_hash` VARCHAR, `created_at` TIMESTAMP
* **`skills_dictionary`**: `id` SERIAL (PK), `keyword` VARCHAR, `category` VARCHAR, `aliases` JSONB
* **`job_offers`**: `id` SERIAL (PK), `title` VARCHAR, `description` TEXT, `keywords` JSONB, `created_at` TIMESTAMP
* **`cv_versions`**: `id` SERIAL (PK), `user_id` INTEGER (FK), `job_offer_id` INTEGER (FK), `extracted_text` TEXT, `version_number` INTEGER, `compatibility_score` INTEGER, `created_at` TIMESTAMP
* **`analysis_logs`**: `id` SERIAL (PK), `user_id` INTEGER (FK), `cv_version_id` INTEGER (FK), `compatibility_score` INTEGER, `processing_time_ms` INTEGER, `created_at` TIMESTAMP
* **`feedback_logs`**: `id` SERIAL (PK), `cv_version_id` INTEGER (FK), `suggested_corrections` JSONB, `created_at` TIMESTAMP

## 4. Key Metrics & OKRs
* Ensure $\ge70\%$ of users improve their compatibility score after applying platform feedback (tracked via `cv_versions.version_number` vs `compatibility_score`).
* Increase by 30% the overall sum of CVs that reach a compatibility matching score higher than 75%.

## 5. Guidelines for AI Agents Developer Context
1. **DB Access**: The system uses PostgreSQL via `psycopg2`. Always use explicit cursors (`cursor.execute`) and PostgreSQL's `%s` variable binding parameter format instead of SQLite's `?`.
2. **Testing**: Any architectural additions require Pytest fixtures in `test_api.py`. The suite builds and tears down `cvsmartai_test` dynamically.
3. **UI Updates**: All active UI feature development should prioritize the React SPA in `/frontend/`.

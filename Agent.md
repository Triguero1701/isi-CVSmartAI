# Agent.md: CVSmartAI Context & Project State

## 1. Project Overview
**CVSmartAI** is a SaaS platform designed to optimize CVs of professionals and technical profiles using AI. It helps candidates bypass automated Applicant Tracking Systems (ATS) by detecting missing keywords and calculating CV-to-Offer compatibility. The system focuses on tracking user evolution across multiple CV iterations to ensure progressive improvement. Recent updates include real-time feedback (SSE), automated job offer web scraping via ScraperAPI, visual CV diffing, dynamic AI CV translation and rewriting using structured JSON, an on-screen classic single-page Harvard ATS CV template, and secure JWT authentication.

## 2. Project Architecture & Folder Structure

The project follows a dockerized, multi-container client-server architecture:

### 2.1 Backend (`/backend/`)
Built with Python 3.10 and Flask. It exposes REST API endpoints on port `5000` (mapped to port `5001` on the host).
* **`app/__init__.py`**: Configures the Flask application, custom JSON provider, CORS, and PostgreSQL database connections.
* **`app/routes.py`**: Handles API routes:
  * `/api/v1/users/register` & `/api/v1/users/login` (POST): Secure authentication and JWT generation.
  * `/api/v1/analyze` (POST): Processes a CV PDF (via Document AI OCR) and compares it semantically to a job description (via Gemini AI), streaming progress logs in real time via Server-Sent Events (SSE).
  * `/api/v1/improve-cv` (POST): Integrates Gemini to suggest rewriting/adding missing keywords to the CV text.
  * `/api/v1/translate-cv` (POST): Translates structured CV data to Spanish, English, German, or French using Gemini.
  * `/api/v1/job-offers/extract` (POST): Extracts details of a job description from a plain text paste or scrapes public job URLs using ScraperAPI and BeautifulSoup4.
  * `/api/v1/users/<id>/history` & `/api/v1/users/<id>/evolution` (GET): Retrieves the chronological list and scores of the user's CV versions.
  * `/api/v1/cv-versions/<id>` (GET/PUT): Retrieves and updates the structured JSON data of a specific CV version from the editor.
  * `/api/v1/health` (GET): Health check endpoint used by load and performance tests.
  * `/api/v1/skills` (GET): Returns the skills dictionary for ATS keyword lookup.
* **`app/parser.py`**: Integration with Google Document AI OCR for structured PDF text extraction.
* **`app/llm_engine.py`**: Integrates Google Gemini API for semantic matching, keyword extraction, CV optimization, and translations. **Updated:** Implements a `_generate_with_fallback()` helper function that tries models in sequence (`gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-2.5-flash` → others) with exponential backoff retry logic (up to 3 attempts per model) for transient errors (503, 429, UNAVAILABLE, ResourceExhausted). This prevents hard failures during API overload periods.
* **`tests/`**: Automated test suite containing unit, integration, load, and performance tests.
  * `conftest.py`: Configures the testing environment and dynamically spins up/tears down a PostgreSQL test database (`cvsmartai_test`). Contains mocks for Gemini and Document AI to preserve token quotas.
  * `test_api.py`: Validates all REST API endpoints (unit tests).
  * `test_db.py`: Validates database schema migrations and dummy data seeding.
  * `test_integration.py` **(NEW)**: End-to-end integration tests that simulate a full user lifecycle: register → login → extract job offer → analyze CV via SSE stream → fetch history → retrieve CV version → update CV data from editor → verify persistence of changes.
  * `load_test.py` **(NEW)**: Multi-threaded load testing script. Spawns configurable concurrent virtual users (default: 10) over a configurable duration (default: 5s). Reports total RPS, HTTP status code distribution, and latency statistics (min, max, avg, p95). Configurable via environment variables `TARGET_URL`, `CONCURRENCY`, and `DURATION`.
  * `performance_test.py` **(NEW)**: SLA validation script. Measures average latency of 5 key endpoints (`/health`, `/register`, `/login`, `/history`, `/skills`) against defined SLA limits (e.g., health ≤ 50ms, login ≤ 200ms). Exits with code 1 if any SLA is breached; exits with 0 on full pass.
  * `apilist.py`: Individual test script to verify Gemini API connection.
* **`test_flask.py`** & **`test_http.py`**: Lightweight connection and HTTP requests test prototypes.

### 2.2 Scripts (`/scripts/`)
* **`setup_db.py`**: Database migration and seeding script. It creates PostgreSQL tables and populates them with realistic mock profiles, jobs, version histories, and metrics log data.

### 2.3 Frontend (`/frontend/`)
A modern Single Page Application (SPA) built with React 18 and Vite, running on port `5173` (mapped to port `5174` on the host).
* **`src/components/`**: Core reusable visual elements:
  * `Sidebar.jsx`: Unified navigation sidebar (Dashboard, Subir CV, Editar CV, Evolución, Historial).
  * `VersionCompare.jsx`: Component to view differences (diffing) between successive CV versions.
  * `UserEvolution.jsx`: Renders Recharts line graph showing the progression of the candidate's compatibility score.
  * `templates/CVTemplateModern.jsx` & `CVTemplateModern.css`: The classic Harvard ATS serif CV layout. Styled with a locked height constraint (`296mm`) to ensure a single-page print budget, eliminating blank page overflow bugs.
* **`src/pages/`**: Application views:
  * `Dashboard.jsx`: Main hub rendering metrics, history grid, and evolution charts. **Fixed:** Minor UI cleanup removing unnecessary elements that caused rendering inconsistencies.
  * `Login.jsx`: Secure access using JWT authentication.
  * `JobOfferAnalyzer.jsx`: UI to upload a CV and paste a job offer/URL to start analysis.
  * `CVEditor.jsx`: Interactive CV editor with forms on the left and a live updating Harvard ATS template on the right. Includes a flag-based translation modal (Castellano, Inglés, Alemán, Francés).
  * `DirectEdit.jsx`: Access tab to upload a CV and immediately edit it without needing to paste a job offer description.
* **`src/index.css`**: Defines the layout system, color palette, responsive grid, and custom scrollbars.
* **`vite.config.js`**: Frontend configuration. Uses polling for Vite's HMR to sync host code edits into Docker.

### 2.4 Project Configuration (Root)
* **`docker-compose.yml`**: Defines three services: `db` (PostgreSQL 15), `backend` (Flask API), and `frontend` (React app).
* **`Makefile`**: Exposes commands to build, start, stop, restart, clean containers, access container shells, and run the full test suite. **Updated — New test commands added:**
  * `make test-unit` — Runs `test_api.py` and `test_db.py` inside the backend container.
  * `make test-integration` — Runs `test_integration.py` inside the backend container.
  * `make test-load` — Executes `load_test.py` for concurrent load simulation.
  * `make test-performance` — Executes `performance_test.py` to validate SLA compliance.
  * `make test-all` — Runs all of the above sequentially.
* **`README.md`**: Guide for environment setup, startup, database seeding, and testing. Updated to document all new test commands.

## 3. Database Schema (PostgreSQL 15)
* **`users`**: id (SERIAL PK), name (VARCHAR), email (VARCHAR UNIQUE), password_hash (VARCHAR), created_at (TIMESTAMP).
* **`skills_dictionary`**: id (SERIAL PK), keyword (VARCHAR), category (VARCHAR), aliases (JSONB).
* **`job_offers`**: id (SERIAL PK), title (VARCHAR), description (TEXT), keywords (JSONB), created_at (TIMESTAMP).
* **`cv_versions`**: id (SERIAL PK), user_id (FK), job_offer_id (FK), extracted_text (TEXT), version_number (INTEGER), compatibility_score (INTEGER), structured_data (JSONB), created_at (TIMESTAMP).
* **`analysis_logs`**: id (SERIAL PK), user_id (FK), cv_version_id (FK), compatibility_score (INTEGER), processing_time_ms (INTEGER), created_at (TIMESTAMP).
* **`feedback_logs`**: id (SERIAL PK), cv_version_id (FK), suggested_corrections (JSONB), created_at (TIMESTAMP).

## 4. Guidelines for Developers
1. **DB Access**: The backend connects to PostgreSQL using `psycopg2`. Always use parameters (`%s`) for query parameters to prevent SQL injection.
2. **Testing**: Running `pytest` inside the backend container runs the full suite against `cvsmartai_test`. Keep tests mocked to preserve Gemini token quotas. Use `make test-all` to run unit, integration, load, and performance tests in sequence.
3. **Running Docker**: Use the `Makefile` command interface. For example, run `make up` to spin up services and `make db-shell` to inspect data. On Windows PowerShell, use `docker compose up -d` directly if `make` is not available.
4. **LLM Resilience**: The `_generate_with_fallback()` function in `llm_engine.py` handles model unavailability automatically. Do not catch Gemini exceptions manually in route handlers — let the helper manage retries and model cascading.
5. **Load & Performance Tests**: `load_test.py` and `performance_test.py` run against the live backend (default: `http://localhost:5000`). They self-register their own test users at runtime and do not depend on `setup_db.py` seeded data. Override the target URL via the `TARGET_URL` environment variable when testing against a remote deployment.

# Agent.md: CVSmartAI Context & Project State

## 1. Project Overview
**CVSmartAI** is a SaaS platform designed to optimize the CVs of students and junior profiles using AI, helping them bypass automated ATS filters by detecting missing keywords and calculating CV-to-Offer compatibility.

## 2. Current Architecture & Folder Structure
The project is built on a modular, fully operational architecture:

* **`/backend/`**: Python Flask REST API.
  * **Core Files**: `run.py` (entry point on `localhost:5000`), `requirements.txt` (Flask, Flask-Cors, pytest, pytest-flask).
  * **Application Factory**: `app/__init__.py` configures CORS and SQLite3 connections.
  * **Endpoints (`app/routes.py`)**: 
    - Full CRUD support for `/api/v1/users`, `/api/v1/skills`, and `/api/v1/logs`.
    - Custom Endpoint: `/api/v1/analyze` (POST) simulates Document AI text parsing on PDFs and returns standard JSON compatibility data.
    - Custom Endpoint: `/api/v1/users/register` (POST) handles user signup securely.
  * **Testing (`tests/`)**: Contains a comprehensive validation suite (`test_api.py`, `test_db.py`, `conftest.py`) guaranteeing 100% passing rates across all endpoints, error handling (HTTP 400), and database schemas using isolated temporary databases. (Executable via `pytest tests/`).

* **`/database/`**: Persistence layer.
  * Contains `cvsmartai.db`, the active SQLite3 database file.

* **`/scripts/`**: Utility & Maintenance.
  * Contains `setup_db.py`, which initializes the database tables and natively populates mock data (hashed users, skills, analysis logs).

* **`/GUI/`**: Plain HTML/JS Vanilla Frontend Dashboard.
  * Features a modern, premium analytical UI/UX utilizing flat design, glowing metrics, and glassmorphism translucent panels (`style.css`).
  * Semantically structured in `index.html` mapping the design for the Database views.
  * Presentation logic natively handled by `app.js`, synchronously querying the Flask API.

* **`/frontend/`**: Reserved scaffold directory (originally mapped to host an external React SPA setup).

## 3. Database Schema (cvsmartai.db - SQLite3)
* **`users`**: `id` INTEGER (PK), `name` VARCHAR, `email` VARCHAR (UNIQUE), `password_hash` VARCHAR, `created_at` TIMESTAMP
* **`skills_dictionary`**: `id` INTEGER (PK), `keyword` VARCHAR, `category` VARCHAR (hard_skill/soft_skill), `aliases` JSON
* **`analysis_logs`**: `id` INTEGER (PK), `user_id` INTEGER (FK), `compatibility_score` INTEGER (0-100), `processing_time_ms` INTEGER, `created_at` TIMESTAMP

## 4. Key Metrics & OKRs
* Ensure $\ge70\%$ of users improve their compatibility score after applying platform feedback.
* Increase by 30% the overall sum of CVs that reach a compatibility matching score higher than 75%.

## 5. Guidelines for AI Agents Developer Context
1. **DB Access**: Do not circumvent the backend. All data interactions happen via the REST API at `/api/v1/`.
2. **Testing**: Any architectural additions to the backend require corresponding Pytest fixtures and assertions added to `test_api.py`.
3. **UI Updates**: Maintain the "Vanilla" DOM implementation inside `/GUI/`. Avoid loading large node dependencies for layout tweaking. For highly complex state management or migrating to an ecosystem, utilize the reserved `/frontend/` root folder.

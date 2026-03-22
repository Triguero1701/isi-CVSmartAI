# CVSmartAI - AI Agent Context & Project Summary

## 1. Project Overview
**CVSmartAI** is a platform designed to optimize the CVs of students and recent graduates using AI, helping them bypass automated ATS filters by detecting missing keywords and calculating CV-to-Offer compatibility.

## 2. Current Architecture & Folder Structure
The project has been actively developed and refactored into a modular architecture:

* **`/backend/`**: Python Flask REST API.
  * `run.py`: Server entry point (typically runs on `http://127.0.0.1:5000`).
  * `requirements.txt`: Python package dependencies (Flask, Flask-Cors).
  * `app/`: Package containing the app factory (`__init__.py`) which configures CORS and SQLite3 connections, and the blueprint router (`routes.py`).
  * **Endpoints**: Exposes `/api/v1/users`, `/api/v1/skills`, and `/api/v1/logs` with full CRUD (GET, POST, PUT, DELETE) support.
* **`/database/`**: Persistence layer.
  * Contains `cvsmartai.db`, the active SQLite3 database file.
* **`/scripts/`**: Utility / Maintenance.
  * Contains `setup_db.py`, a script that handles creating the tables (`users`, `skills_dictionary`, `analysis_logs`) and populating them with mock data natively using Python (random/hashlib).
* **`/GUI/`**: Plain HTML/JS Vanilla Frontend.
  * Built to interface with the Flask API via standard `fetch()`.
  * Contains a premium dashboard (`index.html`, `style.css`, `app.js`) using dark-mode aesthetics and glassmorphism.
* **`/frontend/`**: Reserved scaffold directory (originally mapped for future React integration).

## 3. Database Schema (cvsmartai.db - SQLite3)
* **`users`**: 
  * `id` INTEGER (PK)
  * `name` VARCHAR(100)
  * `email` VARCHAR(150) UNIQUE 
  * `password_hash` VARCHAR(255)
  * `created_at` TIMESTAMP
* **`skills_dictionary`**: 
  * `id` INTEGER (PK)
  * `keyword` VARCHAR(100)
  * `category` VARCHAR(50) (CHECK: `hard_skill` or `soft_skill`)
  * `aliases` JSON
* **`analysis_logs`**: 
  * `id` INTEGER (PK)
  * `user_id` INTEGER (FK -> users.id)
  * `compatibility_score` INTEGER (0-100)
  * `processing_time_ms` INTEGER
  * `created_at` TIMESTAMP

## 4. Guidelines for AI Agents interacting with this codebase
1. **Database Access**: Do not reinvent direct DB connections in the frontend/GUI. Always route data queries through the Flask API (`/api/v1/`).
2. **CORS Configuration**: Flask-CORS is enabled globally, so local file-system (`file:///...`) or external ports can seamlessly make cross-origin requests to the API. 
3. **Styling Paradigm**: The `/GUI/` relies on raw CSS root variables, vanilla JS event listeners, and dynamic DOM manipulation. Avoid introducing external UI frameworks inside `/GUI/` to maintain the "Vanilla" philosophy. If migrating to a framework like React, use the `/frontend/` root folder.
4. **Environment**: Python packages should be strictly synchronized with `backend/requirements.txt`.
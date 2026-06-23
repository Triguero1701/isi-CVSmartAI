# 🛠️ Documentación Técnica - CVSmartAI

Este documento proporciona una visión profunda de la arquitectura, el modelo de datos y la interfaz de programación (API) de CVSmartAI.

---

## 1. Arquitectura del Sistema

El sistema sigue una arquitectura de microservicios dockerizados, comunicando un frontend moderno con un backend robusto que consume servicios de Inteligencia Artificial de Google Cloud.

```mermaid
---
config:
  layout: fixed
---
flowchart LR
 subgraph Capa_Presentacion["Capa de Presentación - Frontend"]
        SPA["React 18 SPA"]
        JWT_Store[("Local Storage: JWT")]
  end
 subgraph Capa_Pasarela["Capa de Pasarela"]
        Gateway["Flask REST Router / API Gateway"]
        Middleware["Middleware Interceptor JWT"]
  end
 subgraph Capa_Negocio["Capa de Negocio - Backend Core"]
        S_Usuarios["Servicio de Usuarios<br>• Perfiles<br>• Credenciales<br>• Autenticación"]
        S_IA["IA Procesamiento de CVs<br>• Lectura PDF<br>• Invocación OCR"]
        S_Matching["Motor de Matching<br>• Compatibilidad semántica<br>• Modelos LLM"]
        S_KPI["Tracker de KPIs<br>• Tiempos de procesamiento<br>• Scores históricos"]
  end
 subgraph Capa_Persistencia["Capa de Persistencia"]
        DB[("PostgreSQL 15<br>• Datos relacionales<br>• Columnas JSONB<br>• Logs de auditoría")]
  end
 subgraph Servicios_Externos["Servicios Externos - SaaS e Infraestructura"]
        Scraper["ScraperAPI"]
        G_DocAI["Google Cloud Document AI"]
        G_Gemini["Google Cloud Gemini"]
  end
    SPA <-- Lee/Guarda --> JWT_Store
    Gateway --> Middleware
    SPA <-- Peticiones HTTP Asíncronas<br>Bearer Token --> Gateway
    Middleware -- Enruta --> S_Usuarios & S_IA & S_Matching & S_KPI
    S_Usuarios <--> DB
    S_IA <--> DB
    S_Matching <--> DB
    S_KPI <--> DB
    S_IA == HTTPS ==> Scraper & G_DocAI
    S_Matching L_S_Matching_G_Gemini_0@<== HTTPS ==> G_Gemini

     SPA:::frontend
     JWT_Store:::frontend
     Gateway:::gateway
     Middleware:::gateway
     S_Usuarios:::core
     S_IA:::core
     S_Matching:::core
     S_KPI:::core
     DB:::database
     Scraper:::external
     G_DocAI:::external
     G_Gemini:::external
    classDef frontend fill:#d4ebf2,stroke:#1a73e8,stroke-width:2px,color:#000
    classDef gateway fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000
    classDef core fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#000

    L_S_Matching_G_Gemini_0@{ animation: none }
```

---

## 2. Modelo de Datos (ERD)

La base de datos utiliza PostgreSQL para asegurar la integridad referencial y permitir el almacenamiento de datos complejos mediante tipos `JSONB`.

```mermaid
erDiagram
    USERS ||--o{ CV_VERSIONS : "crea"
    JOB_OFFERS ||--o{ CV_VERSIONS : "asociada a"
    CV_VERSIONS ||--o{ ANALYSIS_LOGS : "genera"
    CV_VERSIONS ||--o{ FEEDBACK_LOGS : "contiene"
    
    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        timestamp created_at
    }
    
    JOB_OFFERS {
        int id PK
        string title
        text description
        jsonb keywords
        timestamp created_at
    }
    
    CV_VERSIONS {
        int id PK
        int user_id FK
        int job_offer_id FK
        text extracted_text
        int version_number
        int compatibility_score
        timestamp created_at
    }
    
    ANALYSIS_LOGS {
        int id PK
        int user_id FK
        int cv_version_id FK
        int compatibility_score
        int processing_time_ms
        timestamp created_at
    }
    
    FEEDBACK_LOGS {
        int id PK
        int cv_version_id FK
        jsonb suggested_corrections
        timestamp created_at
    }
```

---

## 3. Referencia de la API (v1)

Todos los endpoints (excepto Login/Registro) requieren un token Bearer en el header `Authorization`.

### Autenticación
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/users/register` | Registra un nuevo usuario y devuelve un JWT. |
| `POST` | `/api/v1/users/login` | Valida credenciales y devuelve un JWT. |

### Análisis de CV
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/analyze` | **Streaming (SSE)**. Sube un PDF, extrae texto con DocAI y analiza con Gemini. |
| `POST` | `/api/v1/job-offers/extract` | Extrae y estructura información de una URL de oferta de empleo. |

### Historial y Evolución
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/users/<id>/history` | Obtiene el historial cronológico de CVs de un usuario. |
| `GET` | `/api/v1/users/<id>/evolution` | Obtiene los datos de puntuación para gráficas de progreso. |

---

## 4. Stack Tecnológico

| Capa | Tecnología | Razón |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Rapidez de desarrollo y renderizado eficiente. |
| **Backend** | Flask (Python) | Flexibilidad e integración nativa con librerías de IA y Scraping. |
| **Base de Datos** | PostgreSQL 15 | Soporte nativo para JSONB y robustez empresarial. |
| **IA** | Google Gemini | Potencia de procesamiento de lenguaje natural de última generación. |
| **OCR** | Google Document AI | Precisión superior en la extracción de texto desde PDFs complejos. |

---

## 5. Seguridad
- **JWT (JSON Web Tokens)**: Implementado para la gestión de sesiones sin estado.
- **Bcrypt (simulado)**: Las contraseñas se almacenan como hashes (pendiente de migración a Argon2 para Hito final).
- **Environment Variables**: Todas las claves sensibles se gestionan mediante el archivo `.env`.

---

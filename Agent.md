# Agent.md: Contexto del Proyecto CVSmartAI

## 1. Visión General del Proyecto
* [cite_start]**Nombre:** CVSmartAI[cite: 1].
* [cite_start]**Objetivo Principal:** Mejorar la empleabilidad de estudiantes y recién graduados mediante la optimización inteligente del CV[cite: 55].
* [cite_start]**Problema a resolver:** Entre el 70% y el 80% de los currículums no son leídos por humanos, siendo descartados por sistemas automáticos de filtrado (ATS), lo que genera frustración en perfiles junior[cite: 47, 48, 51, 118].
* [cite_start]**Propuesta de Valor:** Optimización de CV impulsada por IA para superar filtros ATS, detectando keywords faltantes y calculando la compatibilidad CV-Oferta[cite: 105, 110].

## 2. Casos de Uso Principales
* [cite_start]**Análisis de CV:** El usuario sube su CV en PDF o texto[cite: 65]. [cite_start]El sistema extrae la información relevante, detecta carencias (falta de tecnologías, soft skills) y genera recomendaciones[cite: 67, 68, 69].
* [cite_start]**Adaptación a oferta de empleo:** El usuario pega el texto de una oferta[cite: 72]. [cite_start]El sistema detecta competencias técnicas y soft skills, las compara con el CV y propone mejoras y palabras clave[cite: 74, 75, 76, 77].
* [cite_start]**Verificación previa:** Antes de aplicar, el sistema devuelve un porcentaje de compatibilidad y una lista de mejoras prioritarias[cite: 80, 81, 82, 83].

## 3. Arquitectura del Sistema
* **Patrón Arquitectónico:** Arquitectura cliente-servidor síncrona orientada a servicios centralizados. Los clientes (Web/App) se comunican con el backend exclusivamente a través de un Gateway API REST.
* **Backend Core (Monolítico):** Sistema centralizado que agrupa la lógica de negocio en cuatro submódulos:
    * **Servicio de Usuarios:** Gestión de perfiles y autenticación.
    * **IA Procesamiento de CVs:** Módulo encargado de recibir el documento, interactuar con APIs de extracción y normalizar el contenido.
    * [cite_start]**Motor de Matching:** Ejecuta la simulación de IA mediante reglas, keywords y matching semántico básico para calcular el porcentaje de compatibilidad[cite: 18, 19, 62].
    * **Tracker de KPIs:** Registra métricas de uso y conversiones.
* **Capa de Datos:** Una única Base de Datos Relacional conectada de forma interna al *Backend Core* para almacenar perfiles, el diccionario de competencias y las métricas.
* **Integraciones de Terceros:** Se consume una "API Extracción texto PDF" externa para parsear los documentos subidos por el usuario, manteniendo la lógica semántica (IA) in-house.

## 4. Stack Tecnológico y Roles
* [cite_start]**Frontend (Miguel Ángel Triguero Elipe):** HTML, CSS, JavaScript con framework opcional React/Vue para diseño responsive, subida de CVs y dashboard de resultados[cite: 7, 25, 29, 32, 34, 35, 36].
* [cite_start]**Backend (Carlos Llamas Megía):** Python o Node.js para el desarrollo de la API REST y la lógica de análisis/NLP básico[cite: 8, 12, 17, 21, 22, 23].
* [cite_start]**Testing (Diego Gonzalez Perez-Serrano):** Pruebas funcionales, de experiencia de usuario, integración y validación de los cálculos de compatibilidad[cite: 9, 38, 40, 43, 44, 45].

## 5. Métricas de Éxito (KPIs y OKRs)
* [cite_start]**KPIs:** Número de CVs analizados, porcentaje medio de compatibilidad, optimizaciones por oferta y usuarios recurrentes[cite: 141, 142, 143, 144].
* **Key Results (Adopción e Impacto):**
    * [cite_start]Conseguir 50 usuarios registrados en la fase piloto[cite: 154].
    * [cite_start]Que el >= 70% de usuarios mejore su porcentaje de compatibilidad tras aplicar sugerencias[cite: 149].
    * [cite_start]Incrementar en un 30% los CVs con compatibilidad superior al 75%[cite: 150].
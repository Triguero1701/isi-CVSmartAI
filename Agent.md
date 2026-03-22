# Agent.md: Contexto y Requisitos del Proyecto CVSmartAI

## 1. Visión General del Proyecto
* **Nombre:** CVSmartAI.
* **Objetivo Principal:** Mejorar la empleabilidad de estudiantes y recién graduados mediante la optimización inteligente del CV.
* **Problema a resolver:** Entre el 70% y el 80% de los currículums no son leídos por humanos, siendo descartados por sistemas automáticos de filtrado (ATS), lo que genera frustración en perfiles junior.
* **Propuesta de Valor:** Optimización de CV impulsada por IA para superar filtros ATS, detectando keywords faltantes y calculando la compatibilidad CV-Oferta.

## 2. Requisitos Funcionales
* **Gestión de Entradas:** El sistema permitirá subir CVs en formato PDF o texto y proporcionará un área de texto para introducir ofertas de empleo.
* **Procesamiento de Texto:** El sistema extraerá el texto de los PDFs subidos apoyándose en servicios externos.
* **Análisis y Matching:** El sistema comparará el CV con la oferta utilizando procesamiento de lenguaje natural (NLP) básico para identificar solapamiento de tecnologías y *soft skills*.
* **Generación de Reportes:** El sistema devolverá un porcentaje numérico de compatibilidad y listará sugerencias accionables (keywords faltantes).
* **Gestión de Usuarios:** El sistema permitirá el registro y autenticación de usuarios para mantener un historial de uso.

## 3. Requisitos No Funcionales y Stack Tecnológico
* **Frontend (Interfaz de Usuario):** Desarrollado en **React** con HTML, CSS y JavaScript. Deberá contar con un diseño *responsive*.
* **Backend (Lógica y Servicios):** Desarrollado en **Python**, exponiendo los servicios mediante una API REST utilizando **Flask**. Alojará el motor interno de *matching* semántico.
* **Persistencia de Datos:** Base de datos relacional **MySQL** para el almacenamiento de perfiles de usuario, el diccionario de competencias y las métricas del sistema.
* **Integraciones Externas:** Consumo de la API de **Google Document AI** para realizar el parseo y extracción de texto de los documentos PDF de manera precisa.

## 4. Métricas de Éxito (KPIs y OKRs)
* **KPIs:** Número de CVs analizados, porcentaje medio de compatibilidad, optimizaciones por oferta y usuarios recurrentes.
* **Key Results:**
    * Conseguir 50 usuarios registrados en la fase piloto.
    * Lograr que $\ge70\%$ de usuarios mejore su porcentaje de compatibilidad tras aplicar sugerencias.
    * Incrementar en un 30% los CVs con compatibilidad superior al 75%.
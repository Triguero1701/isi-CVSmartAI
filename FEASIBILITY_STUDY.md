# 📈 Análisis de Viabilidad - CVSmartAI

Este documento evalúa la viabilidad técnica, operativa y económica del proyecto **CVSmartAI** como solución SaaS en el mercado actual de RRHH y Búsqueda de Empleo.

---

## 1. Viabilidad Técnica
El proyecto utiliza un stack moderno y altamente escalable:
- **Infraestructura**: El uso de Docker permite el despliegue en cualquier proveedor de nube (AWS, Azure, GCP).
- **IA de Vanguardia**: La integración con Google Gemini y Document AI asegura una precisión en el análisis semántico que supera a las herramientas basadas en simples búsquedas de palabras clave.
- **Escalabilidad**: El backend asíncrono y el uso de SSE permiten manejar múltiples peticiones de análisis de forma eficiente.

---

## 2. Análisis de Costes (GCP Estimation)

Basado en el uso de las APIs de Google Cloud (precios estimativos a mayo 2024):

| Servicio | Concepto | Coste Estimado | Capa Gratuita |
| :--- | :--- | :--- | :--- |
| **Document AI** | Extracción OCR (1 pág/CV) | ~$0.05 / CV | Primeras 1000 pág/mes gratis. |
| **Google Gemini** | Análisis LLM (Prompt + Resp) | ~$0.001 / CV | Gratis hasta 60 RPM (AI Studio). |
| **Hosting (Cloud Run)** | Servidor y Contenedores | ~$10-20 / mes | Siempre hay créditos iniciales. |
| **PostgreSQL** | Cloud SQL | ~$15 / mes | N/A |

**Coste por usuario (10 CVs/mes):** Menos de **$1.00 USD**. El margen de beneficio para un modelo de suscripción (ej. $9.99/mes) es muy alto (>90%).

---

## 3. Análisis de Mercado
- **Público Objetivo**: Estudiantes universitarios y perfiles junior (más de 1M de graduados anuales en España/LATAM).
- **Competencia**: JobScan (USA), VMock. **CVSmartAI** se diferencia por su enfoque en la evolución del usuario y el uso de modelos generativos (Gemini) en lugar de algoritmos cerrados.
- **Propuesta de Valor**: Reducción del tiempo de búsqueda de empleo en un 40% al asegurar que el CV pase el filtro ATS del primer nivel.

---

## 4. Riesgos y Mitigación
- **Dependencia de APIs Externas**: Se mitiga con una arquitectura modular que permite cambiar Gemini por otros modelos (Llama 3, GPT-4) fácilmente.
- **Privacidad de Datos**: El cumplimiento de la RGPD es obligatorio al manejar datos personales de CVs. Se requiere una capa de cifrado de datos en reposo.

---

## 5. Conclusión de Viabilidad
El proyecto es **altamente viable**. Con un coste operativo extremadamente bajo gracias a la capa gratuita de las APIs de Google y una infraestructura ligera, el retorno de inversión (ROI) se alcanzaría con tan solo 50 usuarios de pago.

---

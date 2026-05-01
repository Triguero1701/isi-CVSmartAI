import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure the Generative AI client with the API key
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

def analyze_cv_with_gemini(cv_text: str, job_offer_text: str) -> dict:
    """
    Analyzes the extracted CV text against the job offer text using Gemini.
    Forces the response to be in a specific JSON format via prompting.
    """
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
Eres un experto reclutador de Recursos Humanos y evaluador ATS (Applicant Tracking System).
Tu tarea es analizar semánticamente un Currículum Vitae frente a una descripción de Oferta de Empleo.

### Oferta de Empleo:
{job_offer_text}

### Texto del Currículum (Extraído por OCR):
{cv_text}

Debes proporcionar un análisis respondiendo estricta y únicamente con un objeto JSON válido. NO incluyas formato markdown (como ```json) al principio ni al final. Solo el objeto JSON crudo en texto plano.

La estructura del JSON debe ser EXACTAMENTE la siguiente:
{{
  "compatibility_score": <int_entre_0_y_100>,
  "analysis": {{
    "matched_skills": ["lista", "de", "habilidades", "presentes", "en", "ambos"],
    "missing_keywords": ["lista", "de", "palabras clave", "o_habilidades", "que_faltan", "en_el_cv"],
    "priority_improvements": [
      "Consejo accionable 1 sobre cómo mejorar el CV de acuerdo a la oferta",
      "Consejo accionable 2",
      "Consejo accionable 3"
    ]
  }}
}}

Calcula el compatibility_score como un porcentaje de coincidencia entre las habilidades/requisitos del trabajo y lo que realmente muestra el CV.
Asegúrate de que la salida sea ÚNICAMENTE JSON para poder hacer parseo automático.
"""
    
    response = model.generate_content(prompt)
    
    # Try to parse the response as JSON
    response_text = response.text.strip()
    
    # Clean up standard json markdown tags if they are still emitted despite instructions
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "", 1)
    if response_text.endswith("```"):
        response_text = response_text[::-1].replace("```", "", 1)[::-1]
        
    response_text = response_text.strip()

    try:
        parsed_json = json.loads(response_text)
        return parsed_json
    except json.JSONDecodeError:
        # Fallback if Gemini failed to produce valid JSON
        return {
            "compatibility_score": 0,
            "analysis": {
                "matched_skills": [],
                "missing_keywords": ["Error en el parseo del LLM"],
                "priority_improvements": ["No se pudo analizar el CV debido a un error de formato en el modelo de lenguaje."]
            }
        }

def extract_job_offer_data(text: str) -> dict:
    """
    Extracts structured job offer data (title, company, keywords) from raw scraped text using Gemini.
    """
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
Extrae la información principal de esta oferta de trabajo en bruto escrapeada de internet.

Texto de la oferta:
{text}

Debes responder estricta y únicamente con un objeto JSON válido, sin formato markdown ni texto adicional.
La estructura EXACTA debe ser:
{{
  "title": "Título del puesto de trabajo",
  "company": "Nombre de la empresa (si se menciona, si no 'No especificada')",
  "keywords": ["palabra_clave_1", "palabra_clave_2", "habilidad_1", "habilidad_2"],
  "description": "Un resumen de 2 o 3 párrafos de la oferta."
}}
"""
    response = model.generate_content(prompt)
    response_text = response.text.strip()
    
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "", 1)
    if response_text.endswith("```"):
        response_text = response_text[::-1].replace("```", "", 1)[::-1]
        
    response_text = response_text.strip()

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {
            "title": "Error Extracción",
            "company": "Desconocida",
            "keywords": [],
            "description": text[:500] + "..."
        }

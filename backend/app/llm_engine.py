import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure the Generative AI client with the API key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def _generate_with_fallback(prompt: str):
    """
    Helper function to attempt generation with gemini-2.5-flash and fallback to gemini-pro if not available.
    """
    try:
        return client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
    except Exception as e:
        print(f"Fallback to gemini-pro due to: {e}")
        return client.models.generate_content(
            model='gemini-pro',
            contents=prompt
        )

def analyze_cv_with_gemini(cv_text: str, job_offer_text: str) -> dict:
    """
    Analyzes the extracted CV text against the job offer text using Gemini.
    Forces the response to be in a specific JSON format via prompting.
    """
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
    
    response = _generate_with_fallback(prompt)
    
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
    Detects if the text is an anti-bot or captcha error message.
    """
    prompt = f"""
Analiza el siguiente texto en bruto escrapeado de internet.

Texto de la oferta:
{text}

INSTRUCCIÓN CRÍTICA DE SEGURIDAD:
Primero, determina si el texto parece ser un mensaje de error de acceso, un bloqueo por anti-bots (ej. Cloudflare, "Verifica que eres humano"), una solicitud para habilitar JavaScript o Cookies, o simplemente una página de política de privacidad/cookies en lugar de una oferta real.
Si detectas que el texto es un error de scraping y no una oferta de empleo genuina, tu respuesta debe ser EXACTAMENTE el siguiente JSON y nada más:
{{
  "error": "anti_bot_detected"
}}

Si, por el contrario, el texto sí parece ser una oferta de trabajo válida, extrae la información principal y responde estricta y únicamente con un objeto JSON válido, sin formato markdown ni texto adicional.
La estructura EXACTA debe ser:
{{
  "title": "Título del puesto de trabajo",
  "company": "Nombre de la empresa (si se menciona, si no 'No especificada')",
  "keywords": ["palabra_clave_1", "palabra_clave_2", "habilidad_1", "habilidad_2"],
  "description": "Un resumen de 2 o 3 párrafos de la oferta."
}}
"""
    response = _generate_with_fallback(prompt)
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

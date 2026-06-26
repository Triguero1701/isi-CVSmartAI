import os
import json
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure the Generative AI client with the API key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def _generate_with_fallback(prompt: str, response_json: bool = False):
    """
    Helper function to attempt generation with gemini-2.0-flash, gemini-1.5-flash, or other fallbacks if not available.
    Implements a retry mechanism with exponential backoff for transient errors (503, 429).
    """
    config = None
    if response_json:
        try:
            from google.genai import types
            config = types.GenerateContentConfig(response_mime_type="application/json")
        except ImportError:
            # Fallback if types cannot be imported
            config = {"response_mime_type": "application/json"}

    # List of models to try in sequence
    models_to_try = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest']
    
    last_error = None
    for model_name in models_to_try:
        retries = 3
        backoff = 1.0
        for attempt in range(retries):
            try:
                return client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config
                )
            except Exception as e:
                err_str = str(e)
                # Check for transient/quota errors: 503 (UNAVAILABLE), 429 (ResourceExhausted), etc.
                is_transient = any(code in err_str for code in ["503", "429", "UNAVAILABLE", "ResourceExhausted", "high demand"])
                
                if is_transient and attempt < retries - 1:
                    print(f"Transient Gemini API error ({model_name}, attempt {attempt+1}/{retries}): {e}. Retrying in {backoff}s...", flush=True)
                    time.sleep(backoff)
                    backoff *= 2.0
                else:
                    print(f"Failed to generate content with {model_name}: {e}", flush=True)
                    last_error = e
                    break # Break out of the retry loop to try the next model
            
    # If all models fail, raise the last encountered exception
    raise last_error

def analyze_cv_with_gemini(cv_text: str, job_offer_text: str) -> dict:
    """
    Analyzes the extracted CV text against the job offer text using Gemini.
    Forces the response to be in a specific JSON format via prompting.
    """
    prompt = f"""
Eres un experto reclutador de Recursos Humanos y evaluador ATS (Applicant Tracking System).
Tu tarea es analizar semánticamente un Currículum Vitae frente a una descripción de Oferta de Empleo y extraer el contenido estructurado del CV.

### Oferta de Empleo:
{job_offer_text}

### Texto del Currículum (Extraído por OCR):
{cv_text}

Debes proporcionar un análisis respondiendo estricta y únicamente con un objeto JSON válido. NO incluyas formato markdown (como ```json) al principio ni al final. Solo el objeto JSON crudo en texto plano.

La estructura del JSON debe ser EXACTAMENTE la siguiente:
{{
  "compatibility_score": <int_entre_0_y_100>,
  "matched_skills": ["lista", "de", "habilidades", "presentes", "en", "ambos"],
  "missing_skills": ["lista", "de", "palabras clave", "o_habilidades", "que_faltan", "en_el_cv"],
  "category_breakdown": {{
    "keywords": <int_entre_0_y_100>,
    "experience": <int_entre_0_y_100>,
    "seniority_fit": <int_entre_0_y_100>
  }},
  "recommendations": [
    "Consejo accionable 1 sobre cómo mejorar el CV de acuerdo a la oferta",
    "Consejo accionable 2",
    "Consejo accionable 3"
  ],
  "extracted_data": {{
    "personal_info": {{
      "name": "Nombre completo extraído del CV (si no hay, 'Candidato')",
      "email": "Email extraído",
      "phone": "Teléfono extraído",
      "title": "Título profesional extraído (ej: Full Stack Developer)"
    }},
    "summary": "Resumen profesional redactado o extraído (máximo 400 caracteres)",
    "experience": [
      {{
        "role": "Puesto/Rol",
        "company": "Empresa",
        "duration": "Periodo/Duración (ej: 2022 - Presente)",
        "description": "Descripción concisa del puesto, sus logros y tecnologías empleadas (máximo 3 bullet points o una frase corta)"
      }}
    ],
    "education": [
      {{
        "degree": "Título/Grado",
        "institution": "Universidad/Centro",
        "year": "Año de finalización"
      }}
    ],
    "skills": ["habilidad1", "habilidad2", "habilidad3", "habilidad4", "habilidad5"]
  }}
}}

Calcula el compatibility_score como un promedio ponderado del category_breakdown.
Asegúrate de que la salida sea ÚNICAMENTE JSON para poder hacer parseo automático.
"""
    
    response = _generate_with_fallback(prompt, response_json=True)
    
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
            "matched_skills": [],
            "missing_skills": ["Error en el parseo del LLM"],
            "category_breakdown": {
                "keywords": 0,
                "experience": 0,
                "seniority_fit": 0
            },
            "recommendations": ["No se pudo analizar el CV debido a un error de formato en el modelo de lenguaje."],
            "extracted_data": {
                "personal_info": {"name": "Candidato", "email": "", "phone": "", "title": ""},
                "summary": "No se pudo extraer el perfil.",
                "experience": [],
                "education": [],
                "skills": []
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
  "job_title": "Título del puesto de trabajo",
  "company": "Nombre de la empresa (si se menciona, si no 'No especificada')",
  "seniority": "junior|mid|senior|lead (estima según la experiencia requerida o responsabilidades)",
  "required_skills": ["habilidad_requerida_1", "habilidad_requerida_2"],
  "nice_to_have_skills": ["habilidad_deseable_1", "habilidad_deseable_2"],
  "keywords_ats": ["palabra_clave_ats_1", "palabra_clave_ats_2"],
  "description": "Un resumen de 2 o 3 párrafos de la oferta."
}}
"""
    response = _generate_with_fallback(prompt, response_json=True)
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
            "job_title": "Error Extracción",
            "company": "Desconocida",
            "seniority": "mid",
            "required_skills": [],
            "nice_to_have_skills": [],
            "keywords_ats": [],
            "description": text[:500] + "..."
        }

def optimize_cv_json(cv_text: str, skills_to_add: list) -> dict:
    """
    Extráe el texto del CV, incrusta las nuevas habilidades de forma orgánica y devuelve un JSON estructurado.
    Respeta estrictamente la longitud para evitar desbordamientos en la plantilla de 1 página.
    """
    prompt = f"""
    Eres un optimizador de CVs. Recibes el texto bruto de un CV.
    Tu objetivo es extraer la información en una estructura JSON e incrustar orgánicamente estas habilidades: {', '.join(skills_to_add)}.
    
    REGLA DE ORO (LONGITUD ESTRICTA):
    - La descripción de cada "experience" debe mantenerse concisa (máximo 3 bullet points o una frase corta).
    - El "summary" no debe exceder los 400 caracteres.
    - La suma total del texto no puede hacer que el CV exceda 1 página. Sé directo y conciso.
    
    Devuelve EXACTAMENTE la siguiente estructura JSON, y nada más. Sin formato markdown (```json).
    {{
        "personal_info": {{"name": "Nombre", "email": "Email", "phone": "Teléfono", "title": "Título profesional"}},
        "summary": "Resumen profesional...",
        "experience": [
            {{"role": "Rol", "company": "Empresa", "duration": "Duración", "description": "Descripción..."}}
        ],
        "education": [
            {{"degree": "Título", "institution": "Institución", "year": "Año"}}
        ],
        "skills": ["skill1", "skill2"]
    }}
    
    Texto Original del Currículum:
    {cv_text}
    """
    response = _generate_with_fallback(prompt, response_json=True)
    response_text = response.text.strip()
    
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "", 1)
    if response_text.endswith("```"):
        response_text = response_text[::-1].replace("```", "", 1)[::-1]
        
    try:
        return json.loads(response_text.strip())
    except json.JSONDecodeError:
        return {
            "personal_info": {"name": "Error", "email": "", "phone": "", "title": ""},
            "summary": "Hubo un error al procesar el CV.",
            "experience": [],
            "education": [],
            "skills": skills_to_add
        }

def translate_cv_with_gemini(cv_data: dict, target_lang: str) -> dict:
    """
    Translates the text content of a structured CV JSON object into the target language using Gemini.
    """
    prompt = f"""
Eres un traductor profesional de Currículum Vitae.
Tu tarea es traducir todo el contenido de texto (strings) dentro del siguiente objeto JSON al idioma de destino: '{target_lang}'.

### Instrucciones Críticas:
1. Mantén la estructura del JSON, las claves y los tipos de datos intactos. Solo traduce los valores de texto.
2. Traduce resúmenes, títulos de puestos/roles, nombres de títulos/grados, nombres de materias, logros, responsabilidades y niveles de idioma.
3. NO traduzcas nombres propios de empresas, universidades o tecnologías/habilidades (ej. React, Node.js, Python, PostgreSQL, Git, Docker, etc.) a menos que sea necesario traducirlas (ej: "Inglés" -> "English").
4. Mantén los IDs y valores booleanos como 'current' sin modificar.
5. Devuelve única y estrictamente el objeto JSON modificado, en texto plano, sin bloques de código markdown (como ```json).

### CV JSON a traducir:
{json.dumps(cv_data, ensure_ascii=False, indent=2)}
"""
    
    response = _generate_with_fallback(prompt, response_json=True)
    response_text = response.text.strip()
    
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "", 1)
    if response_text.endswith("```"):
        response_text = response_text[::-1].replace("```", "", 1)[::-1]
        
    response_text = response_text.strip()
    
    try:
        parsed_json = json.loads(response_text)
        return parsed_json
    except json.JSONDecodeError:
        # Fallback if parsing fails
        return cv_data


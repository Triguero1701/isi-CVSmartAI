import os
from dotenv import load_dotenv
import google.generativeai as genai

# Carga las variables del archivo .env
load_dotenv()

# Lee la clave de las variables de entorno
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
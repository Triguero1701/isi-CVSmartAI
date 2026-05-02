FROM python:3.13-slim

WORKDIR /app

# Instalar dependencias necesarias para psycopg2 (por si psycopg2-binary requiere libpq)
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Variables de entorno
ENV FLASK_APP=run.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

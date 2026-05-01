import psycopg2
import os
from flask import Flask, g
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cvsmartai')

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cvsmartai')
        db = g._database = psycopg2.connect(db_url)
    return db

from flask.json.provider import DefaultJSONProvider
from datetime import datetime

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def create_app():
    app = Flask(__name__)
    app.json = CustomJSONProvider(app)
    CORS(app)

    @app.teardown_appcontext
    def close_connection(exception):
        db = getattr(g, '_database', None)
        if hasattr(db, 'close'):
            db.close()

    # Import and register blueprints
    from .routes import api_bp
    app.register_blueprint(api_bp)

    return app

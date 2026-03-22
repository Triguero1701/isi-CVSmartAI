import sqlite3
import os
from flask import Flask, g
from flask_cors import CORS

DATABASE = r'c:\Users\mtrig\vens\CVSmartAi\database\cvsmartai.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Makes queries return dictionaries rather than tuples
    return db

def create_app():
    app = Flask(__name__)
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

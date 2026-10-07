"""Jalankan StudyTask di laptop: python run_local.py -> buka http://localhost:5000"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///studytask.db")  # database file lokal

from flask import send_from_directory
from api.index import app

PUBLIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")


@app.get("/")
def home():
    return send_from_directory(PUBLIC, "index.html")


@app.get("/<path:filename>")
def static_files(filename):
    # Meniru folder /public Vercel: app.js, /vendor/react.production.min.js, dll.
    # Rute /api/... yang didefinisikan di api/index.py tetap diprioritaskan Flask duluan.
    return send_from_directory(PUBLIC, filename)


if __name__ == "__main__":
    app.run(debug=True, port=5000)

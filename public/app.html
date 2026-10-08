import os
import re
import uuid
from datetime import datetime, date
from functools import wraps

from flask import Flask, request, jsonify, g
from itsdangerous import URLSafeTimedSerializer, BadSignature
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash

url = os.getenv("DATABASE_URL", "sqlite:////tmp/studytask.db")
for prefix in ("postgres://", "postgresql://"):
    if url.startswith(prefix):
        url = "postgresql+psycopg://" + url[len(prefix):]
db = create_engine(url, pool_pre_ping=True)

# WAJIB diganti di Vercel (Environment Variables) dengan string acak panjang
ser = URLSafeTimedSerializer(os.getenv("SECRET_KEY", "dev-secret-ganti-di-vercel"))
FIELDS = ("title", "subject", "notes", "deadline", "priority", "status", "done_at")
DATE = re.compile(r"\d{4}-\d{2}-\d{2}")

SCHEMA = [
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, pw TEXT NOT NULL, created_at TEXT)",
    """CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, user_id TEXT, title TEXT NOT NULL, subject TEXT DEFAULT '',
        notes TEXT DEFAULT '', deadline TEXT DEFAULT '', priority INTEGER DEFAULT 1,
        status TEXT DEFAULT 'todo', done_at TEXT, created_at TEXT)""",
    "CREATE TABLE IF NOT EXISTS activity (user_id TEXT, day TEXT, PRIMARY KEY (user_id, day))",
    "CREATE TABLE IF NOT EXISTS badges (user_id TEXT, code TEXT, PRIMARY KEY (user_id, code))",
]
for sql in SCHEMA:
    with db.begin() as c:
        c.execute(text(sql))
# migrasi untuk tabel tasks versi lama (gagal = kolom sudah ada, aman diabaikan)
for sql in ("ALTER TABLE tasks ADD COLUMN user_id TEXT", "ALTER TABLE tasks ADD COLUMN done_at TEXT"):
    try:
        with db.begin() as c:
            c.execute(text(sql))
    except Exception:
        pass

app = Flask(__name__)


# ---------- AUTH (cookie HttpOnly bertanda tangan, cocok untuk serverless) ----------
def auth(fn):
    @wraps(fn)
    def wrapper(*a, **k):
        try:
            g.uid = ser.loads(request.cookies.get("st", ""), max_age=30 * 86400)
        except BadSignature:
            return jsonify(error="belum login"), 401
        return fn(*a, **k)
    return wrapper


def with_cookie(uid, username, code=200):
    r = jsonify(user={"username": username})
    r.status_code = code
    r.set_cookie("st", ser.dumps(uid), max_age=30 * 86400, httponly=True,
                 samesite="Lax", secure=bool(os.getenv("VERCEL")))
    return r


def creds():
    d = request.get_json(force=True) or {}
    return str(d.get("username", "")).strip().lower(), str(d.get("password", ""))


@app.post("/api/register")
def register():
    u, p = creds()
    if not re.fullmatch(r"[a-z0-9_]{3,20}", u):
        return jsonify(error="username 3-20 karakter (huruf/angka/_)"), 400
    if len(p) < 6:
        return jsonify(error="password minimal 6 karakter"), 400
    uid = uuid.uuid4().hex
    try:
        with db.begin() as c:
            c.execute(text("INSERT INTO users(id,username,pw,created_at) VALUES(:i,:u,:p,:t)"),
                      {"i": uid, "u": u, "p": generate_password_hash(p), "t": datetime.now().isoformat()})
    except IntegrityError:
        return jsonify(error="username sudah dipakai"), 409
    return with_cookie(uid, u, 201)


@app.post("/api/login")
def login():
    u, p = creds()
    with db.connect() as c:
        row = c.execute(text("SELECT id, pw FROM users WHERE username=:u"), {"u": u}).first()
    if not row or not check_password_hash(row.pw, p):
        return jsonify(error="username / password salah"), 401
    return with_cookie(row.id, u)


@app.post("/api/logout")
def logout():
    r = jsonify(ok=True)
    r.delete_cookie("st")
    return r


# ---------- STREAK + BADGE (dihitung di server, badge disimpan permanen) ----------
def streaks(days, today):
    ds = sorted({date.fromisoformat(d) for d in days})
    best = run = 0
    prev = None
    for d in ds:
        run = run + 1 if prev and (d - prev).days == 1 else 1
        best, prev = max(best, run), d
    alive = ds and (date.fromisoformat(today) - ds[-1]).days <= 1  # streak hangus kalau bolong sehari penuh
    return (run if alive else 0), best


def stats(uid, today):
    with db.begin() as c:
        def n(extra=""):
            sql = f"SELECT COUNT(*) FROM tasks WHERE user_id=:u AND status='done' {extra}"
            return c.execute(text(sql), {"u": uid}).scalar() or 0
        days = [r[0] for r in c.execute(text("SELECT day FROM activity WHERE user_id=:u"), {"u": uid})]
        cur, best = streaks(days, today)
        rules = {
            "first": n() >= 1,
            "q10": n() >= 10,
            "boss": n("AND priority=3") >= 1,
            "early": n("AND deadline<>'' AND done_at<=deadline") >= 3,
            "s3": best >= 3,
            "s7": best >= 7,
        }
        have = {r[0] for r in c.execute(text("SELECT code FROM badges WHERE user_id=:u"), {"u": uid})}
        new = [k for k, ok in rules.items() if ok and k not in have]
        for k in new:
            c.execute(text("INSERT INTO badges(user_id, code) VALUES(:u,:k)"), {"u": uid, "k": k})
    return {"streak": cur, "best": best, "earned": sorted(have | set(new)), "new": new, "days": sorted(days)[-14:]}


@app.get("/api/me")
@auth
def me():
    today = request.args.get("today", "")
    if not DATE.fullmatch(today):
        today = date.today().isoformat()
    with db.connect() as c:
        name = c.execute(text("SELECT username FROM users WHERE id=:u"), {"u": g.uid}).scalar()
    if not name:
        return jsonify(error="akun tidak ada"), 401
    return jsonify(user={"username": name}, **stats(g.uid, today))


# ---------- CRUD TASKS (per user) ----------
def clean(data):
    out = {k: data[k] for k in FIELDS if k in data}
    if "priority" in out:
        out["priority"] = max(1, min(3, int(out["priority"] or 1)))
    if "status" in out and out["status"] not in ("todo", "doing", "done"):
        out["status"] = "todo"
    if "done_at" in out and not DATE.fullmatch(str(out["done_at"] or "")):
        out.pop("done_at")
    return out


@app.get("/api/tasks")
@auth
def list_tasks():
    with db.connect() as c:
        rows = c.execute(text("SELECT * FROM tasks WHERE user_id=:u ORDER BY created_at DESC"),
                         {"u": g.uid}).mappings().all()
    return jsonify([dict(r) for r in rows])


@app.post("/api/tasks")
@auth
def create_task():
    d = clean(request.get_json(force=True))
    if not str(d.get("title", "")).strip():
        return jsonify(error="title wajib diisi"), 400
    d.update(id=uuid.uuid4().hex, user_id=g.uid, created_at=datetime.now().isoformat())
    cols, vals = ",".join(d), ",".join(":" + k for k in d)
    with db.begin() as c:
        c.execute(text(f"INSERT INTO tasks ({cols}) VALUES ({vals})"), d)
    return jsonify(d), 201


@app.put("/api/tasks/<tid>")
@auth
def update_task(tid):
    d = clean(request.get_json(force=True))
    if not d:
        return jsonify(error="tidak ada data"), 400
    sets = ",".join(f"{k}=:{k}" for k in d)
    with db.begin() as c:
        r = c.execute(text(f"UPDATE tasks SET {sets} WHERE id=:id AND user_id=:u"), {**d, "id": tid, "u": g.uid})
        if r.rowcount and d.get("status") == "done" and d.get("done_at"):
            c.execute(text("INSERT INTO activity(user_id, day) VALUES(:u,:d) ON CONFLICT DO NOTHING"),
                      {"u": g.uid, "d": d["done_at"]})
    if not r.rowcount:
        return jsonify(error="task tidak ditemukan"), 404
    return jsonify(ok=True)


@app.delete("/api/tasks/<tid>")
@auth
def delete_task(tid):
    with db.begin() as c:
        c.execute(text("DELETE FROM tasks WHERE id=:id AND user_id=:u"), {"id": tid, "u": g.uid})
    return jsonify(ok=True)

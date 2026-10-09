import os
import json
import random
import re
import uuid
from datetime import datetime, date, timedelta
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
BATTLE_QUESTIONS = 5
BATTLE_TIME_LIMIT = 15

QUESTION_BANK = [
    ("Kompleksitas waktu binary search pada array terurut adalah?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "mudah"),
    ("Struktur data yang mengikuti prinsip LIFO adalah?", ["Queue", "Stack", "Heap", "Graph"], 1, "mudah"),
    ("Struktur data yang mengikuti prinsip FIFO adalah?", ["Stack", "Queue", "Tree", "Set"], 1, "mudah"),
    ("Traversal tree yang menghasilkan urutan kiri-root-kanan adalah?", ["Preorder", "Inorder", "Postorder", "Level order"], 1, "mudah"),
    ("Manakah yang bukan tipe data primitif umum?", ["Integer", "Boolean", "String", "Array"], 3, "mudah"),
    ("Apa output operator modulo 17 % 5?", ["1", "2", "3", "4"], 1, "mudah"),
    ("Algoritma BFS biasanya menggunakan struktur data apa?", ["Stack", "Queue", "Heap", "Hash table"], 1, "mudah"),
    ("Algoritma DFS secara iteratif paling sering menggunakan?", ["Queue", "Stack", "Array terurut", "Priority queue"], 1, "mudah"),
    ("Kunci utama hash table adalah fungsi hash yang baik meminimalkan?", ["Sorting", "Collision", "Recursion", "Inheritance"], 1, "mudah"),
    ("Pada rekursi, kondisi yang menghentikan pemanggilan berulang disebut?", ["Loop guard", "Base case", "Constructor", "Callback"], 1, "mudah"),
    ("Kompleksitas worst-case insertion sort adalah?", ["O(log n)", "O(n)", "O(n log n)", "O(n²)"], 3, "menengah"),
    ("Kompleksitas rata-rata quicksort adalah?", ["O(log n)", "O(n)", "O(n log n)", "O(n²)"], 2, "menengah"),
    ("Kompleksitas worst-case quicksort terjadi saat pivot selalu?", ["Median", "Acak", "Elemen minimum/maksimum", "Duplikat"], 2, "menengah"),
    ("Algoritma yang cocok untuk shortest path dengan bobot non-negatif adalah?", ["Dijkstra", "BFS selalu", "Kruskal", "Binary search"], 0, "menengah"),
    ("Kruskal digunakan untuk mencari?", ["Topological sort", "Minimum spanning tree", "Longest path", "String match"], 1, "menengah"),
    ("Memoization terutama digunakan untuk mengurangi?", ["Penggunaan tipe data", "Perhitungan berulang", "Jumlah variabel", "Ukuran input"], 1, "menengah"),
    ("Syarat utama dynamic programming adalah submasalah yang?", ["Selalu independen", "Tumpang tindih dan memiliki optimal substructure", "Berukuran sama", "Tidak memiliki solusi"], 1, "menengah"),
    ("Topological sort hanya dapat diterapkan pada?", ["Undirected graph", "DAG", "Complete graph", "Cyclic graph"], 1, "menengah"),
    ("Heap maksimum selalu memiliki nilai terbesar di?", ["Daun paling kiri", "Root", "Daun paling kanan", "Node acak"], 1, "menengah"),
    ("Operasi pencarian rata-rata pada hash table yang baik adalah?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "menengah"),
    ("Manakah algoritma sorting yang stabil secara umum?", ["Heap sort", "Selection sort", "Merge sort", "Quick sort"], 2, "menengah"),
    ("Binary tree disebut balanced jika tinggi subtree kiri dan kanan berbeda paling banyak?", ["0", "1", "2", "log n"], 1, "menengah"),
    ("Teknik two pointers paling sering membantu mengurangi kompleksitas dari O(n²) menjadi?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 2, "menengah"),
    ("Union-Find efisien digunakan untuk mendeteksi?", ["Siklus pada graf tak berarah", "Palindrom", "Urutan string", "Nilai maksimum"], 0, "menengah"),
    ("Pada graph adjacency list, iterasi seluruh tetangga sebuah node bergantung pada?", ["Jumlah edge node tersebut", "Jumlah seluruh node saja", "Kedalaman tree", "Nilai bobot"], 0, "menengah"),
    ("Algoritma greedy membuat pilihan yang?", ["Selalu melihat seluruh solusi", "Terbaik secara lokal di setiap langkah", "Acak", "Paling mahal"], 1, "menengah"),
    ("Kompleksitas merge sort untuk n elemen adalah?", ["O(n)", "O(log n)", "O(n log n)", "O(n²)"], 2, "sulit"),
    ("Jika T(n)=2T(n/2)+n, kompleksitasnya menurut Master theorem adalah?", ["O(log n)", "O(n)", "O(n log n)", "O(n²)"], 2, "sulit"),
    ("Teknik backtracking biasanya mengembalikan pilihan ketika?", ["Menemukan solusi parsial yang tidak valid", "Input kosong", "Loop selesai normal", "Hash collision"], 0, "sulit"),
    ("Manakah representasi yang tepat untuk edge berbobot pada adjacency list?", ["Hanya node tujuan", "Pasangan node tujuan dan bobot", "Hanya bobot", "Indeks array saja"], 1, "sulit"),
    ("Algoritma Floyd-Warshall menyelesaikan masalah?", ["Single-source shortest path", "All-pairs shortest path", "Minimum cut saja", "Sorting"], 1, "sulit"),
]

SCHEMA = [
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, pw TEXT NOT NULL, created_at TEXT)",
    """CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, user_id TEXT, title TEXT NOT NULL, subject TEXT DEFAULT '',
        notes TEXT DEFAULT '', deadline TEXT DEFAULT '', priority INTEGER DEFAULT 1,
        status TEXT DEFAULT 'todo', done_at TEXT, created_at TEXT)""",
    "CREATE TABLE IF NOT EXISTS activity (user_id TEXT, day TEXT, PRIMARY KEY (user_id, day))",
    "CREATE TABLE IF NOT EXISTS badges (user_id TEXT, code TEXT, PRIMARY KEY (user_id, code))",
    """CREATE TABLE IF NOT EXISTS friend_requests (
        id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending', created_at TEXT,
        UNIQUE (sender_id, receiver_id))""",
    """CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY, prompt TEXT NOT NULL, option_a TEXT NOT NULL,
        option_b TEXT NOT NULL, option_c TEXT NOT NULL, option_d TEXT NOT NULL,
        correct_index INTEGER NOT NULL, difficulty TEXT DEFAULT 'menengah', topic TEXT DEFAULT 'Algoritma & Pemrograman')""",
    """CREATE TABLE IF NOT EXISTS battles (
        id TEXT PRIMARY KEY, challenger_id TEXT NOT NULL, opponent_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending', question_ids TEXT NOT NULL, current_question INTEGER DEFAULT 0,
        created_at TEXT NOT NULL, started_at TEXT, question_started_at TEXT,
        finished_at TEXT, winner_id TEXT)""",
    """CREATE TABLE IF NOT EXISTS battle_answers (
        id TEXT PRIMARY KEY, battle_id TEXT NOT NULL, question_index INTEGER NOT NULL,
        user_id TEXT NOT NULL, choice INTEGER NOT NULL, correct INTEGER NOT NULL,
        answered_at TEXT NOT NULL, elapsed_ms INTEGER NOT NULL, score_awarded INTEGER DEFAULT 0,
        UNIQUE (battle_id, question_index, user_id))""",
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

with db.begin() as c:
    for index, (prompt, options, correct, difficulty) in enumerate(QUESTION_BANK):
        exists = c.execute(text("SELECT 1 FROM questions WHERE prompt=:p"), {"p": prompt}).first()
        if not exists:
            c.execute(text("""
                INSERT INTO questions(id, prompt, option_a, option_b, option_c, option_d, correct_index, difficulty, topic)
                VALUES(:id, :prompt, :a, :b, :c, :d, :correct, :difficulty, :topic)
            """), {"id": "seed-" + str(index + 1), "prompt": prompt, "a": options[0],
                   "b": options[1], "c": options[2], "d": options[3], "correct": correct,
                   "difficulty": difficulty, "topic": "Algoritma & Pemrograman"})

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
            "first_blood": c.execute(text("SELECT COUNT(*) FROM battles WHERE winner_id=:u"), {"u": uid}).scalar() >= 1,
            "algo_master": c.execute(text("SELECT COUNT(*) FROM battles WHERE winner_id=:u"), {"u": uid}).scalar() >= 5,
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


# ---------- FRIENDS ----------
def friend_user(c, username):
    return c.execute(text("SELECT id, username FROM users WHERE username=:u"), {"u": username}).first()


@app.get("/api/friends")
@auth
def list_friends():
    with db.connect() as c:
        friends = c.execute(text("""
            SELECT u.username
            FROM friend_requests f
            JOIN users u ON u.id = CASE WHEN f.sender_id=:u THEN f.receiver_id ELSE f.sender_id END
            WHERE (f.sender_id=:u OR f.receiver_id=:u) AND f.status='accepted'
            ORDER BY u.username
        """), {"u": g.uid}).mappings().all()
        incoming = c.execute(text("""
            SELECT f.id, u.username
            FROM friend_requests f JOIN users u ON u.id=f.sender_id
            WHERE f.receiver_id=:u AND f.status='pending'
            ORDER BY f.created_at DESC
        """), {"u": g.uid}).mappings().all()
        outgoing = c.execute(text("""
            SELECT f.id, u.username
            FROM friend_requests f JOIN users u ON u.id=f.receiver_id
            WHERE f.sender_id=:u AND f.status='pending'
            ORDER BY f.created_at DESC
        """), {"u": g.uid}).mappings().all()
    return jsonify(
        friends=[dict(row) for row in friends],
        incoming=[dict(row) for row in incoming],
        outgoing=[dict(row) for row in outgoing],
    )


@app.post("/api/friends/request")
@auth
def send_friend_request():
    data = request.get_json(force=True) or {}
    username = str(data.get("username", "")).strip().lower()
    if not username:
        return jsonify(error="username wajib diisi"), 400

    with db.begin() as c:
        target = friend_user(c, username)
        if not target:
            return jsonify(error="username tidak ditemukan"), 404
        if target.id == g.uid:
            return jsonify(error="tidak bisa menambahkan diri sendiri"), 400

        existing = c.execute(text("""
            SELECT id, sender_id, status FROM friend_requests
            WHERE (sender_id=:me AND receiver_id=:target)
               OR (sender_id=:target AND receiver_id=:me)
        """), {"me": g.uid, "target": target.id}).first()
        if existing and existing.status == "accepted":
            return jsonify(error="kalian sudah berteman"), 409
        if existing and existing.status == "pending":
            if existing.sender_id == target.id:
                c.execute(text("UPDATE friend_requests SET status='accepted' WHERE id=:id"), {"id": existing.id})
                return jsonify(ok=True, auto_accepted=True)
            return jsonify(error="permintaan sudah dikirim"), 409
        if existing:
            c.execute(text("""
                UPDATE friend_requests
                SET sender_id=:me, receiver_id=:target, status='pending', created_at=:t
                WHERE id=:id
            """), {"id": existing.id, "me": g.uid, "target": target.id, "t": datetime.now().isoformat()})
        else:
            c.execute(text("""
                INSERT INTO friend_requests(id, sender_id, receiver_id, status, created_at)
                VALUES(:id, :sender, :receiver, 'pending', :t)
            """), {"id": uuid.uuid4().hex, "sender": g.uid, "receiver": target.id,
                   "t": datetime.now().isoformat()})
    return jsonify(ok=True, auto_accepted=False), 201


@app.post("/api/friends/respond")
@auth
def respond_friend_request():
    data = request.get_json(force=True) or {}
    request_id = str(data.get("request_id", ""))
    action = data.get("action")
    if action not in ("accept", "decline"):
        return jsonify(error="aksi tidak valid"), 400
    with db.begin() as c:
        r = c.execute(text("""
            UPDATE friend_requests SET status=:status
            WHERE id=:id AND receiver_id=:u AND status='pending'
        """), {"status": "accepted" if action == "accept" else "declined",
                "id": request_id, "u": g.uid})
    if not r.rowcount:
        return jsonify(error="permintaan tidak ditemukan"), 404
    return jsonify(ok=True)


@app.post("/api/friends/remove")
@auth
def remove_friend():
    data = request.get_json(force=True) or {}
    username = str(data.get("username", "")).strip().lower()
    with db.begin() as c:
        target = friend_user(c, username)
        if target:
            c.execute(text("""
                DELETE FROM friend_requests
                WHERE status='accepted'
                  AND ((sender_id=:me AND receiver_id=:target)
                    OR (sender_id=:target AND receiver_id=:me))
            """), {"me": g.uid, "target": target.id})
    return jsonify(ok=True)


# ---------- BATTLE CORE ----------
def battle_row(c, battle_id):
    return c.execute(text("SELECT * FROM battles WHERE id=:id"), {"id": battle_id}).mappings().first()


def battle_scores(c, battle_id):
    rows = c.execute(text("""
        SELECT user_id, COALESCE(SUM(score_awarded), 0) AS score
        FROM battle_answers WHERE battle_id=:id GROUP BY user_id
    """), {"id": battle_id}).mappings().all()
    return {row["user_id"]: int(row["score"]) for row in rows}


def award_battle_badges(c, user_id):
    wins = c.execute(text("SELECT COUNT(*) FROM battles WHERE winner_id=:u"), {"u": user_id}).scalar() or 0
    codes = []
    if wins >= 1:
        codes.append("first_blood")
    if wins >= 5:
        codes.append("algo_master")
    for code in codes:
        c.execute(text("INSERT INTO badges(user_id, code) VALUES(:u,:code) ON CONFLICT DO NOTHING"),
                  {"u": user_id, "code": code})


def advance_battle(c, battle):
    if battle["status"] != "active":
        return battle
    index = int(battle["current_question"])
    answered = c.execute(text("""
        SELECT COUNT(*) FROM battle_answers
        WHERE battle_id=:id AND question_index=:index
    """), {"id": battle["id"], "index": index}).scalar() or 0
    started = datetime.fromisoformat(battle["question_started_at"])
    expired = datetime.now() - started >= timedelta(seconds=BATTLE_TIME_LIMIT)
    if answered < 2 and not expired:
        return battle

    if index + 1 >= BATTLE_QUESTIONS:
        scores = battle_scores(c, battle["id"])
        challenger_score = scores.get(battle["challenger_id"], 0)
        opponent_score = scores.get(battle["opponent_id"], 0)
        winner = (battle["challenger_id"] if challenger_score > opponent_score else
                  battle["opponent_id"] if opponent_score > challenger_score else None)
        c.execute(text("""
            UPDATE battles SET status='finished', finished_at=:finished, winner_id=:winner
            WHERE id=:id AND status='active'
        """), {"id": battle["id"], "finished": datetime.now().isoformat(), "winner": winner})
        if winner:
            award_battle_badges(c, winner)
    else:
        c.execute(text("""
            UPDATE battles SET current_question=:index, question_started_at=:started
            WHERE id=:id AND status='active'
        """), {"id": battle["id"], "index": index + 1, "started": datetime.now().isoformat()})
    return battle_row(c, battle["id"])


def battle_payload(c, battle):
    scores = battle_scores(c, battle["id"])
    users = c.execute(text("""
        SELECT id, username FROM users WHERE id IN (:challenger, :opponent)
    """), {"challenger": battle["challenger_id"], "opponent": battle["opponent_id"]}).mappings().all()
    names = {row["id"]: row["username"] for row in users}
    mine = battle["challenger_id"] if g.uid == battle["challenger_id"] else battle["opponent_id"]
    other = battle["opponent_id"] if mine == battle["challenger_id"] else battle["challenger_id"]
    result = {
        "id": battle["id"], "status": battle["status"], "current_question": int(battle["current_question"]),
        "total_questions": BATTLE_QUESTIONS, "time_limit": BATTLE_TIME_LIMIT,
        "question_started_at": battle["question_started_at"], "started_at": battle["started_at"],
        "finished_at": battle["finished_at"], "winner": names.get(battle["winner_id"]) if battle["winner_id"] else None,
        "you": {"username": names.get(mine), "score": scores.get(mine, 0)},
        "opponent": {"username": names.get(other), "score": scores.get(other, 0)},
    }
    if battle["status"] == "active":
        started = datetime.fromisoformat(battle["question_started_at"])
        result["remaining_seconds"] = max(0, BATTLE_TIME_LIMIT - int((datetime.now() - started).total_seconds()))
        question_ids = json.loads(battle["question_ids"])
        question = c.execute(text("SELECT * FROM questions WHERE id=:id"), {"id": question_ids[int(battle["current_question"])]}).mappings().first()
        result["question"] = {
            "index": int(battle["current_question"]), "prompt": question["prompt"],
            "options": [question["option_a"], question["option_b"], question["option_c"], question["option_d"]],
        }
        mine_answer = c.execute(text("""
            SELECT choice, correct, score_awarded FROM battle_answers
            WHERE battle_id=:battle AND question_index=:index AND user_id=:user
        """), {"battle": battle["id"], "index": int(battle["current_question"]), "user": mine}).mappings().first()
        other_answer = c.execute(text("""
            SELECT 1 FROM battle_answers
            WHERE battle_id=:battle AND question_index=:index AND user_id=:user
        """), {"battle": battle["id"], "index": int(battle["current_question"]), "user": other}).first()
        result["your_answer"] = dict(mine_answer) if mine_answer else None
        result["opponent_answered"] = bool(other_answer)
    return result


@app.get("/api/battles")
@auth
def list_battles():
    with db.begin() as c:
        incoming = c.execute(text("""
            SELECT b.id, u.username, b.created_at
            FROM battles b JOIN users u ON u.id=b.challenger_id
            WHERE b.opponent_id=:u AND b.status='pending' ORDER BY b.created_at DESC
        """), {"u": g.uid}).mappings().all()
        outgoing = c.execute(text("""
            SELECT b.id, u.username, b.created_at
            FROM battles b JOIN users u ON u.id=b.opponent_id
            WHERE b.challenger_id=:u AND b.status='pending' ORDER BY b.created_at DESC
        """), {"u": g.uid}).mappings().all()
        active = c.execute(text("""
            SELECT id FROM battles
            WHERE (challenger_id=:u OR opponent_id=:u) AND status='active'
            ORDER BY started_at DESC
        """), {"u": g.uid}).scalars().all()
    return jsonify(incoming=[dict(row) for row in incoming], outgoing=[dict(row) for row in outgoing], active=list(active))


@app.post("/api/battles/challenge")
@auth
def challenge_friend():
    data = request.get_json(force=True) or {}
    username = str(data.get("username", "")).strip().lower()
    with db.begin() as c:
        target = friend_user(c, username)
        if not target:
            return jsonify(error="teman tidak ditemukan"), 404
        if target.id == g.uid:
            return jsonify(error="tidak bisa menantang diri sendiri"), 400
        friendship = c.execute(text("""
            SELECT 1 FROM friend_requests
            WHERE status='accepted'
              AND ((sender_id=:me AND receiver_id=:target) OR (sender_id=:target AND receiver_id=:me))
        """), {"me": g.uid, "target": target.id}).first()
        if not friendship:
            return jsonify(error="hanya teman yang bisa ditantang"), 403
        existing = c.execute(text("""
            SELECT 1 FROM battles
            WHERE status IN ('pending', 'active')
              AND ((challenger_id=:me AND opponent_id=:target) OR (challenger_id=:target AND opponent_id=:me))
        """), {"me": g.uid, "target": target.id}).first()
        if existing:
            return jsonify(error="masih ada battle yang berjalan"), 409
        question_rows = c.execute(text("SELECT id FROM questions")).scalars().all()
        question_ids = random.sample(question_rows, BATTLE_QUESTIONS)
        battle_id = uuid.uuid4().hex
        c.execute(text("""
            INSERT INTO battles(id, challenger_id, opponent_id, status, question_ids, current_question, created_at)
            VALUES(:id, :challenger, :opponent, 'pending', :questions, 0, :created)
        """), {"id": battle_id, "challenger": g.uid, "opponent": target.id,
                "questions": json.dumps(question_ids), "created": datetime.now().isoformat()})
    return jsonify(id=battle_id, username=target.username), 201


@app.post("/api/battles/respond")
@auth
def respond_battle():
    data = request.get_json(force=True) or {}
    action = data.get("action")
    if action not in ("accept", "decline"):
        return jsonify(error="aksi tidak valid"), 400
    with db.begin() as c:
        battle = battle_row(c, str(data.get("battle_id", "")))
        if not battle or battle["opponent_id"] != g.uid or battle["status"] != "pending":
            return jsonify(error="tantangan tidak ditemukan"), 404
        if action == "decline":
            c.execute(text("UPDATE battles SET status='declined' WHERE id=:id"), {"id": battle["id"]})
        else:
            now = datetime.now().isoformat()
            c.execute(text("""
                UPDATE battles SET status='active', started_at=:now, question_started_at=:now
                WHERE id=:id AND status='pending'
            """), {"id": battle["id"], "now": now})
    return jsonify(ok=True, status="active" if action == "accept" else "declined")


@app.get("/api/battles/history")
@auth
def battle_history():
    with db.begin() as c:
        rows = c.execute(text("""
            SELECT b.*, cu.username AS challenger, ou.username AS opponent
            FROM battles b JOIN users cu ON cu.id=b.challenger_id JOIN users ou ON ou.id=b.opponent_id
            WHERE (b.challenger_id=:u OR b.opponent_id=:u) AND b.status IN ('finished', 'declined')
            ORDER BY COALESCE(b.finished_at, b.created_at) DESC LIMIT 20
        """), {"u": g.uid}).mappings().all()
        result = []
        for row in rows:
            scores = battle_scores(c, row["id"])
            result.append({"id": row["id"], "status": row["status"], "challenger": row["challenger"],
                           "opponent": row["opponent"],
                           "winner": row["challenger"] if row["winner_id"] == row["challenger_id"] else
                           row["opponent"] if row["winner_id"] == row["opponent_id"] else None,
                           "your_score": scores.get(g.uid, 0),
                           "opponent_score": scores.get(row["opponent_id"] if g.uid == row["challenger_id"] else row["challenger_id"], 0),
                           "finished_at": row["finished_at"]})
    return jsonify(result)


@app.get("/api/battles/<battle_id>")
@auth
def get_battle(battle_id):
    with db.begin() as c:
        battle = battle_row(c, battle_id)
        if not battle or g.uid not in (battle["challenger_id"], battle["opponent_id"]):
            return jsonify(error="battle tidak ditemukan"), 404
        battle = advance_battle(c, battle)
        return jsonify(battle_payload(c, battle))


@app.post("/api/battles/<battle_id>/answer")
@auth
def answer_battle(battle_id):
    data = request.get_json(force=True) or {}
    try:
        question_index = int(data.get("question_index"))
        choice = int(data.get("choice"))
    except (TypeError, ValueError):
        return jsonify(error="jawaban tidak valid"), 400
    if choice not in range(4):
        return jsonify(error="pilihan tidak valid"), 400
    with db.begin() as c:
        battle = battle_row(c, battle_id)
        if not battle or g.uid not in (battle["challenger_id"], battle["opponent_id"]):
            return jsonify(error="battle tidak ditemukan"), 404
        battle = advance_battle(c, battle)
        if battle["status"] != "active":
            return jsonify(error="battle sudah selesai"), 409
        if question_index != int(battle["current_question"]):
            return jsonify(error="soal sudah berganti"), 409
        existing = c.execute(text("""
            SELECT 1 FROM battle_answers WHERE battle_id=:battle AND question_index=:index AND user_id=:user
        """), {"battle": battle_id, "index": question_index, "user": g.uid}).first()
        if existing:
            return jsonify(error="jawaban sudah dikirim"), 409
        question_ids = json.loads(battle["question_ids"])
        question = c.execute(text("SELECT correct_index FROM questions WHERE id=:id"),
                             {"id": question_ids[question_index]}).first()
        now = datetime.now()
        started = datetime.fromisoformat(battle["question_started_at"])
        elapsed_ms = max(0, int((now - started).total_seconds() * 1000))
        correct = int(choice == question.correct_index)
        c.execute(text("""
            INSERT INTO battle_answers(id, battle_id, question_index, user_id, choice, correct, answered_at, elapsed_ms, score_awarded)
            VALUES(:id, :battle, :index, :user, :choice, :correct, :answered, :elapsed, :score)
        """), {"id": uuid.uuid4().hex, "battle": battle_id, "index": question_index, "user": g.uid,
                "choice": choice, "correct": correct, "answered": now.isoformat(), "elapsed": elapsed_ms,
                "score": correct})
        answers = c.execute(text("""
            SELECT user_id, correct, answered_at FROM battle_answers
            WHERE battle_id=:battle AND question_index=:index
        """), {"battle": battle_id, "index": question_index}).mappings().all()
        if len(answers) == 2 and all(row["correct"] for row in answers):
            fastest = min(answers, key=lambda row: row["answered_at"])["user_id"]
            c.execute(text("""
                UPDATE battle_answers SET score_awarded=2
                WHERE battle_id=:battle AND question_index=:index AND user_id=:user
            """), {"battle": battle_id, "index": question_index, "user": fastest})
        battle = advance_battle(c, battle)
        return jsonify(battle_payload(c, battle))

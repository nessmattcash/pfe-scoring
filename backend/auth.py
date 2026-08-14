"""
STBGRisk — Auth module
SQLite + argon2 + JWT
"""
import sqlite3, secrets, time, hashlib
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY  = "stbg-risk-super-secret-key-2026-pfe-ayoub"
ALGORITHM   = "HS256"
TOKEN_EXPIRE_HOURS = 24
RESET_CODE_EXPIRE_MINUTES = 15

DB_PATH = Path(__file__).parent / "users.db"

pwd_ctx    = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2     = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
router     = APIRouter(prefix="/auth", tags=["auth"])

# ── Database setup ────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL,
            email      TEXT    NOT NULL UNIQUE,
            role       TEXT    NOT NULL DEFAULT 'Analyste',
            password   TEXT    NOT NULL,
            created_at TEXT    NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reset_codes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT NOT NULL,
            code       TEXT NOT NULL,
            expires_at REAL NOT NULL,
            used       INTEGER DEFAULT 0
        );
    """)
    conn.commit()

    # Create default users if the table is empty
    if not conn.execute("SELECT 1 FROM users LIMIT 1").fetchone():
        conn.execute("""
            INSERT INTO users (name, email, role, password, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "Khlifi Ayoub",
            "ayoub@stbgrisk.tn",
            "Administrateur",
            pwd_ctx.hash("stbg2026"),
            datetime.now().isoformat()
        ))
        conn.commit()

    # Ensure the requested admin account always exists (idempotent — safe to
    # run on every startup, won't duplicate or reset an existing admin).
    existing_admin = conn.execute("SELECT id FROM users WHERE email=?", ("admin@stbgrisk.tn",)).fetchone()
    if not existing_admin:
        conn.execute("""
            INSERT INTO users (name, email, role, password, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "Administrateur",
            "admin@stbgrisk.tn",
            "Administrateur",
            pwd_ctx.hash("admin1234"),
            datetime.now().isoformat()
        ))
        conn.commit()

    conn.close()

# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    name:     str
    email:    str
    password: str
    role:     str = "Analyste"

class LoginIn(BaseModel):
    email:    str
    password: str

class ForgotIn(BaseModel):
    email: str

class ResetIn(BaseModel):
    email:    str
    code:     str
    password: str

# ── Helpers ───────────────────────────────────────────────────────────────────
def make_token(user_id: int, email: str) -> str:
    payload = {
        "sub":   str(user_id),
        "email": email,
        "exp":   datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_current_user(token: str = Depends(oauth2)):
    if not token:
        raise HTTPException(401, "Non authentifié")
    data = verify_token(token)
    if not data:
        raise HTTPException(401, "Token invalide ou expiré")
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=?", (data["sub"],)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(401, "Utilisateur introuvable")
    return dict(user)

# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register")
def register(body: RegisterIn):
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email=?", (body.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(400, "Cet email est déjà utilisé")
    if len(body.password) < 6:
        conn.close()
        raise HTTPException(400, "Le mot de passe doit faire au moins 6 caractères")
    hashed = pwd_ctx.hash(body.password)
    cur = conn.execute("""
        INSERT INTO users (name, email, role, password, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (body.name.strip(), body.email.lower().strip(), body.role, hashed, datetime.now().isoformat()))
    conn.commit()
    user_id = cur.lastrowid
    conn.close()
    token = make_token(user_id, body.email)
    return {
        "token": token,
        "user": {"id": user_id, "name": body.name, "email": body.email, "role": body.role}
    }

@router.post("/login")
def login(body: LoginIn):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (body.email.lower().strip(),)).fetchone()
    conn.close()
    if not user or not pwd_ctx.verify(body.password, user["password"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    token = make_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
    }

@router.post("/forgot")
def forgot(body: ForgotIn):
    conn = get_db()
    user = conn.execute("SELECT id FROM users WHERE email=?", (body.email.lower().strip(),)).fetchone()
    conn.close()
    # Always return 200 to avoid email enumeration
    if not user:
        return {"message": "Si cet email existe, un code a été envoyé"}
    code = str(secrets.randbelow(900000) + 100000)  # 6-digit code
    expires = time.time() + RESET_CODE_EXPIRE_MINUTES * 60
    conn = get_db()
    conn.execute("INSERT INTO reset_codes (email, code, expires_at) VALUES (?,?,?)",
                 (body.email.lower().strip(), code, expires))
    conn.commit()
    conn.close()
    # In prod: send email. For PFE: return code directly
    print(f"[RESET CODE] {body.email} → {code}")
    return {"message": "Code envoyé", "dev_code": code}  # remove dev_code in prod

@router.post("/reset")
def reset(body: ResetIn):
    conn = get_db()
    row = conn.execute("""
        SELECT * FROM reset_codes
        WHERE email=? AND code=? AND used=0 AND expires_at>?
        ORDER BY id DESC LIMIT 1
    """, (body.email.lower().strip(), body.code, time.time())).fetchone()
    if not row:
        conn.close()
        raise HTTPException(400, "Code invalide ou expiré")
    if len(body.password) < 6:
        conn.close()
        raise HTTPException(400, "Le mot de passe doit faire au moins 6 caractères")
    hashed = pwd_ctx.hash(body.password)
    conn.execute("UPDATE users SET password=? WHERE email=?", (hashed, body.email.lower().strip()))
    conn.execute("UPDATE reset_codes SET used=1 WHERE id=?", (row["id"],))
    conn.commit()
    conn.close()
    return {"message": "Mot de passe mis à jour"}

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"user": {k: user[k] for k in ("id","name","email","role")}}

@router.get("/users")
def list_users(user=Depends(get_current_user)):
    if user["role"] != "Administrateur":
        raise HTTPException(403, "Réservé aux administrateurs")
    conn = get_db()
    rows = conn.execute("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC").fetchall()
    conn.close()
    return {"users": [dict(r) for r in rows], "total": len(rows)}
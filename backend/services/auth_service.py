import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parents[1] / "data" / "cypher.db"


class AuthService:
    def __init__(self):
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_database()

    def _connection(self):
        connection = sqlite3.connect(DATABASE_PATH)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize_database(self):
        with self._connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    display_name TEXT NOT NULL,
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                CREATE TABLE IF NOT EXISTS practice_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    scenario_id TEXT NOT NULL,
                    level TEXT NOT NULL,
                    conversation_json TEXT NOT NULL,
                    assessment_json TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                """
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 260000).hex()

    def _create_token(self, user_id: int) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        with self._connection() as connection:
            connection.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user_id, expires_at))
        return token

    def register(self, email: str, password: str, display_name: str):
        email = email.strip().lower()
        if len(password) < 8:
            raise ValueError("Password must have at least 8 characters.")
        salt = os.urandom(16).hex()
        password_hash = self._hash_password(password, salt)
        try:
            with self._connection() as connection:
                cursor = connection.execute(
                    "INSERT INTO users (email, display_name, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                    (email, display_name.strip() or email.split("@")[0], salt, password_hash, datetime.now(timezone.utc).isoformat()),
                )
                user_id = cursor.lastrowid
        except sqlite3.IntegrityError as error:
            raise ValueError("An account with this email already exists.") from error
        return self._user_payload(user_id), self._create_token(user_id)

    def login(self, email: str, password: str):
        with self._connection() as connection:
            user = connection.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        if not user or not hmac.compare_digest(self._hash_password(password, user["password_salt"]), user["password_hash"]):
            raise ValueError("Email or password is incorrect.")
        return self._user_payload(user["id"]), self._create_token(user["id"])

    def get_user_from_token(self, token: str | None):
        if not token:
            return None
        with self._connection() as connection:
            row = connection.execute(
                "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?",
                (token, datetime.now(timezone.utc).isoformat()),
            ).fetchone()
        return self._user_payload(row["id"]) if row else None

    def _user_payload(self, user_id: int):
        with self._connection() as connection:
            user = connection.execute("SELECT id, email, display_name, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(user)

    def save_practice_session(self, user_id: int, scenario_id: str, level: str, conversation_json: str, assessment_json: str | None):
        with self._connection() as connection:
            cursor = connection.execute(
                "INSERT INTO practice_sessions (user_id, scenario_id, level, conversation_json, assessment_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, scenario_id, level, conversation_json, assessment_json, datetime.now(timezone.utc).isoformat()),
            )
        return cursor.lastrowid

    def dashboard(self, user_id: int):
        with self._connection() as connection:
            sessions = connection.execute(
                "SELECT id, scenario_id, level, assessment_json, created_at FROM practice_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 12", (user_id,)
            ).fetchall()
        session_rows = []
        for item in sessions:
            session = dict(item)
            session["assessment"] = json.loads(session.pop("assessment_json")) if session.get("assessment_json") else None
            session_rows.append(session)
        return {"user": self._user_payload(user_id), "sessions": session_rows, "session_count": len(session_rows)}


auth_service = AuthService()

import sqlite3
from contextlib import closing
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "database" / "resume_screener.db"


def get_connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DATABASE_PATH)


def init_db() -> None:
    with closing(get_connection()) as connection:
        with connection:
            create_tables(connection)


def save_uploaded_resume(original_filename: str, saved_path: str) -> None:
    with closing(get_connection()) as connection:
        with connection:
            create_tables(connection)
            connection.execute(
                """
                INSERT INTO uploaded_resumes (original_filename, saved_path)
                VALUES (?, ?)
                """,
                (original_filename, saved_path),
            )


def create_tables(connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS uploaded_resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_filename TEXT NOT NULL,
            saved_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

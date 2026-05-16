from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


def save_upload_file(upload_file: UploadFile) -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(upload_file.filename or "").suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError("Only PDF and DOCX resumes are supported")

    safe_name = f"{uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / safe_name

    with destination.open("wb") as output:
        output.write(upload_file.file.read())

    return destination


def extract_text_from_file(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix == ".docx":
        return extract_text_from_docx(path)
    raise ValueError("Unsupported resume file type")


def extract_text_from_pdf(path: Path) -> str:
    try:
        import fitz

        with fitz.open(path) as document:
            return "\n".join(page.get_text() for page in document)
    except ImportError:
        try:
            import pdfplumber

            with pdfplumber.open(path) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except ImportError as error:
            raise RuntimeError(
                "Install PyMuPDF or pdfplumber to parse PDF resumes"
            ) from error


def extract_text_from_docx(path: Path) -> str:
    try:
        from docx import Document
    except ImportError as error:
        raise RuntimeError("Install python-docx to parse DOCX resumes") from error

    document = Document(path)
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def guess_candidate_name(text: str, fallback: str = "Unknown Candidate") -> str:
    for line in text.splitlines():
        line = line.strip()
        if line:
            return line[:80]
    return fallback

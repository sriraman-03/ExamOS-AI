import re
from pypdf import PdfReader


class DocumentProcessingError(Exception):
    pass


def extract_text_from_pdf(filepath: str) -> str:
    try:
        reader = PdfReader(filepath)
    except Exception as e:
        raise DocumentProcessingError(f"Could not open this PDF. It may be corrupted. ({e})")

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception:
            raise DocumentProcessingError("This PDF is password-protected. Remove the password and re-upload.")

    text_parts = []
    for page in reader.pages:
        try:
            text_parts.append(page.extract_text() or "")
        except Exception:
            continue

    full_text = "\n".join(text_parts).strip()
    if not full_text:
        raise DocumentProcessingError(
            "No extractable text was found. This PDF may be a scanned image without OCR text."
        )
    return full_text


def clean_text(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 150) -> list[str]:
    """Split into overlapping chunks by characters, breaking on sentence/paragraph
    boundaries where possible so retrieved chunks read naturally."""
    text = text.strip()
    if len(text) <= chunk_size:
        return [text] if text else []

    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        if end < length:
            boundary = text.rfind(". ", start, end)
            if boundary == -1 or boundary < start + chunk_size * 0.4:
                boundary = text.rfind("\n", start, end)
            if boundary != -1 and boundary > start:
                end = boundary + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= length:
            break
        next_start = end - overlap
        start = next_start if next_start > start else end
    return chunks

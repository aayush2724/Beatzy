"""Helpers for extracting song metadata from filenames."""

import re

_JUNK_SUFFIX = re.compile(
    r"\s*[\(\[][^\)\]]*(?:mp3\.pm|youtube|lyrics|official|audio|video|hd|4k)[^\)\]]*[\)\]]\s*$",
    re.IGNORECASE,
)


def clean_title(title: str) -> str:
    """Strip download-site junk from parsed titles."""
    cleaned = _JUNK_SUFFIX.sub("", title or "").strip()
    return cleaned or (title or "").strip()


def parse_filename(filename: str) -> dict:
    """Best-effort artist/title from upload filename."""
    if not filename:
        return {}

    name = filename
    for ext in (".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac"):
        if name.lower().endswith(ext):
            name = name[: -len(ext)]
            break

    # Common pattern: Artist_-_Title
    if "_-_" in name:
        artist, title = name.split("_-_", 1)
        return {
            "artist": artist.replace("_", " ").strip(),
            "title": clean_title(title.replace("_", " ").strip()),
            "isrc": None,
        }

    clean = name.replace("_", " ")
    for sep in (" - ", " – ", " — "):
        if sep in clean:
            artist, title = clean.split(sep, 1)
            return {
                "artist": artist.strip(),
                "title": clean_title(title.strip()),
                "isrc": None,
            }

    if "-" in clean:
        artist, title = clean.split("-", 1)
        return {
            "artist": artist.strip(),
            "title": clean_title(title.strip()),
            "isrc": None,
        }

    if clean.strip():
        return {"artist": "", "title": clean_title(clean.strip()), "isrc": None}

    return {}

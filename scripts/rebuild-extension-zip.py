#!/usr/bin/env python3
"""Rebuild the advertised Cashly extension zip from the canonical unpacked files."""
from __future__ import annotations

import hashlib
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANON = ROOT / "backend" / "extension"
PUBLIC = ROOT / "frontend" / "public" / "extension"
CHROME = ROOT / "frontend" / "public" / "extension-chrome"
ZIP_PATH = ROOT / "frontend" / "public" / "cashly-extension.zip"

INCLUDE_FILES = [
    "manifest.json",
    "manifest-firefox.json",
    "background.js",
    "background-firefox.js",
    "content.js",
    "content-website.js",
    "content.css",
    "popup.js",
    "popup.html",
    "popup.css",
    "config.js",
    "settings.html",
    "settings.js",
    "constants.js",
    "utils.js",
]

SKIP_DIRS = {
    "vibetracker-chrome",
    "vibetracker-firefox",
    "expense-tracker-chrome-v2",
    "node_modules",
    "dist",
}


def copy_canonical() -> None:
    for name in INCLUDE_FILES:
        source = CANON / name
        if not source.exists():
            continue
        for dest_dir in (PUBLIC, CHROME):
            dest_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, dest_dir / name)
    icons = CANON / "icons"
    if icons.exists():
        for dest_dir in (PUBLIC, CHROME):
            dest_icons = dest_dir / "icons"
            dest_icons.mkdir(parents=True, exist_ok=True)
            for icon in icons.iterdir():
                if icon.is_file():
                    shutil.copy2(icon, dest_icons / icon.name)


def should_add(path: Path) -> bool:
    rel = path.relative_to(PUBLIC).as_posix()
    if any(part in SKIP_DIRS for part in path.relative_to(PUBLIC).parts):
        return False
    if path.suffix in {".md", ".py", ".lock", ".zip"}:
        return False
    if path.name in {"package.json", "package-lock.json", "build.js", "build-all.js", "generate-icons.js"}:
        return False
    if path.name.startswith("mock_") or path.name.startswith("test-"):
        return False
    return True


def rebuild_zip() -> None:
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(PUBLIC.rglob("*")):
            if not path.is_file() or not should_add(path):
                continue
            archive.write(path, path.relative_to(PUBLIC).as_posix())


def main() -> None:
    copy_canonical()
    rebuild_zip()
    content = zipfile.ZipFile(ZIP_PATH).read("content.js")
    digest = hashlib.sha256(content).hexdigest()[:12]
    public_digest = hashlib.sha256((PUBLIC / "content.js").read_bytes()).hexdigest()[:12]
    canon_digest = hashlib.sha256((CANON / "content.js").read_bytes()).hexdigest()[:12]
    if digest != public_digest or digest != canon_digest:
        raise SystemExit(f"zip/content mismatch zip={digest} public={public_digest} canon={canon_digest}")
    print(f"Rebuilt {ZIP_PATH} content.js sha {digest} lines {content.count(chr(10).encode()) + 1}")


if __name__ == "__main__":
    main()

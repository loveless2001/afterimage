"""Verify this reference snapshot offline using only the Python standard library."""
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit


def main():
    root = Path(__file__).resolve().parent
    catalog = json.loads((root / "sources.json").read_text())
    records = catalog["sources"]
    sources = {record["id"]: record for record in records}
    if len(sources) != len(records):
        raise ValueError("Duplicate source IDs")
    downloads = json.loads((root / "downloads.json").read_text())
    book = (root / "SOURCEBOOK.md").read_text()
    for source_id, record in sources.items():
        if f"### {source_id} " not in book:
            raise ValueError(f"Source {source_id} has no sourcebook entry")
        if urlsplit(record["url"]).scheme != "https":
            raise ValueError(f"Unexpected source URL: {source_id}")
        for field in ["local_notes", "local_pdf", "download_manifest"]:
            if field in record and not (root / record[field]).is_file():
                raise ValueError(f"Missing {field}: {source_id}")
    expected_sums = []
    for item in downloads:
        if item["source_id"] not in sources or item["status"] != "downloaded":
            raise ValueError(f"Unresolved download: {item}")
        file = root / item["local_path"]
        data = file.read_bytes()
        if not data.startswith(b"%PDF-"):
            raise ValueError(f"Not a PDF: {file}")
        if len(data) != item["bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
            raise ValueError(f"Changed PDF bytes: {file}")
        expected_sums.append(f"{item['sha256']}  {item['local_path']}\n")
    if (root / "SHA256SUMS").read_text() != "".join(expected_sums):
        raise ValueError("SHA256SUMS disagrees with downloads.json")
    for document in root.glob("*.md"):
        for target in re.findall(r"\]\(([^)]+)\)", document.read_text()):
            parsed = urlsplit(target)
            if not parsed.scheme and parsed.path and not (document.parent / unquote(parsed.path)).exists():
                raise ValueError(f"Broken local link in {document.name}: {target}")
    print(f"Verified {len(sources)} indexed sources and {len(downloads)} original PDFs.")
    print(f"Recorded PDF pages: {sum(item['pages'] for item in downloads)}; hashes and local links match.")


if __name__ == "__main__":
    main()

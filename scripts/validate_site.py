from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for name in ("href", "src"):
            if attrs.get(name):
                self.refs.append(attrs[name])

pages = [ROOT / "index.html", ROOT / "apps/begemot/index.html", ROOT / "apps/begemot/privacy.html"]
for page in pages:
    parser = Links()
    parser.feed(page.read_text(encoding="utf-8"))
    for ref in parser.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or not parsed.path:
            continue
        target = (page.parent / unquote(parsed.path)).resolve()
        if target.is_dir():
            target /= "index.html"
        if not target.is_file():
            raise SystemExit(f"Missing local asset: {page.relative_to(ROOT)} -> {ref}")

home = (ROOT / "index.html").read_text(encoding="utf-8")
begemot = (ROOT / "apps/begemot/index.html").read_text(encoding="utf-8")
privacy = (ROOT / "apps/begemot/privacy.html").read_text(encoding="utf-8")
workflow = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
checks = {
    "Secretworld home": "Тайныймир" in home and "Secretworld" in home,
    "Begemot catalog link": "apps/begemot/" in home,
    "Begemot app page": "Бегемот" in begemot and "0.6.3" in begemot,
    "privacy page": "Приватность" in privacy and "журнал звонков" in privacy,
    "Pages deploy workflow": all(x in workflow for x in ("configure-pages@v5", "upload-pages-artifact@v4", "deploy-pages@v4", "pages: write", "id-token: write")),
}
failed = [name for name, ok in checks.items() if not ok]
print(f"site_contract_test: {len(checks) - len(failed)}/{len(checks)} PASS")
if failed:
    raise SystemExit("FAIL: " + ", ".join(failed))

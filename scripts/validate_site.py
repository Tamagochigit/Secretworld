from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json, re

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

pages = [ROOT / "index.html", ROOT / "apps/begemot/index.html", ROOT / "apps/begemot/iphone/index.html", ROOT / "apps/begemot/privacy.html", ROOT / "apps/begemot/us/index.html", ROOT / "apps/begemot/admin/index.html"]
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
us_page = (ROOT / "apps/begemot/us/index.html").read_text(encoding="utf-8")
admin = (ROOT / "apps/begemot/admin/index.html").read_text(encoding="utf-8")
iphone = (ROOT / "apps/begemot/iphone/index.html").read_text(encoding="utf-8")
iphone_webv3 = (ROOT / "apps/begemot/iphone/web-v3.js").read_text(encoding="utf-8")
iphone_manifest = json.loads((ROOT / "apps/begemot/iphone/manifest.webmanifest").read_text(encoding="utf-8"))
iphone_assets = [ROOT / "apps/begemot/iphone" / x["src"] for x in iphone_manifest.get("icons", [])]
workflow = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
directory = json.loads((ROOT / "apps/begemot/data/directory.json").read_text(encoding="utf-8"))
directory_items = directory.get("items", [])
us = json.loads((ROOT / "apps/begemot/data/us.json").read_text(encoding="utf-8"))
us_items = us.get("items", [])
directory_valid = bool(directory_items) and all(
    re.fullmatch(r"7\d{10}", str(x.get("number", "")))
    and x.get("country") == "RU" and x.get("trusted") is True and x.get("official") is True
    and x.get("risk", 100) <= 20 and x.get("block") is False
    and str(x.get("source", "")).startswith(x.get("label", "").split(" · ")[0] + " · https://")
    and re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(x.get("checked", "")))
    for x in directory_items
)
checks = {
    "Secretworld home": "Тайныймир" in home and "Secretworld" in home,
    "Begemot catalog link": "apps/begemot/" in home,
    "Begemot app page": "Бегемот" in begemot and "0.6.5" in begemot and "50" in begemot,
    "privacy page": "Приватность" in privacy and "журнал звонков" in privacy,
    "iPhone web app page": all(x in iphone for x in ("id=" + chr(34) + "checkForm", "id=" + chr(34) + "chatForm", "id=" + chr(34) + "networkTest", "id=" + chr(34) + "usList", "id=" + chr(34) + "archiveButton", "manifest.webmanifest")) and "platform-switch" not in iphone and "webPhoneFind" in iphone_webv3,
    "iPhone install manifest": iphone_manifest.get("scope") == "./" and all(p.is_file() for p in iphone_assets),
    "Planet T favicon linked sitewide": all("rel=" + chr(34) + "icon" in page.read_text(encoding="utf-8") for page in pages) and (ROOT / "favicon.svg").is_file(),
    "Separate iPhone app links": "apps/begemot/iphone/" in home and "Веб-приложение для iPhone" in begemot and "platform-switch" not in begemot,
    "Pages deploy workflow": all(x in workflow for x in ("configure-pages@v5", "upload-pages-artifact@v4", "deploy-pages@v4", "pages: write", "id-token: write")),
    "Official Russian phone feed and provenance": directory_valid and len(directory_items) >= 14,
    "Localized UС content feed": len(us_items) >= 7 and all(
        x.get("id") and x.get("translations", {}).get("ru", {}).get("title") and x.get("translations", {}).get("ru", {}).get("body")
        and x.get("translations", {}).get("en", {}).get("title") and x.get("translations", {}).get("en", {}).get("body")
        for x in us_items
    ),
    "Website material reader": "data/us.json" in us_page and "data-lang=\"en\"" in us_page and "data-lang=\"ru\"" in us_page,
    "GitHub Pages content admin": "api.github.com/repos/Tamagochigit/Secretworld/contents/apps/begemot/data/us.json" in admin and "Contents: Read and write" in admin and "localStorage" not in admin and "sessionStorage" not in admin,
    "No old GPT content API in reader or admin": "neurozona.chatgpt.site/api/posts" not in us_page + admin,
    "iPhone app has no legacy backend calls": "/api/" not in iphone and "neurozona.chatgpt.site" not in iphone,
}
failed = [name for name, ok in checks.items() if not ok]
print(f"site_contract_test: {len(checks) - len(failed)}/{len(checks)} PASS")
if failed:
    raise SystemExit("FAIL: " + ", ".join(failed))

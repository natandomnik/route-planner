"""Build a runtime-only Chrome extension ZIP without credentials or development artifacts."""
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'manifest.json').read_text())['version']
output = root / 'dist'
output.mkdir(exist_ok=True)
archive = output / f'route-planner-{version}.zip'
# Explicit allow-list: no browser state, exports, dependencies or local workspace files.
files = [root / name for name in ('manifest.json', 'popup.html', 'options.html', 'postal-lab.html', 'history.html', 'README.md', 'CHANGELOG.md')]
for folder in ('src', 'assets'):
    files.extend(p for p in (root / folder).rglob('*') if p.is_file() and p.suffix in ('.js', '.css', '.json', '.md', '.png', '.svg', '.woff2') or p.is_file() and p.name == 'LICENSE')
with ZipFile(archive, 'w', ZIP_DEFLATED) as bundle:
    for file in sorted(set(files)):
        if file.is_symlink():
            raise ValueError(f'Symlinks are not allowed: {file.relative_to(root)}')
        bundle.write(file, file.relative_to(root).as_posix())
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    manifest = json.loads(bundle.read('manifest.json'))
    assert manifest['version'] == version
    entries = [manifest['background']['service_worker']]
    entries += [file for script in manifest.get('content_scripts', []) for file in script.get('js', [])]
    for name in entries:
        assert name in bundle.namelist(), name
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / f'route-planner-{version}.sha256').write_text(f'{checksum}  {archive.name}\n')
print(f'Built {archive.name}: {len(files)} runtime/documentation files; SHA-256 {checksum}')

"""Optional maintenance helper; the shipped browser app needs no build or Python."""
from pathlib import Path
import re, json, base64
root=Path(__file__).resolve().parent.parent
sources=[]
for name in ['history','canvas','brush','storage','lineart','music','app']:
    code=(root/'js'/f'{name}.js').read_text()
    code=re.sub(r"import\s*\{[^}]*\}\s*from\s*['\"][^'\"]+['\"];?",'',code)
    code=re.sub(r'\bexport\s+(?=(?:const|class|function|async)\b)','',code)
    sources.append(code)
assets={f.stem:'data:image/svg+xml;base64,'+base64.b64encode(f.read_bytes()).decode() for f in (root/'assets/lineart').glob('*.svg')}
code='\n'.join(sources).replace('url:`assets/lineart/${id}.svg`','url:EMBEDDED_LINEART[id]')
(root/'js'/'standalone.js').write_text('// Generated from independent modules. Run scripts/build-standalone.py after edits.\n(()=>{\nconst EMBEDDED_LINEART='+json.dumps(assets)+';\n'+code+'\n})();\n')
print('Standalone entry generated with',len(assets),'embedded SVGs')

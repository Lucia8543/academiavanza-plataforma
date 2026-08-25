# -*- coding: utf-8 -*-
import re, unicodedata
def _n(s):
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii','ignore').decode().lower()
    return re.sub(r'\s+',' ', re.sub(r'[^a-z0-9 ]',' ', s)).strip()

def nivel(s):
    t = _n(s)
    if not t: return None
    m = re.search(r'(\d)\s*(?:o|º|ª)?\s*(prim|eso|bach)', t)
    if m:
        num, etapa = m.group(1), m.group(2)
        etapa = {'prim':'Primaria','eso':'ESO','bach':'Bachillerato'}[etapa]
        return f'{num}º {etapa}'
    if 'prim' in t: return 'Primaria (sin curso)'
    if 'bach' in t: return 'Bachillerato (sin curso)'
    if 'eso' in t:  return 'ESO (sin curso)'
    return None

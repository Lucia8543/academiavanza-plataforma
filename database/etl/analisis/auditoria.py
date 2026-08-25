# -*- coding: utf-8 -*-
import pandas as pd, re, collections
import fuentes as F

fp   = F.form('formulario-padres.xlsx')
fpr  = F.form('formulario-profesores.xlsx')
hp   = F.hoja_padres()
hpr  = F.hoja_profesores()

def vacios(df, cols=None):
    d = df[cols] if cols else df
    n = len(d)
    out = []
    for c in d.columns:
        s = d[c].astype(str).str.strip().replace({'None':'','nan':''})
        v = int((s == '').sum())
        out.append((c, v, 100*v/n))
    return pd.DataFrame(out, columns=['columna','vacios','%']).sort_values('vacios', ascending=False)

print('#'*78); print('A · VOLUMETRÍA')
for n, d in [('Formulario de padres (Google)', fp), ('Formulario de profesores (Google)', fpr),
             ('Excel · hoja PADRES', hp), ('Excel · hoja PROFESORES', hpr)]:
    print(f'   {n:36s} {len(d):4d} registros × {len(d.columns)} columnas')

print(); print('#'*78); print('B · CAMPOS VACÍOS')
for n, d in [('Formulario de padres', fp[[c for c in fp.columns if not c.startswith("col")]]),
             ('Formulario de profesores', fpr[[c for c in fpr.columns if not c.startswith("col")]]),
             ('Excel · hoja PADRES', hp), ('Excel · hoja PROFESORES', hpr)]:
    print(f'\n--- {n} ({len(d)} registros) ---')
    t = vacios(d)
    print(t[t.vacios > 0].to_string(index=False, float_format=lambda x: f'{x:.0f}'))

print(); print('#'*78); print('C · DUPLICADOS')
def dups(df, col, etiqueta, normaliza=lambda s: str(s).strip().lower()):
    s = df[col].dropna().astype(str).map(normaliza)
    s = s[s.ne('') & s.ne('nan')]
    c = collections.Counter(s)
    rep = {k: v for k, v in c.items() if v > 1}
    print(f'   {etiqueta:44s} {len(s):3d} valores, {len(c):3d} distintos, {len(rep):2d} repetidos')
    for k, v in sorted(rep.items(), key=lambda x: -x[1])[:6]:
        print(f'        ×{v}  {k[:60]}')

def tel(s):
    s = re.sub(r'\D', '', str(s))
    return s[-9:] if len(s) >= 9 else ''

dups(fpr, 'Tu email', 'Formulario profesores · email')
dups(fpr, 'Tu número de teléfono', 'Formulario profesores · teléfono', tel)
dups(fpr, 'Tu nombre y apellidos', 'Formulario profesores · nombre', F.norm)
dups(fp, 'Tu email', 'Formulario padres · email')
dups(fp, 'Tu número de teléfono', 'Formulario padres · teléfono', tel)
dups(fp, 'Nombre y apellidos del alumno/a', 'Formulario padres · alumno', F.norm)
dups(hpr, 'email', 'Excel PROFESORES · email')
dups(hpr, 'nombre', 'Excel PROFESORES · nombre', F.norm)
dups(hp, 'email', 'Excel PADRES · email')
dups(hp, 'alumno', 'Excel PADRES · alumno', F.norm)

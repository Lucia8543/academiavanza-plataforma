# -*- coding: utf-8 -*-
"""Valores distintos de las columnas de texto libre + cobertura de claves."""
import pandas as pd, re, collections
import fuentes as F

fp  = F.form('formulario-padres.xlsx');  fpr = F.form('formulario-profesores.xlsx')
hp  = F.hoja_padres();                   hpr = F.hoja_profesores()

def tel(s):
    s = str(s).strip()
    s = re.sub(r'\.0$', '', s)
    s = re.sub(r'\D', '', s)
    return s[-9:] if len(s) >= 9 else ''

def limpio(serie):
    s = serie.dropna().astype(str).str.strip()
    return s[s.ne('') & s.ne('None') & s.ne('nan')]

print('#'*78); print('D · COBERTURA DE LAS CLAVES DE RECONCILIACIÓN')
def cobertura(nombre, df, col_mail, col_tel):
    n = len(df)
    mail = limpio(df[col_mail]).str.lower()
    t = limpio(df[col_tel]).map(tel); t = t[t.ne('')]
    con_mail = df[col_mail].notna() & df[col_mail].astype(str).str.strip().ne('')
    con_tel  = df[col_tel].map(lambda x: tel(x) != '')
    print(f'   {nombre:34s} n={n:3d} | email {con_mail.sum():3d} ({100*con_mail.mean():3.0f}%) | '
          f'tel {con_tel.sum():3d} ({100*con_tel.mean():3.0f}%) | sin ninguna de las dos: {int((~con_mail & ~con_tel).sum())}')
cobertura('Formulario profesores', fpr, 'Tu email', 'Tu número de teléfono')
cobertura('Formulario padres', fp, 'Tu email', 'Tu número de teléfono')
cobertura('Excel · hoja PROFESORES', hpr, 'email', 'telefono')
cobertura('Excel · hoja PADRES', hp, 'email', 'telefono')

# unión formulario + excel por teléfono, para profesores
tf = set(limpio(fpr['Tu número de teléfono']).map(tel)) - {''}
te = set(limpio(hpr['telefono']).map(tel)) - {''}
mf = set(limpio(fpr['Tu email']).str.lower()); me = set(limpio(hpr['email']).str.lower())
print(f'\n   Profesores · teléfonos distintos: formulario {len(tf)}, Excel {len(te)}, comunes {len(tf&te)}, unión {len(tf|te)}')
print(f'   Profesores · emails distintos   : formulario {len(mf)}, Excel {len(me)}, comunes {len(mf&me)}, unión {len(mf|me)}')
tfp = set(limpio(fp['Tu número de teléfono']).map(tel)) - {''}
tep = set(limpio(hp['telefono']).map(tel)) - {''}
print(f'   Familias   · teléfonos distintos: formulario {len(tfp)}, Excel {len(tep)}, comunes {len(tfp&tep)}, unión {len(tfp|tep)}')

def catalogo(titulo, series, separadores=None):
    print(); print('#'*78); print(titulo)
    c = collections.Counter()
    for s in series:
        for v in limpio(s):
            partes = [v]
            if separadores:
                partes = re.split(separadores, v)
            for p in partes:
                p = p.strip(' .,;-\n\t')
                if p:
                    c[p] += 1
    print(f'   {len(c)} valores distintos')
    for k, v in c.most_common():
        print(f'      {v:3d}  {k[:96]}')
    return c

col_prof = catalogo('E1 · COLEGIO DE PROCEDENCIA (profesores)',
    [fpr['¿Has estudiado en el Montpellier? (Si no, escribe en cuál)'], hpr['colegio']])
col_fam = catalogo('E2 · COLEGIO DEL ALUMNO (familias)',
    [fp['Colegio del alumno'], hp['colegio']])
asig = catalogo('E3 · ASIGNATURAS',
    [fpr['Asignaturas que quieres impartir'], hpr['asignaturas'],
     fp['Asignaturas requeridas'], hp['materias']], r'[\n,;/]| y ')
cur = catalogo('E4 · CURSOS Y NIVELES',
    [fpr['Cursos a los que quieres dar clase'], hpr['cursos'],
     fp['Curso del alumno'], hp['curso']], r'[\n,;/]| y ')
cert = catalogo('E5 · CERTIFICADOS DE IDIOMAS',
    [fpr['Certificado de idiomas (si lo tienes, escribe qué nivel)'], hpr['certificado_idiomas']])

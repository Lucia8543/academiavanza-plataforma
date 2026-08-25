# -*- coding: utf-8 -*-
import os
AQUI = os.path.dirname(os.path.abspath(__file__))
DATOS = os.path.join(AQUI, '..', 'datos') + os.sep
SALIDA = os.path.join(AQUI, 'salida') + os.sep
os.makedirs(SALIDA, exist_ok=True)
import pandas as pd, difflib, re
import fuentes as F
from fechas import semana_a_fechas

PLACEHOLDERS = {'sustituto','sustituta','anterior','antiguo','antigua','profesor','profe','-'}
# nombres que son claramente la misma persona escrita de dos formas
FUSIONES = {'carmen pelaez':'carmen pelaez martin', 'sofia martin':'sofia martin alanon'}

df = pd.read_csv(SALIDA+'clases_consolidadas.csv')
df['horas'] = df.duracion_min/60
fx = df.semana.map(semana_a_fechas)
df['ini'] = pd.to_datetime([f[0] for f in fx]); df['fin'] = pd.to_datetime([f[1] for f in fx])
df['pn'] = df.profesor.map(F.norm).replace(FUSIONES)
df['es_placeholder'] = df.pn.isin(PLACEHOLDERS)

print('#'*78); print('F · NOMBRES NO IDENTIFICABLES EN EL REGISTRO DE CLASES')
ph = df[df.es_placeholder]
print(f'   {len(ph)} clases ({100*len(ph)/len(df):.1f} %) sin profesor identificable')
print('  ', ph.pn.value_counts().to_dict())

real = df[~df.es_placeholder].copy()
g = real.groupby('pn').agg(clases=('horas','size'), horas=('horas','sum'),
                           alumnos=('alumno','nunique'),
                           primera=('ini','min'), ultima=('fin','max'))
g = g.sort_values('clases', ascending=False)
print()
print('#'*78); print('G · CONTADOR POR PROFESOR (solo profesores identificables)')
print(f'   Profesores con al menos una clase: {len(g)}')
print(f'   Clases atribuibles ..............: {int(g.clases.sum())} de {len(df)}')
print(f'   Media ...........: {g.clases.mean():.1f} clases   Mediana: {g.clases.median():.0f}')
print(f'   Percentil 25 / 75: {g.clases.quantile(.25):.0f} / {g.clases.quantile(.75):.0f}')
for u in [100,50,30,20,10,5]:
    print(f'   Con >= {u:3d} clases: {int((g.clases>=u).sum()):3d}  ({100*(g.clases>=u).mean():4.1f} %)')
print(f'   Top 5 concentran {100*g.clases.head(5).sum()/g.clases.sum():.1f} % · '
      f'Top 10 {100*g.clases.head(10).sum()/g.clases.sum():.1f} %')

print()
print('#'*78); print('H · RECONCILIACIÓN CON EL CENSO DE PROFESORES')
hpr = F.hoja_profesores(); fpr = F.form('formulario-profesores.xlsx')
censo = pd.concat([hpr.nombre, fpr['Tu nombre y apellidos']]).dropna().astype(str)
censo_n = sorted({F.norm(x) for x in censo if F.norm(x)})
print(f'   Censo de profesores (Excel + formulario): {len(censo_n)} nombres distintos')

exactos, aprox, sin = [], [], []
for n in g.index:
    if n in censo_n:
        exactos.append(n)
    else:
        m = difflib.get_close_matches(n, censo_n, n=1, cutoff=0.86)
        (aprox if m else sin).append((n, m[0] if m else None))
print(f'   Coinciden exactamente ....... {len(exactos):3d} de {len(g)}')
print(f'   Coinciden por aproximación .. {len(aprox):3d}')
for n, m in aprox: print(f'        «{n}»  ≈  «{m}»')
print(f'   Sin correspondencia ......... {len(sin):3d}   (clases afectadas: '
      f'{int(g.loc[[n for n,_ in sin]].clases.sum()) if sin else 0})')
for n, _ in sin: print(f'        «{n}»  ({int(g.loc[n].clases)} clases)')

g.to_csv(SALIDA+'contador_por_profesor.csv')
print()
print('#'*78); print('I · DISTRIBUCIÓN COMPLETA DEL CONTADOR')
for n, r in g.iterrows():
    print(f'   {int(r.clases):4d} clases  {r.horas:7.1f} h  {int(r.alumnos):2d} alumnos  {n}')

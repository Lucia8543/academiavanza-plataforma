# -*- coding: utf-8 -*-
import os
AQUI = os.path.dirname(os.path.abspath(__file__))
DATOS = os.path.join(AQUI, '..', 'datos') + os.sep
SALIDA = os.path.join(AQUI, 'salida') + os.sep
os.makedirs(SALIDA, exist_ok=True)
import pandas as pd, numpy as np, datetime as dt
from fechas import semana_a_fechas
pd.set_option('display.width', 200)

df = pd.read_csv(SALIDA+'clases_consolidadas.csv')
fx = df.semana.map(semana_a_fechas)
df['ini'] = pd.to_datetime([f[0] for f in fx])
df['fin'] = pd.to_datetime([f[1] for f in fx])
df['horas'] = df.duracion_min/60.0
df['mes'] = df.ini.dt.to_period('M')

# limpieza de nombres para agrupar
for c in ['profesor','alumno','padre','curso','colegio']:
    df[c+'_n'] = (df[c].astype(str).str.strip().str.lower()
                    .str.replace(r'\s+',' ',regex=True))

print('='*72); print('1 · VOLUMEN Y PERIODO')
print(f'Clases registradas .......... {len(df)}')
print(f'Horas impartidas ............ {df.horas.sum():.1f}')
print(f'Duración media por clase .... {df.duracion_min.mean():.0f} min (mediana {df.duracion_min.median():.0f})')
print(f'Periodo ..................... {df.ini.min().date()} → {df.fin.max().date()}')
print(f'Semanas distintas ........... {df.ini.nunique()}')
print(f'Profesores distintos ........ {df.profesor_n.nunique()}')
print(f'Alumnos distintos ........... {df.alumno_n.nunique()}')
print(f'Familias distintas .......... {df.padre_n.nunique()}')
print(f'Parejas familia–profesor .... {df.groupby(["padre_n","profesor_n"]).ngroups}')

print(); print('='*72); print('2 · DISTRIBUCIÓN POR PROFESOR')
g = df.groupby('profesor_n').agg(clases=('horas','size'), horas=('horas','sum'),
                                 alumnos=('alumno_n','nunique'),
                                 primera=('ini','min'), ultima=('fin','max')).sort_values('clases', ascending=False)
g['%']   = 100*g.clases/g.clases.sum()
g['acum%'] = g['%'].cumsum()
print(g.head(20).to_string(float_format=lambda x: f'{x:.1f}'))
print(f'\nTotal profesores: {len(g)}')
print(f'Media de clases por profesor: {g.clases.mean():.1f}   Mediana: {g.clases.median():.0f}')
for n in [3,5,10]:
    print(f'  Top {n:2d} profesores concentran {g["%"].head(n).sum():.1f} % de las clases')
print(f'  Profesores con >=50 clases: {(g.clases>=50).sum()}')
print(f'  Profesores con >=20 clases: {(g.clases>=20).sum()}')
print(f'  Profesores con <10 clases : {(g.clases<10).sum()}')
print(f'  Profesores con <5 clases  : {(g.clases<5).sum()}')

print(); print('='*72); print('3 · DISTRIBUCIÓN POR CURSO (nivel)')
c = df.groupby('curso_n').agg(clases=('horas','size'), alumnos=('alumno_n','nunique')).sort_values('clases', ascending=False)
print(c.to_string())

print(); print('='*72); print('4 · ESTACIONALIDAD POR MES')
m = df.groupby('mes').agg(clases=('horas','size'), horas=('horas','sum'),
                          alumnos=('alumno_n','nunique'), profes=('profesor_n','nunique'))
m['%'] = 100*m.clases/m.clases.sum()
print(m.to_string(float_format=lambda x: f'{x:.1f}'))

print(); print('='*72); print('5 · RELACIÓN FAMILIA–PROFESOR')
r = df.groupby(['padre_n','profesor_n']).agg(clases=('horas','size'), primera=('ini','min'),
                                             ultima=('fin','max'), semanas_act=('ini','nunique'))
r['duracion_sem'] = (r.ultima - r.primera).dt.days/7.0
print(f'Parejas familia–profesor ............ {len(r)}')
print(f'Duración media de la relación ....... {r.duracion_sem.mean():.1f} semanas ({r.duracion_sem.mean()/4.345:.1f} meses)')
print(f'Duración mediana .................... {r.duracion_sem.median():.1f} semanas')
print(f'Clases medias por pareja ............ {r.clases.mean():.1f} (mediana {r.clases.median():.0f})')
print(f'Parejas de una sola clase ........... {(r.clases==1).sum()} ({100*(r.clases==1).mean():.0f} %)')
print(f'Parejas que duran >12 semanas ....... {(r.duracion_sem>12).sum()} ({100*(r.duracion_sem>12).mean():.0f} %)')
print(f'Semanas activas medias por pareja ... {r.semanas_act.mean():.1f}')

f = df.groupby('padre_n').agg(clases=('horas','size'), profes=('profesor_n','nunique'),
                              alumnos=('alumno_n','nunique'), primera=('ini','min'), ultima=('fin','max'))
f['duracion_sem'] = (f.ultima-f.primera).dt.days/7.0
print(f'\nPor familia: clases medias {f.clases.mean():.1f} (mediana {f.clases.median():.0f}), '
      f'permanencia media {f.duracion_sem.mean():.1f} semanas, profesores distintos medios {f.profes.mean():.2f}')
print(f'Familias que cambiaron de profesor: {(f.profes>1).sum()} de {len(f)} ({100*(f.profes>1).mean():.0f} %)')

g.to_csv(SALIDA+'resumen_profesores.csv'); m.to_csv(SALIDA+'resumen_meses.csv'); r.to_csv(SALIDA+'resumen_parejas.csv')

# -*- coding: utf-8 -*-
"""Consolida los 5 snapshots del histórico en un único conjunto sin duplicados."""
import pandas as pd, collections, re
from extraer import clases

import os
AQUI = os.path.dirname(os.path.abspath(__file__))
DATOS = os.path.join(AQUI, '..', 'datos') + os.sep
SALIDA = os.path.join(AQUI, 'salida') + os.sep
os.makedirs(SALIDA, exist_ok=True)
BASE = DATOS
ORDEN = ['historial-clases-2026-03-08.xlsx','historial-clases-2026-04-23.xlsx',
         'historial-clases-2026-05-07.xlsx','historial-clases-2026-05-23.xlsx',
         'historial-clases-2026-08-08.xlsx']

MESES = {'septiembre':9,'sept':9,'octubre':10,'oct':10,'noviembre':11,'nov':11,
         'diciembre':12,'dic':12,'enero':1,'ene':1,'febrero':2,'feb':2,'marzo':3,'mar':3,
         'abril':4,'abr':4,'mayo':5,'junio':6,'jun':6,'julio':7,'jul':7,'agosto':8,'ago':8}

def mes_de_semana(s):
    s = str(s).lower().strip()
    tok = re.split(r'[\s]+', s)[-1]
    return MESES.get(tok)

# orden del curso académico: septiembre -> julio
ORDEN_MES = [9,10,11,12,1,2,3,4,5,6,7,8]

def dia_inicio(s):
    m = re.match(r'\s*(\d+)', str(s))
    return int(m.group(1)) if m else 99

def consolidar():
    dfs = {f: clases(BASE+f) for f in ORDEN}
    vistos = collections.Counter()
    filas = []
    for f in reversed(ORDEN):            # del más reciente al más antiguo
        df = dfs[f]
        cont = collections.Counter()
        for _, r in df.iterrows():
            k = (r.profesor, r.alumno, r.semana, r.duracion_min)
            cont[k] += 1
            if cont[k] > vistos[k]:
                d = r.to_dict(); d['origen'] = f
                filas.append(d)
        vistos |= cont
    out = pd.DataFrame(filas)
    out['mes'] = out.semana.map(mes_de_semana)
    out['dia_ini'] = out.semana.map(dia_inicio)
    out['orden_mes'] = out.mes.map(lambda m: ORDEN_MES.index(m) if m in ORDEN_MES else 99)
    out['orden'] = out.orden_mes*100 + out.dia_ini
    out['horas'] = out.duracion_min/60.0
    return out.sort_values('orden').reset_index(drop=True)

if __name__ == '__main__':
    df = consolidar()
    df.to_csv(SALIDA+'clases_consolidadas.csv', index=False)
    print('registros consolidados:', len(df))
    print('\nsemanas (orden académico):')
    for (o, s), g in df.groupby(['orden','semana']):
        print(f'  {s:22s} {len(g):4d} clases  {g.horas.sum():7.1f} h')
    print('\nsin mes reconocido:', df[df.mes.isna()].semana.unique()[:20])

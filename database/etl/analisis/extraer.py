# -*- coding: utf-8 -*-
"""Extrae los bloques útiles de los Excel históricos de AcademiAvanza."""
import openpyxl, glob, os, json, unicodedata
import pandas as pd

import os
AQUI = os.path.dirname(os.path.abspath(__file__))
DATOS = os.path.join(AQUI, '..', 'datos') + os.sep
SALIDA = os.path.join(AQUI, 'salida') + os.sep
os.makedirs(SALIDA, exist_ok=True)
BASE = DATOS

COLS_CLASES = ['colegio','profesor','alumno','curso','padre','semana','duracion_min',
               'c8','c9','c10','pagado','pprofe','tprofe','ppadre','tpadre',
               'bonos_restantes','obs','comision','bono','c20','c21','c22']

def leer(fichero, hoja):
    wb = openpyxl.load_workbook(fichero, read_only=True, data_only=True)
    ws = wb[hoja]; ws.reset_dimensions()
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    wb.close()
    return rows

def clases(fichero):
    rows = leer(fichero, 'CLASES')
    out = []
    for i, r in enumerate(rows):
        if i == 0:
            continue
        r = (r + [None]*30)[:23]
        prof, alum, dur, sem = r[1], r[2], r[6], r[5]
        if prof and alum and dur is not None and sem:
            try:
                d = float(str(dur).replace(',', '.'))
            except ValueError:
                continue
            if d <= 0:
                continue
            out.append(dict(zip(COLS_CLASES, r[:22]), fila=i))
    df = pd.DataFrame(out)
    for c in ['duracion_min','pprofe','tprofe','ppadre','tpadre','comision']:
        if c in df:
            df[c] = pd.to_numeric(df[c].astype(str).str.replace(',', '.'), errors='coerce')
    for c in ['colegio','profesor','alumno','curso','padre','semana']:
        df[c] = df[c].astype(str).str.strip()
    return df

def normalizar(s):
    if s is None: return ''
    s = str(s).strip()
    return ' '.join(s.split())

if __name__ == '__main__':
    ficheros = sorted(glob.glob(os.path.join(BASE, 'historial-clases-*.xlsx')))
    for f in ficheros:
        df = clases(f)
        print(f'{os.path.basename(f):32s} -> {len(df):5d} registros de clase, '
              f'{df.profesor.nunique():3d} profes, {df.padre.nunique():3d} familias, '
              f'{df.duracion_min.sum()/60:8.1f} h')
        df.to_csv(SALIDA + f'clases_{os.path.basename(f)[:-5]}.csv', index=False)

# -*- coding: utf-8 -*-
"""Carga las cuatro fuentes de datos personales en DataFrames limpios."""
import os, openpyxl, pandas as pd, re, unicodedata

import os
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'datos') + os.sep

def _rows(fichero, hoja=None):
    wb = openpyxl.load_workbook(BASE+fichero, read_only=True, data_only=True)
    ws = wb[hoja] if hoja else wb.worksheets[0]
    ws.reset_dimensions()
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    wb.close()
    return rows

def _vacio(c):
    return c is None or str(c).strip() == ''

def form(fichero):
    rows = _rows(fichero)
    cab = [str(c).strip() if c is not None else f'col{j}' for j, c in enumerate(rows[0])]
    datos = [r for r in rows[1:] if not all(_vacio(c) for c in r)]
    n = len(cab)
    return pd.DataFrame([(r + [None]*n)[:n] for r in datos], columns=cab)

COLS_PROF = ['estado','colegio','nombre','telefono','telefono_bizum','email','estudios',
             'asignaturas','cursos','modalidad','zona','horas_semana','disponibilidad',
             'notas_evau','comentarios','certificado_idiomas','habilidades','referido']
COLS_PADR = ['nota','profesor','colegio','alumno','padre','email','telefono','curso',
             'materias','modalidad','direccion','horas_semana','disponibilidad','otros',
             'cuando','x15']

def hoja_profesores(fichero='historial-clases-2026-08-08.xlsx'):
    rows = _rows(fichero, 'PROFESORES')
    datos = [r for r in rows[1:] if not _vacio(r[2] if len(r) > 2 else None)]
    n = len(COLS_PROF)
    return pd.DataFrame([(r + [None]*n)[:n] for r in datos], columns=COLS_PROF)

def hoja_padres(fichero='historial-clases-2026-08-08.xlsx'):
    rows = _rows(fichero, 'PADRES')
    datos = [r for r in rows[2:] if not _vacio(r[3] if len(r) > 3 else None)]
    n = len(COLS_PADR)
    return pd.DataFrame([(r + [None]*n)[:n] for r in datos], columns=COLS_PADR)

def sin_acentos(s):
    s = unicodedata.normalize('NFKD', str(s))
    return ''.join(c for c in s if not unicodedata.combining(c))

def norm(s):
    if s is None: return ''
    s = sin_acentos(str(s)).lower().strip()
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def slug(s):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', norm(s))).strip('-')

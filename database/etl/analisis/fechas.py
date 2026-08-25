# -*- coding: utf-8 -*-
"""Convierte las etiquetas de semana del Excel en fechas reales del curso 2025/26."""
import re, datetime as dt

MESES = {'septiembre':9,'sept':9,'octubre':10,'oct':10,'noviembre':11,'nov':11,
         'diciembre':12,'dic':12,'enero':1,'ene':1,'febrero':2,'feb':2,
         'marzo':3,'fmarzo':3,'mar':3,'abril':4,'abr':4,'mayo':5,
         'junio':6,'jun':6,'julio':7,'jul':7,'agosto':8,'ago':8}

def anio(mes):
    return 2025 if mes >= 9 else 2026

def semana_a_fechas(etiqueta):
    """Devuelve (lunes, domingo) de la semana, o (None, None) si no se puede."""
    s = str(etiqueta).strip().lower()
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    if m:                                    # celda con fecha real
        f = dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        return f - dt.timedelta(days=f.weekday()), f + dt.timedelta(days=6-f.weekday())
    m = re.match(r'^(\d{1,2})\s*(?:de\s+)?([a-záéíóú]+)?\s*-\s*(\d{1,2})\s*(?:de\s+)?([a-záéíóú]+)\s*$', s)
    if not m:
        return None, None
    d1, mes1, d2, mes2 = m.group(1), m.group(2), m.group(3), m.group(4)
    mes_fin = MESES.get(mes2)
    if mes_fin is None:
        return None, None
    fin = dt.date(anio(mes_fin), mes_fin, int(d2))
    mes_ini = MESES.get(mes1) if mes1 else None
    if mes_ini:
        ini = dt.date(anio(mes_ini), mes_ini, int(d1))
    else:
        ini = fin - dt.timedelta(days=6)
        if ini.day != int(d1):               # etiqueta imprecisa: manda el día declarado
            cand = fin.replace(day=1) - dt.timedelta(days=1)
            try:
                ini = dt.date(cand.year, cand.month, int(d1))
            except ValueError:
                ini = fin - dt.timedelta(days=6)
    if ini > fin or (fin - ini).days > 10:
        ini = fin - dt.timedelta(days=6)
    return ini, fin

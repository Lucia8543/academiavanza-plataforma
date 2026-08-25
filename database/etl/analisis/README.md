# Guiones de análisis del histórico

Estos guiones son los que producen las cifras del apartado 4 y de los apartados
2.4 y 2.5 de
[`docs/05-migracion/informe-migracion.md`](../../../docs/05-migracion/informe-migracion.md).

No forman parte del proceso de carga (eso es la etapa de volcado y transformación,
descrita en el [README de `etl/`](../README.md)). Son de sólo lectura: abren los
Excel de `database/etl/datos/`, calculan y escriben en `salida/`. No modifican
nada.

---

## Antes de ejecutar

Los ficheros de origen tienen que estar en `database/etl/datos/`:

```
formulario-padres.xlsx
formulario-profesores.xlsx
historial-clases-2026-03-08.xlsx
historial-clases-2026-04-23.xlsx
historial-clases-2026-05-07.xlsx
historial-clases-2026-05-23.xlsx
historial-clases-2026-08-08.xlsx
```

Dependencias: `pip install openpyxl pandas`.

---

## Qué hace cada uno

| Guion | Para qué sirve |
|---|---|
| `fuentes.py` | Carga las cuatro fuentes en DataFrames. Lo usan los demás |
| `fechas.py` | Traduce las etiquetas de semana («26-1 febrero») a fechas reales |
| `niveles.py` | Normaliza el curso («4eso», «4º ESO») a un nivel del catálogo |
| `extraer.py` | Saca el bloque de clases de cada copia del Excel |
| `consolidar.py` | **Une las cinco copias sin duplicados.** Punto de partida del resto |
| `analisis_clases.py` | Volumen, periodo, niveles, estacionalidad y duración de las relaciones |
| `reconciliacion.py` | Contador por profesor y cruce con el censo |
| `auditoria.py` | Volumetría, campos vacíos y duplicados de las cuatro fuentes |
| `catalogos.py` | Valores distintos de colegios, asignaturas, cursos y certificados |
| `gen_colegios.py` | Genera las filas de `database/seeds/01_colegios.sql` |

## Orden de ejecución

```bash
cd database/etl/analisis
python3 consolidar.py        # obligatorio primero: genera salida/clases_consolidadas.csv
python3 analisis_clases.py
python3 reconciliacion.py
python3 auditoria.py         # independiente de consolidar.py
python3 catalogos.py         # independiente de consolidar.py
```

---

## Por qué se unen las cinco copias

Porque la más reciente no lo contiene todo. Al comparar las cinco aparecen 278
clases que están en copias antiguas y no en la del 8 de agosto: casi todo octubre
y noviembre, y la actividad de dos profesoras que se dieron de baja.

`consolidar.py` recorre las copias de la más reciente a la más antigua y va
añadiendo lo que no ha visto antes, usando como clave la combinación de profesor,
alumno, semana y duración. Es un multiconjunto, no un conjunto: si una pareja dio
dos clases de la misma duración en la misma semana, cuentan las dos.

---

## Aviso

`salida/` contiene datos personales de menores: nombres de alumnos, familias y
profesores. Está excluida del repositorio igual que `datos/`. Si alguna vez ves un
CSV de esta carpeta en un `git status`, algo va mal.

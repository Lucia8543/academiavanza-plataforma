# PRD 03 — Portal de la familia

**Prioridad:** Imprescindible (v1)

---

## 1. Propósito

Cubre el registro de la familia, la gestión de sus hijos y el panel desde el que
sigue sus propuestas y accede a los contactos desbloqueados.

El principio rector: **la familia debe poder llegar hasta el directorio con la
mínima fricción posible.** Cada campo obligatorio antes de dejarle buscar es una
familia que se va.

---

## 2. Registro

### 2.1 Cuándo se pide

**No al entrar.** El directorio es público y se puede navegar y filtrar sin cuenta.

La cuenta se pide en el momento de **enviar la primera propuesta**, que es cuando
la familia ya ha visto valor y está dispuesta a dar sus datos.

### 2.2 Campos

**Del adulto**

| Campo | Obligatorio |
|---|---|
| Nombre y apellidos | Sí |
| Email | Sí |
| Teléfono | Sí |
| Contraseña o acceso por enlace | Sí |

**Del alumno** — aquí se aplica minimización deliberada, por tratarse de menores.

| Campo | Obligatorio | Notas |
|---|---|---|
| Nombre de pila | Sí | **Nunca el apellido completo** |
| Inicial del primer apellido | No | Solo para distinguir hermanos |
| Curso | Sí | Del catálogo |
| Colegio | No | Del catálogo. Útil para sugerir profesores del mismo centro. |
| Notas para el profesor | No | Contexto: «le cuesta concentrarse», «va a repetir» |

**Preferencias**

| Campo | Obligatorio | Notas |
|---|---|---|
| Colegio preferido del profesor | No | Preselecciona el filtro del directorio |
| Zona | No | Solo si busca presencial |

**No se pide:** fecha de nacimiento del menor, dirección postal exacta,
disponibilidad horaria detallada. Nada de eso hace falta para el match, y lo que
no se recoge no hay que protegerlo.

### 2.3 Consentimiento

Casilla obligatoria y sin marcar por defecto, con enlace a la política de
privacidad. Se guarda el momento y la versión del texto aceptado.

Casilla separada y opcional para comunicaciones comerciales.

---

## 3. Varios hijos

Una familia puede registrar varios alumnos en la misma cuenta. El Excel antiguo no
lo contemplaba: dos hermanos aparecían como dos filas sin relación entre sí.

Cada propuesta se asocia a un alumno concreto. Al enviarla, si hay más de uno, se
pregunta para cuál.

---

## 4. Panel

### 4.1 Inicio

- Propuestas activas con su estado y, si procede, la cuenta atrás
- Aviso destacado cuando un profesor ha aceptado y falta pagar
- Contactos desbloqueados, con acceso directo a WhatsApp
- Reseñas pendientes de escribir
- Acceso al directorio

### 4.2 Mis propuestas

Listado con estado, fecha, profesor y alumno. Según el estado:

| Estado | Qué ve y qué puede hacer |
|---|---|
| `enviada` | Tiempo restante. Puede cancelar. |
| `aceptada` | Mensaje del profesor, importe, plazo. **Botón de pago.** |
| `pagada` | Teléfono, botón de WhatsApp, indicaciones sobre el pago de clases |
| `rechazada` | Motivo. Sugerencias de perfiles similares. |
| `caducada` | Explicación y sugerencias de perfiles similares |

Cuando una propuesta se rechaza o caduca, no basta con informar: hay que ofrecer
salida inmediata con dos o tres profesores parecidos disponibles.

### 4.3 Mis contactos

Los profesores ya desbloqueados, permanentemente accesibles. Una vez pagado, el
contacto no se pierde ni caduca.

### 4.4 Mis hijos y mis datos

Alta, edición y desactivación de alumnos. Edición de datos propios y preferencias.
Gestión del consentimiento y **eliminación de la cuenta**, que debe ser accesible y
no estar escondida.

---

## 5. Lo que el panel NO tiene

Sin estado de bono, sin historial de clases, sin calendario, sin pagos a
profesores. La plataforma no sabe nada de lo que ocurre después del match, y el
panel no debe fingir lo contrario.

---

## 6. Reglas de negocio

- Máximo tres propuestas vivas simultáneas, configurable
- No se puede enviar propuesta sin al menos un alumno registrado
- No se pueden tener dos propuestas vivas con el mismo profesor y alumno
- Eliminar la cuenta anonimiza el perfil pero conserva los pagos por obligación
  contable, y las reseñas publicadas pasan a figurar como anónimas

---

## 7. Criterios de aceptación

- [ ] Se puede navegar y filtrar el directorio sin cuenta
- [ ] La cuenta se pide al enviar la primera propuesta, no antes
- [ ] No existe campo para el apellido completo del menor
- [ ] Se pueden registrar varios hijos en una misma cuenta
- [ ] Una propuesta aceptada muestra el aviso de pago de forma destacada
- [ ] Rechazo y caducidad ofrecen alternativas concretas
- [ ] El contacto desbloqueado sigue accesible indefinidamente
- [ ] El consentimiento se guarda con momento y versión
- [ ] La eliminación de cuenta es accesible desde el propio panel

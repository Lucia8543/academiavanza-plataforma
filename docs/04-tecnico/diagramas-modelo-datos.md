# Diagramas del modelo de datos

Diagramas en [Mermaid](https://mermaid.js.org/), que GitHub renderiza de forma
nativa. Complementan la especificación en [modelo-datos.md](modelo-datos.md).

---

## 1. Mapa general por dominios

Vista de conjunto, sin campos, para entender cómo se relacionan los cuatro
esquemas.

```mermaid
flowchart TB
    USERS[("auth.users<br/><i>Supabase Auth</i>")]

    subgraph IDENT[" Identidad "]
        direction LR
        PERFILES["perfiles"]
        PROFESORES["profesores"]
        FAMILIAS["familias"]
        ALUMNOS["alumnos"]
    end

    subgraph CAT[" catalogo · datos maestros "]
        direction LR
        COLEGIOS["colegios"]
        ASIGNATURAS["asignaturas"]
        NIVELES["niveles"]
        ZONAS["zonas"]
    end

    PROPUESTAS["<b>propuestas</b><br/>núcleo del producto"]

    subgraph DERIV[" Derivadas de la propuesta "]
        direction LR
        PAGOS["pagos"]
        RESENAS["resenas"]
        EVENTOS["propuesta_eventos"]
    end

    TARIFAS["tarifas<br/><i>precio con vigencia</i>"]
    LEGACY[("legacy.*<br/><i>volcado del Excel</i>")]
    AUDIT[("auditoria.cambios")]

    USERS --> PERFILES
    PERFILES --> PROFESORES & FAMILIAS
    FAMILIAS --> ALUMNOS

    CAT --> IDENT

    PROFESORES --> PROPUESTAS
    FAMILIAS --> PROPUESTAS
    ALUMNOS --> PROPUESTAS

    PROPUESTAS --> DERIV
    TARIFAS -.->|precio aplicado| PROPUESTAS

    LEGACY -.->|transformación| IDENT
    PROPUESTAS -.->|disparador| AUDIT
    TARIFAS -.->|disparador| AUDIT

    classDef nucleo fill:#2E7D5E,stroke:#1F2937,color:#fff,stroke-width:3px
    classDef normal fill:#E8F5EF,stroke:#2E7D5E,color:#1F2937
    classDef catalogo fill:#E8F0F8,stroke:#1A4A7A,color:#1F2937
    classDef externo fill:#F3F4F6,stroke:#6B7280,color:#1F2937,stroke-dasharray: 4 3
    classDef audit fill:#FEF3C7,stroke:#D97706,color:#1F2937

    class PROPUESTAS nucleo
    class PERFILES,PROFESORES,FAMILIAS,ALUMNOS,PAGOS,RESENAS,EVENTOS,TARIFAS normal
    class COLEGIOS,ASIGNATURAS,NIVELES,ZONAS catalogo
    class LEGACY,USERS externo
    class AUDIT audit
```

---

## 2. Diagrama entidad-relación completo

```mermaid
erDiagram
    PERFILES ||--o| PROFESORES : "extiende 1:1"
    PERFILES ||--o| FAMILIAS   : "extiende 1:1"
    PERFILES ||--o{ TOKENS_RECLAMACION : "puede reclamar"

    FAMILIAS   ||--o{ ALUMNOS     : "tiene hijos"
    ALUMNOS    ||--o{ NECESIDADES : "genera búsquedas"
    NECESIDADES }o--o{ ASIGNATURAS : "busca"

    PROFESORES }o--|| COLEGIOS : "procede de"
    PROFESORES }o--o| ZONAS    : "imparte en"
    PROFESORES ||--o{ PROFESOR_ASIGNATURAS   : "oferta"
    PROFESORES ||--o{ PROFESOR_CERTIFICACIONES : "acredita"
    PROFESORES ||--o{ PROFESOR_DISPONIBILIDAD  : "declara"

    PROFESOR_ASIGNATURAS }o--|| ASIGNATURAS : "de"
    PROFESOR_ASIGNATURAS }o--|| NIVELES     : "hasta"
    PROFESOR_CERTIFICACIONES }o--|| CERTIFICACIONES_IDIOMA : "titulo"

    ALUMNOS }o--o| COLEGIOS : "estudia en"
    ALUMNOS }o--|| NIVELES  : "cursa"

    FAMILIAS   ||--o{ PROPUESTAS : "envía"
    ALUMNOS    ||--o{ PROPUESTAS : "para"
    PROFESORES ||--o{ PROPUESTAS : "recibe"

    PROPUESTAS ||--o{ PROPUESTA_EVENTOS : "registra transiciones"
    PROPUESTAS ||--o| PAGOS   : "genera al pagar"
    PROPUESTAS ||--o| RESENAS : "habilita"
    PROPUESTAS }o--o| TARIFAS : "aplica precio de"

    PROFESORES ||--o{ RESENAS : "recibe"
    FAMILIAS   ||--o{ RESENAS : "escribe"

    PERFILES {
        uuid id PK "= auth.users.id"
        enum rol "familia|profesor|admin"
        text nombre
        text apellidos
        citext email UK
        text telefono
        enum origen "migracion|autoregistro|admin"
        bool datos_validados
        bool acepta_privacidad
        timestamptz eliminado_en "borrado lógico"
    }

    PROFESORES {
        uuid id PK,FK
        text slug UK "URL pública"
        uuid colegio_id FK
        bool colegio_verificado "condición del badge"
        text titulacion
        text universidad
        smallint curso_actual
        numeric nota_evau "0-14"
        numeric nota_bachillerato "0-10"
        text bio "mín. 100 car. para publicar"
        enum modalidad
        uuid zona_id FK
        enum estado "importado|activo|pausado…"
        numeric valoracion_media "recalculada"
        int total_matches
        int clases_historicas "del Excel"
    }

    FAMILIAS {
        uuid id PK,FK
        uuid zona_id FK
        uuid colegio_preferido_id FK "filtro por defecto"
        text stripe_customer_id UK
    }

    ALUMNOS {
        uuid id PK
        uuid familia_id FK
        text nombre "solo nombre de pila"
        text inicial_apellido "máx. 2 car."
        uuid colegio_id FK
        uuid nivel_id FK
    }

    PROPUESTAS {
        uuid id PK
        text referencia UK "AV-2026-0001"
        uuid familia_id FK
        uuid alumno_id FK
        uuid profesor_id FK
        enum estado "enviada→aceptada→pagada"
        timestamptz responder_antes_de
        timestamptz pagar_antes_de
        uuid tarifa_id FK
        numeric tarifa_aplicada "instantánea"
        timestamptz pagada_en
        timestamptz contacto_revelado_en "solo si pagada"
    }

    TARIFAS {
        uuid id PK
        text concepto
        numeric importe
        timestamptz vigente_desde
        timestamptz vigente_hasta "NULL = vigente"
        text stripe_price_id
        text motivo
    }

    PAGOS {
        uuid id PK
        uuid propuesta_id FK
        uuid familia_id FK
        numeric importe
        enum estado "pendiente|completado|reembolsado"
        text stripe_payment_intent_id UK
        text metodo_pago "card|bizum"
        text numero_factura UK
    }

    RESENAS {
        uuid id PK
        uuid propuesta_id FK,UK "una por match"
        uuid profesor_id FK
        uuid familia_id FK
        smallint puntuacion_global "1-5"
        text texto "mín. 40 car."
        text nombre_publico "nombre + inicial"
        enum estado "pendiente|publicada|oculta"
        text respuesta_profesor
    }

    COLEGIOS {
        uuid id PK
        text slug UK
        text nombre
        text logo_url "para el badge"
        bool destacado
    }

    ASIGNATURAS {
        uuid id PK
        text slug UK
        text nombre UK
        text categoria
    }

    NIVELES {
        uuid id PK
        text slug UK
        text nombre "3º ESO"
        enum etapa
        int orden_visual
    }

    ZONAS {
        uuid id PK
        text nombre "barrio, no dirección"
        text municipio
    }

    CERTIFICACIONES_IDIOMA {
        uuid id PK
        text idioma
        text nombre
        text nivel_mcer "A1-C2"
        text organismo
    }

    PROFESOR_ASIGNATURAS {
        uuid id PK
        uuid profesor_id FK
        uuid asignatura_id FK
        uuid nivel_id FK
        bool especialidad
    }

    PROFESOR_CERTIFICACIONES {
        uuid id PK
        uuid profesor_id FK
        uuid certificacion_id FK
        bool verificada
    }

    PROFESOR_DISPONIBILIDAD {
        uuid id PK
        uuid profesor_id FK
        smallint dia_semana "1-7 ISO"
        time hora_inicio
        time hora_fin
    }

    NECESIDADES {
        uuid id PK
        uuid alumno_id FK
        enum modalidad
        smallint horas_semana
        date fecha_inicio_deseada
    }

    PROPUESTA_EVENTOS {
        bigint id PK
        uuid propuesta_id FK
        enum estado_anterior
        enum estado_nuevo
        text actor_tipo
        timestamptz ocurrido_en
    }

    TOKENS_RECLAMACION {
        uuid id PK
        text token_hash UK "SHA-256"
        uuid perfil_id FK
        timestamptz expira_en
        timestamptz usado_en
    }
```

---

## 3. Ciclo de vida de una propuesta

El estado `pagada` es el match. Es el único que permite revelar el teléfono.

```mermaid
stateDiagram-v2
    direction LR

    state "enviada<br/><small>sin coste para la familia</small>" as enviada
    state "aceptada<br/><small>pendiente de pago · 72 h</small>" as aceptada
    state "pagada · MATCH<br/><small>teléfono revelado</small>" as pagada
    state "rechazada<br/><small>con motivo obligatorio</small>" as rechazada
    state "caducada<br/><small>sin respuesta en 48 h</small>" as caducada
    state "cancelada<br/><small>retirada por la familia</small>" as cancelada
    state "caducada_pago<br/><small>venció el plazo</small>" as caducada_pago

    state sin_coste <<choice>>

    [*] --> enviada

    enviada  --> aceptada  : el profesor acepta
    enviada  --> sin_coste : rechaza · no responde · se retira
    aceptada --> pagada    : la familia paga
    aceptada --> sin_coste : no paga a tiempo

    sin_coste --> rechazada
    sin_coste --> caducada
    sin_coste --> cancelada
    sin_coste --> caducada_pago

    pagada --> [*]
```

---

## 4. Flujo de cobro y revelado

Detalle de la parte que mueve dinero, incluido el control de idempotencia.

```mermaid
sequenceDiagram
    autonumber
    actor F as Familia
    participant W as Aplicación
    participant DB as PostgreSQL
    participant S as Stripe
    actor P as Profesor

    Note over F,P: La propuesta ya está en estado «aceptada»

    F->>W: Pulsa «Desbloquear contacto»
    W->>DB: fn_tarifa_vigente('match')
    DB-->>W: importe + stripe_price_id
    W->>S: Crear sesión de Checkout
    S-->>W: URL de pago
    W-->>F: Redirección a Stripe

    F->>S: Introduce el pago (tarjeta o Bizum)
    S-->>F: Confirmación visual

    S->>W: webhook payment_intent.succeeded
    W->>DB: ¿evento ya procesado?
    alt Ya registrado
        DB-->>W: sí
        W-->>S: 200 (sin efectos)
    else Evento nuevo
        DB-->>W: no
        W->>DB: registrar evento
        W->>DB: propuesta → 'pagada'<br/>tarifa_aplicada = instantánea<br/>contacto_revelado_en = ahora
        W->>DB: insertar pago
        W-->>S: 200
        W->>F: email + notificación en app
        W->>P: email + WhatsApp
    end

    Note over F,P: Contacto directo.<br/>Los pagos de las clases<br/>quedan fuera de la plataforma.
```

---

## 5. Ciclo de vida del perfil de profesor

```mermaid
stateDiagram-v2
    direction LR

    state "importado" as imp
    state "registrado" as reg
    state "pendiente" as pen
    state "activo" as act
    state "pausado" as pau
    state "rechazado" as rec
    state "inactivo" as ina

    [*] --> imp : migrado del Excel
    [*] --> reg : alta propia

    imp --> reg : reclama con token
    reg --> pen : completa el perfil
    pen --> act : administración aprueba
    pen --> rec : administración rechaza
    rec --> pen : corrige y reenvía

    act --> pau : el profesor pausa
    pau --> act : el profesor reactiva
    act --> ina : baja
    pau --> ina : baja

    ina --> [*]

    note right of imp
        Invisible en el directorio
    end note

    note right of act
        Único estado visible.
        Exige titulación, universidad,
        bio de 100+ caracteres y colegio.
    end note
```

---

## 6. Migración: de Excel a la plataforma

```mermaid
flowchart LR
    A[("Excel<br/>histórico")] -->|volcado literal| B[("legacy.*<br/>todo TEXT")]
    B -->|análisis de calidad| C{{"informe de<br/>valores distintos"}}
    C -->|normalización| D[("catalogo.*<br/>equivalencias")]
    B -->|transformación| E[("app.*<br/>origen=migracion<br/>validado=false")]
    D --> E
    E -->|token de un solo uso| F["correo de<br/>invitación"]
    F -->|el titular revisa| G[("perfil validado")]
    G -->|aprobación| H[("activo<br/>visible")]

    F -.sin respuesta en 12 meses.-> I[("eliminado")]
    F -.baja en un clic.-> I

    classDef origen fill:#F3F4F6,stroke:#6B7280,color:#1F2937
    classDef proceso fill:#E8F0F8,stroke:#1A4A7A,color:#1F2937
    classDef final fill:#E8F5EF,stroke:#2E7D5E,color:#1F2937
    classDef borrado fill:#FEE2E2,stroke:#DC2626,color:#1F2937

    class A,B origen
    class C,D,E,F proceso
    class G,H final
    class I borrado
```

La separación en dos etapas hace la carga **repetible**: si aparece un error de
mapeo, se corrige la transformación y se vuelve a ejecutar sin tocar el Excel.

---

## 7. Roles y acceso

```mermaid
flowchart TB
    subgraph CLIENTES[" "]
        APP["Aplicación<br/>Next.js"]
        SQL["Cliente SQL<br/>DBeaver"]
        BI["Herramientas<br/>de análisis"]
    end

    subgraph ROLES[" Roles de PostgreSQL "]
        R1["academiavanza_app<br/><i>sujeto a RLS · sin DELETE</i>"]
        R2["academiavanza_lucia<br/><i>BYPASSRLS · auditado</i>"]
        R3["academiavanza_lectura<br/><i>solo SELECT</i>"]
    end

    subgraph ESQUEMAS[" Esquemas "]
        E1["app"]
        E2["catalogo"]
        E3["legacy<br/><i>datos de menores</i>"]
        E4["auditoria"]
    end

    APP --> R1
    SQL --> R2
    BI  --> R3

    R1 -->|SELECT INSERT UPDATE| E1
    R1 -->|SELECT| E2
    R1 -.->|denegado| E3

    R2 -->|todos| E1
    R2 -->|todos| E2
    R2 -->|todos| E3
    R2 -->|SELECT| E4

    R3 -->|SELECT| E1
    R3 -->|SELECT| E2
    R3 -.->|denegado| E3

    classDef rolApp fill:#E8F0F8,stroke:#1A4A7A,color:#1F2937
    classDef rolAdmin fill:#E8F5EF,stroke:#2E7D5E,color:#1F2937,stroke-width:2px
    classDef rolRead fill:#F3F4F6,stroke:#6B7280,color:#1F2937
    classDef sensible fill:#FEE2E2,stroke:#DC2626,color:#1F2937

    class R1 rolApp
    class R2 rolAdmin
    class R3 rolRead
    class E3 sensible
```

Separar la identidad de Lucía de la de la aplicación permite que la auditoría
distinga automáticamente un cambio hecho por el producto de una edición manual.

---

## 8. Cómo editar estos diagramas

Son texto plano en Mermaid dentro de bloques de código. GitHub los renderiza sin
configuración adicional.

Para editarlos con vista previa: [mermaid.live](https://mermaid.live).

En VS Code, la extensión *Markdown Preview Mermaid Support* los muestra en la
vista previa integrada.

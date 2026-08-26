# Modelo de Datos — STR Manager

Todo dato de negocio va a **MySQL en Hostinger**. Firebase solo maneja autenticación y perfiles de rol.

---

## Principio fundamental

```
Firebase Auth     → Solo identidad (quién eres)
Firestore         → Solo rol del usuario en el sistema
MySQL (Hostinger) → TODO lo demás: propiedades, reservas, turnos,
                    tareas, clientes, billing, liquidaciones
```

Esta separación es definitiva. Ver ADR-001 y ADR-002.

---

## Capa SaaS (multi-tenant)

### clients (tenants del SaaS)
```sql
CREATE TABLE clients (
  id            VARCHAR(36)  PRIMARY KEY,  -- UUID
  nombre        VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  plan_id       VARCHAR(36)  REFERENCES plans(id),
  estado        ENUM('activo','suspendido','cancelado') DEFAULT 'activo',
  propiedades_contratadas INT DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### plans (catálogo de planes)
```sql
CREATE TABLE plans (
  id            VARCHAR(36)  PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,         -- 'Básico', 'Profesional', 'Full Service'
  modulos       JSON NOT NULL,                  -- ['housekeeping', 'calendar', ...]
  precio_base   DECIMAL(10,0) NOT NULL,         -- COP por mes por propiedad
  por_propiedad BOOLEAN DEFAULT TRUE,
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### subscriptions (vínculo cliente ↔ plan)
```sql
CREATE TABLE subscriptions (
  id                 VARCHAR(36)  PRIMARY KEY,
  client_id          VARCHAR(36)  REFERENCES clients(id),
  plan_id            VARCHAR(36)  REFERENCES plans(id),
  precio_bloqueado   DECIMAL(10,0) NOT NULL,    -- precio al momento de contratar (grandfathering)
  propiedades_max    INT NOT NULL,
  estado             ENUM('activa','vencida','cancelada') DEFAULT 'activa',
  fecha_inicio       DATE NOT NULL,
  fecha_vencimiento  DATE,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Usuarios y roles

### users (todos los que tienen cuenta)
```sql
CREATE TABLE users (
  id            VARCHAR(36)  PRIMARY KEY,       -- mismo UID que Firebase Auth
  client_id     VARCHAR(36)  REFERENCES clients(id),
  nombre        VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  telefono      VARCHAR(20),
  role          ENUM('admin','operador','limpiador','mantenimiento') NOT NULL,
  company_id    VARCHAR(36)  REFERENCES companies(id) NULL,  -- si es de empresa externa
  activo        BOOLEAN DEFAULT TRUE,           -- nunca eliminar, solo desactivar
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### companies (empresas externas de servicios)
```sql
CREATE TABLE companies (
  id        VARCHAR(36)  PRIMARY KEY,
  client_id VARCHAR(36)  REFERENCES clients(id),
  nombre    VARCHAR(255) NOT NULL,
  tipo      VARCHAR(100),                        -- 'limpieza', 'mantenimiento', etc.
  telefono  VARCHAR(20),
  email     VARCHAR(255),
  notas     TEXT
);
```

---

## Propiedades

### properties (propiedades del cliente)
```sql
CREATE TABLE properties (
  id                VARCHAR(36)  PRIMARY KEY,
  client_id         VARCHAR(36)  REFERENCES clients(id),
  owner_contact_id  VARCHAR(36)  REFERENCES owner_contacts(id) NULL,  -- null = propia
  nombre            VARCHAR(255) NOT NULL,
  tipo              VARCHAR(50),                  -- 'apartamento', 'casa', 'estudio'
  habitaciones      INT DEFAULT 1,
  banos             INT DEFAULT 1,
  capacidad_max     INT DEFAULT 2,
  ciudad            VARCHAR(100),
  direccion         TEXT,
  piso              VARCHAR(20),
  color_calendario  VARCHAR(7),                   -- hex color para el calendario
  activo            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### owner_contacts (propietarios de terceros — NO son usuarios del SaaS)
```sql
CREATE TABLE owner_contacts (
  id             VARCHAR(36)  PRIMARY KEY,
  client_id      VARCHAR(36)  REFERENCES clients(id),
  nombre         VARCHAR(255) NOT NULL,
  email          VARCHAR(255),
  telefono       VARCHAR(20),
  portal_access  BOOLEAN DEFAULT FALSE,          -- si puede ver el portal del propietario
  portal_pass    VARCHAR(255),                   -- hash de contraseña del portal
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### property_service_config (qué módulos opera el cliente vs. el propietario)
```sql
CREATE TABLE property_service_config (
  property_id  VARCHAR(36)  REFERENCES properties(id),
  module_id    VARCHAR(50),                       -- 'housekeeping', 'calendar', etc.
  mode         ENUM('managed','self'),            -- managed=cliente lo opera, self=propietario lo opera
  PRIMARY KEY (property_id, module_id)
);
```

### property_icals (feeds iCal de cada canal por propiedad)
```sql
CREATE TABLE property_icals (
  id          VARCHAR(36)  PRIMARY KEY,
  property_id VARCHAR(36)  REFERENCES properties(id),
  channel     ENUM('airbnb','booking','vrbo','homeaway','directo','otro'),
  url         TEXT NOT NULL,
  status      ENUM('ok','error','pending') DEFAULT 'pending',
  last_sync   TIMESTAMP NULL,
  events_count INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Reservas y disponibilidad

### reservations (todas las reservas de todas las propiedades)
```sql
CREATE TABLE reservations (
  id               VARCHAR(36)  PRIMARY KEY,
  property_id      VARCHAR(36)  REFERENCES properties(id),
  tipo             ENUM('reserva','bloqueo') DEFAULT 'reserva',
  guest_name       VARCHAR(255),
  channel          ENUM('airbnb','booking','vrbo','homeaway','directo','otro'),
  check_in         DATE NOT NULL,
  check_out        DATE NOT NULL,
  checkin_time     TIME DEFAULT '15:00:00',
  checkout_time    TIME DEFAULT '11:00:00',
  nights           INT NOT NULL,
  pax              INT DEFAULT 1,
  total_cop        DECIMAL(12,0),
  notas            TEXT,
  status           ENUM('confirmed','active','completed','cancelled') DEFAULT 'confirmed',
  from_ical        BOOLEAN DEFAULT FALSE,
  ical_uid         VARCHAR(500),                  -- UID del VEVENT si viene de iCal
  reservation_url  TEXT,                          -- link a la reserva en el canal
  reservation_code VARCHAR(50),                   -- ej: HMXXXXXX (Airbnb)
  phone_last4      VARCHAR(4),
  ical_summary     TEXT,                          -- SUMMARY crudo del VEVENT
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (property_id, ical_uid)             -- evitar duplicados de iCal
);
```

---

## Housekeeping (M1)

### shifts (turnos de limpieza)
```sql
CREATE TABLE shifts (
  id               VARCHAR(36)  PRIMARY KEY,
  property_id      VARCHAR(36)  REFERENCES properties(id),
  reservation_id   VARCHAR(36)  REFERENCES reservations(id) NULL,
  assigned_to      VARCHAR(36)  REFERENCES users(id) NULL,
  fecha            DATE NOT NULL,
  hora_inicio      TIME,
  estado           ENUM('pendiente','asignado','en_progreso','completado','verificado','cancelado') DEFAULT 'pendiente',
  creado_por       VARCHAR(36)  REFERENCES users(id),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### shift_tokens (acceso por URL para el limpiador)
```sql
CREATE TABLE shift_tokens (
  id         VARCHAR(36)   PRIMARY KEY,
  shift_id   VARCHAR(36)   REFERENCES shifts(id),
  user_id    VARCHAR(36)   REFERENCES users(id),
  token_hash VARCHAR(255)  NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP NULL
);
```

### workflow_templates (plantillas reutilizables de limpieza)
```sql
CREATE TABLE workflow_templates (
  id         VARCHAR(36)  PRIMARY KEY,
  client_id  VARCHAR(36)  REFERENCES clients(id),
  nombre     VARCHAR(255) NOT NULL,
  tipo       VARCHAR(50),                          -- 'estudio', 'apartamento', 'casa', 'otro'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### workflow_activities + workflow_tasks
```sql
CREATE TABLE workflow_activities (
  id          VARCHAR(36)  PRIMARY KEY,
  template_id VARCHAR(36)  REFERENCES workflow_templates(id),
  nombre      VARCHAR(255) NOT NULL,
  orden       INT NOT NULL
);

CREATE TABLE workflow_tasks (
  id           VARCHAR(36)  PRIMARY KEY,
  activity_id  VARCHAR(36)  REFERENCES workflow_activities(id),
  nombre       VARCHAR(255) NOT NULL,
  estimado_min INT DEFAULT 10,
  foto_required BOOLEAN DEFAULT FALSE,
  criticidad   ENUM('critica','deseable') DEFAULT 'deseable',
  orden        INT NOT NULL
);
```

### shift_activities + shift_tasks (copia concreta del turno)
```sql
CREATE TABLE shift_activities (
  id          VARCHAR(36)  PRIMARY KEY,
  shift_id    VARCHAR(36)  REFERENCES shifts(id),
  nombre      VARCHAR(255) NOT NULL,
  origen_tipo ENUM('flujo','suelta','unica','otro_turno','mantenimiento'),
  origen_ref  VARCHAR(36)  NULL,
  orden       INT NOT NULL
);

CREATE TABLE shift_tasks (
  id            VARCHAR(36)  PRIMARY KEY,
  activity_id   VARCHAR(36)  REFERENCES shift_activities(id),
  nombre        VARCHAR(255) NOT NULL,
  estimado_min  INT DEFAULT 10,
  foto_required BOOLEAN DEFAULT FALSE,
  criticidad    ENUM('critica','deseable') DEFAULT 'deseable',
  completada    BOOLEAN DEFAULT FALSE,
  orden         INT NOT NULL
);
```

### task_completions (registro de ejecución — offline-safe)
```sql
CREATE TABLE task_completions (
  id          VARCHAR(36)  PRIMARY KEY,
  task_id     VARCHAR(36)  REFERENCES shift_tasks(id),
  user_id     VARCHAR(36)  REFERENCES users(id),
  claimed_at  TIMESTAMP NOT NULL,               -- timestamp del dispositivo
  synced_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- timestamp del servidor
  photo_path  VARCHAR(500) NULL
);
```

### shift_payments
```sql
CREATE TABLE shift_payments (
  id         VARCHAR(36)  PRIMARY KEY,
  shift_id   VARCHAR(36)  REFERENCES shifts(id),
  user_id    VARCHAR(36)  REFERENCES users(id),
  monto      DECIMAL(10,0) NOT NULL,
  estado     ENUM('pendiente','pagado') DEFAULT 'pendiente',
  fecha_pago DATE NULL
);
```

---

## Mantenimiento (M3)

### maintenance_tickets
```sql
CREATE TABLE maintenance_tickets (
  id              VARCHAR(36)  PRIMARY KEY,
  property_id     VARCHAR(36)  REFERENCES properties(id),
  reservation_id  VARCHAR(36)  REFERENCES reservations(id) NULL,
  categoria       VARCHAR(50),                    -- 'electrico','plomeria','electrodomestico','estructura','acabados','otro'
  descripcion     TEXT NOT NULL,
  foto_inicial    VARCHAR(500) NULL,
  prioridad       ENUM('urgente','normal','baja') DEFAULT 'normal',
  estado          ENUM('abierto','asignado','en_progreso','esperando_repuesto','resuelto','verificado','reabierto') DEFAULT 'abierto',
  reportado_por   VARCHAR(36)  NULL,              -- user_id o 'huesped'
  asignado_a      VARCHAR(36)  REFERENCES users(id) NULL,
  costo_estimado  DECIMAL(10,0) NULL,
  costo_real      DECIMAL(10,0) NULL,
  fecha_resolucion TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Check-in / Check-out (M2)

### precheckin_forms
```sql
CREATE TABLE precheckin_forms (
  id              VARCHAR(36)  PRIMARY KEY,
  reservation_id  VARCHAR(36)  REFERENCES reservations(id),
  property_id     VARCHAR(36)  REFERENCES properties(id),
  status          ENUM('pending','completed') DEFAULT 'pending',
  submitted_at    TIMESTAMP NULL,
  hora_llegada    TIME NULL,
  mascotas        BOOLEAN DEFAULT FALSE
);
```

### guests (por formulario de pre-checkin)
```sql
CREATE TABLE guests (
  id             VARCHAR(36)  PRIMARY KEY,
  precheckin_id  VARCHAR(36)  REFERENCES precheckin_forms(id),
  nombre         VARCHAR(255) NOT NULL,
  documento      VARCHAR(50),
  tipo_doc       VARCHAR(20),
  fecha_nac      DATE,
  nacionalidad   VARCHAR(100),
  tipo           ENUM('adulto','nino','bebe'),
  pasaporte      VARCHAR(50) NULL,
  visa           VARCHAR(100) NULL
);
```

### regulatory_reports
```sql
CREATE TABLE regulatory_reports (
  id             VARCHAR(36)  PRIMARY KEY,
  reservation_id VARCHAR(36)  REFERENCES reservations(id),
  tipo           ENUM('TRA','SIRE'),
  enviado_at     TIMESTAMP,
  status         ENUM('ok','error','pendiente'),
  radicado       VARCHAR(100) NULL,
  payload_json   JSON NULL
);
```

---

## Finanzas y liquidaciones (M8)

### owner_liquidations
```sql
CREATE TABLE owner_liquidations (
  id                VARCHAR(36)  PRIMARY KEY,
  owner_contact_id  VARCHAR(36)  REFERENCES owner_contacts(id),
  property_id       VARCHAR(36)  REFERENCES properties(id),
  periodo           VARCHAR(7)   NOT NULL,         -- 'YYYY-MM'
  ingresos_brutos   DECIMAL(12,0) NOT NULL,
  costos_limpieza   DECIMAL(12,0) DEFAULT 0,
  costos_mantenimiento DECIMAL(12,0) DEFAULT 0,
  otros_costos      DECIMAL(12,0) DEFAULT 0,
  resultado_neto    DECIMAL(12,0) NOT NULL,
  estado            ENUM('borrador','aprobada','enviada') DEFAULT 'borrador',
  aprobado_por      VARCHAR(36)  REFERENCES users(id) NULL,
  aprobado_at       TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Notas generales sobre el modelo

- **IDs:** UUID (VARCHAR 36) en todas las tablas. En el prototipo se usa `prefix-timestamp` (ej: `u-1722000000000`). En producción: UUID v4 generado en el servidor.
- **Soft delete:** los registros nunca se eliminan. Los usuarios tienen `activo BOOLEAN`. Las reservas tienen `status 'cancelled'`. Los tickets se cierran pero no se borran.
- **Multi-tenant:** todas las tablas de negocio tienen `client_id`. Las queries siempre filtran por `client_id` del usuario autenticado.
- **Timestamps:** `created_at` en todas las tablas, `updated_at` donde aplica.
- **JSON:** para datos que varían (como la lista de módulos de un plan) se usa JSON nativo de MySQL/MariaDB.

---

*Última actualización: 2026-08-26*

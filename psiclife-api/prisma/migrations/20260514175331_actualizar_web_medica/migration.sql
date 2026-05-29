-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `nombre` VARCHAR(60) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `permisos` JSON NOT NULL,
    `es_del_sistema` BOOLEAN NOT NULL DEFAULT false,
    `esta_activo` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_roles_nombre`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `rol_id` CHAR(36) NOT NULL,
    `correo` VARCHAR(255) NOT NULL,
    `contrasena_hash` TEXT NOT NULL,
    `esta_activo` BOOLEAN NOT NULL DEFAULT true,
    `ultimo_acceso` DATETIME(0) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_usuarios_correo`(`correo`),
    INDEX `idx_usuarios_rol`(`rol_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesiones` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `usuario_id` CHAR(36) NOT NULL,
    `ip_origen` VARCHAR(45) NULL,
    `agente_usuario` TEXT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_sesiones_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `usuario_id` CHAR(36) NOT NULL,
    `token_hash` TEXT NOT NULL,
    `expira_en` DATETIME(0) NOT NULL,
    `revocado` BOOLEAN NOT NULL DEFAULT false,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_refresh_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens_recuperacion` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `usuario_id` CHAR(36) NOT NULL,
    `token_hash` TEXT NOT NULL,
    `expira_en` DATETIME(0) NOT NULL,
    `usado` BOOLEAN NOT NULL DEFAULT false,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_tokens_rec_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacientes` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `usuario_id` CHAR(36) NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `tipo_documento` VARCHAR(10) NOT NULL DEFAULT 'DNI',
    `numero_documento` VARCHAR(20) NOT NULL,
    `fecha_nacimiento` DATE NULL,
    `sexo` CHAR(1) NULL,
    `telefono` VARCHAR(20) NULL,
    `whatsapp` VARCHAR(20) NULL,
    `correo_personal` VARCHAR(255) NULL,
    `empresa_u_organizacion` VARCHAR(150) NULL,
    `cargo` VARCHAR(100) NULL,
    `direccion` TEXT NULL,
    `contacto_emergencia` VARCHAR(150) NULL,
    `telefono_emergencia` VARCHAR(20) NULL,
    `es_menor_de_edad` BOOLEAN NOT NULL DEFAULT false,
    `tutor_legal` VARCHAR(150) NULL,
    `canal_primer_contacto` ENUM('whatsapp', 'web', 'telefono', 'referido', 'otro') NULL DEFAULT 'whatsapp',
    `estado_paciente` ENUM('activo', 'inactivo', 'alta', 'derivado') NOT NULL DEFAULT 'activo',
    `notas_generales` TEXT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_pacientes_doc`(`numero_documento`),
    INDEX `fk_pacientes_usuario`(`usuario_id`),
    INDEX `idx_pacientes_apellidos`(`apellidos`, `nombres`),
    INDEX `idx_pacientes_estado`(`estado_paciente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `psicologos` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `usuario_id` CHAR(36) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `numero_colegiatura` VARCHAR(30) NOT NULL,
    `especialidad` VARCHAR(150) NULL DEFAULT 'Psicología Organizacional',
    `descripcion_perfil` TEXT NULL,
    `foto_url` TEXT NULL,
    `duracion_sesion_min` SMALLINT NOT NULL DEFAULT 60,
    `precio_sesion` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `esta_activo` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_psicologos_usuario`(`usuario_id`),
    UNIQUE INDEX `uq_psicologos_colegiatura`(`numero_colegiatura`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horarios` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `psicologo_id` CHAR(36) NOT NULL,
    `dia_semana` ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    `hora_inicio` VARCHAR(5) NOT NULL,
    `hora_fin` VARCHAR(5) NOT NULL,
    `esta_disponible` BOOLEAN NOT NULL DEFAULT true,

    INDEX `idx_horarios_psicologo`(`psicologo_id`),
    UNIQUE INDEX `uq_horario_dia`(`psicologo_id`, `dia_semana`, `hora_inicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bloqueos_agenda` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `psicologo_id` CHAR(36) NOT NULL,
    `fecha_bloqueo` DATE NOT NULL,
    `hora_inicio` VARCHAR(5) NULL,
    `hora_fin` VARCHAR(5) NULL,
    `motivo` VARCHAR(255) NULL,
    `creado_por` CHAR(36) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_bloqueos_creador`(`creado_por`),
    INDEX `idx_bloqueos_psicologo_fecha`(`psicologo_id`, `fecha_bloqueo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citas` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `paciente_id` CHAR(36) NOT NULL,
    `psicologo_id` CHAR(36) NOT NULL,
    `factura_id` CHAR(36) NULL,
    `numero_sesion` SMALLINT NOT NULL DEFAULT 1,
    `programada_para` DATETIME(0) NOT NULL,
    `duracion_minutos` SMALLINT NOT NULL DEFAULT 60,
    `modalidad` ENUM('presencial', 'virtual') NOT NULL DEFAULT 'presencial',
    `enlace_reunion` VARCHAR(500) NULL,
    `estado` ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'reprogramada', 'no_asistio') NOT NULL DEFAULT 'pendiente',
    `cancelado_por` ENUM('paciente', 'psicologo', 'administrador') NULL,
    `motivo_cancelacion` TEXT NULL,
    `cita_original_id` CHAR(36) NULL,
    `notas_sesion` TEXT NULL,
    `recordatorio_enviado` BOOLEAN NOT NULL DEFAULT false,
    `agendado_por` ENUM('paciente', 'psicologo', 'recepcionista', 'sistema') NULL DEFAULT 'psicologo',
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_citas_original`(`cita_original_id`),
    INDEX `idx_citas_estado`(`estado`),
    INDEX `idx_citas_paciente`(`paciente_id`),
    INDEX `idx_citas_programada`(`programada_para`),
    INDEX `idx_citas_psicologo`(`psicologo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asistencias` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `cita_id` CHAR(36) NOT NULL,
    `asistio` BOOLEAN NOT NULL DEFAULT false,
    `hora_llegada` VARCHAR(5) NULL,
    `minutos_tardanza` SMALLINT NOT NULL DEFAULT 0,
    `justificacion` TEXT NULL,
    `registrado_por` CHAR(36) NULL,
    `registrado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_asistencias_cita`(`cita_id`),
    INDEX `fk_asistencias_usuario`(`registrado_por`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitudes_reembolso` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `cita_id` CHAR(36) NOT NULL,
    `solicitado_por` CHAR(36) NOT NULL,
    `tipo_solicitud` ENUM('reembolso', 'reprogramacion') NOT NULL DEFAULT 'reembolso',
    `motivo` TEXT NOT NULL,
    `estado` ENUM('pendiente', 'aprobado', 'rechazado', 'procesado') NOT NULL DEFAULT 'pendiente',
    `monto_solicitado` DECIMAL(10, 2) NULL,
    `notas_resolucion` TEXT NULL,
    `resuelto_por` CHAR(36) NULL,
    `solicitado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `resuelto_en` DATETIME(0) NULL,

    INDEX `fk_solicitudes_resolutor`(`resuelto_por`),
    INDEX `fk_solicitudes_solicitante`(`solicitado_por`),
    INDEX `idx_solicitudes_cita`(`cita_id`),
    INDEX `idx_solicitudes_estado`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dx_catalogo` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `codigo` VARCHAR(20) NOT NULL,
    `sistema` ENUM('CIE-10', 'DSM-5', 'INTERNO') NOT NULL DEFAULT 'CIE-10',
    `nombre` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `categoria` VARCHAR(150) NULL,
    `esta_activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uq_dx_codigo_sistema`(`codigo`, `sistema`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dx_diagnosticos` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `paciente_id` CHAR(36) NOT NULL,
    `psicologo_id` CHAR(36) NOT NULL,
    `catalogo_id` CHAR(36) NOT NULL,
    `cita_id` CHAR(36) NULL,
    `tipo` ENUM('principal', 'secundario', 'presuntivo', 'descartado') NOT NULL DEFAULT 'presuntivo',
    `observaciones` TEXT NULL,
    `fecha_diagnostico` DATE NOT NULL,
    `fecha_cierre` DATE NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_dx_cita`(`cita_id`),
    INDEX `fk_dx_psicologo`(`psicologo_id`),
    INDEX `idx_dx_catalogo`(`catalogo_id`),
    INDEX `idx_dx_paciente`(`paciente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eva_instrumentos` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `nombre` VARCHAR(200) NOT NULL,
    `codigo_instrumento` VARCHAR(50) NOT NULL,
    `descripcion` TEXT NULL,
    `tipo` ENUM('cuestionario', 'cartilla', 'prueba_proyectiva', 'escala', 'inventario', 'otro') NOT NULL DEFAULT 'cuestionario',
    `area_evaluada` VARCHAR(150) NULL,
    `instrucciones` TEXT NULL,
    `esta_activo` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_eva_codigo`(`codigo_instrumento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eva_items` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `instrumento_id` CHAR(36) NOT NULL,
    `numero_item` SMALLINT NOT NULL,
    `enunciado` TEXT NOT NULL,
    `tipo_respuesta` ENUM('likert', 'opcion_multiple', 'abierta', 'si_no', 'numerica') NOT NULL DEFAULT 'likert',
    `opciones_json` JSON NULL,
    `puntaje_maximo` DECIMAL(5, 2) NULL,

    UNIQUE INDEX `uq_eva_item`(`instrumento_id`, `numero_item`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eva_aplicaciones` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `paciente_id` CHAR(36) NOT NULL,
    `psicologo_id` CHAR(36) NOT NULL,
    `instrumento_id` CHAR(36) NOT NULL,
    `cita_id` CHAR(36) NULL,
    `estado` ENUM('pendiente', 'en_progreso', 'completado', 'anulado') NOT NULL DEFAULT 'pendiente',
    `puntaje_total` DECIMAL(8, 2) NULL,
    `interpretacion` TEXT NULL,
    `fecha_aplicacion` DATE NOT NULL,
    `fecha_completado` DATETIME(0) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_eva_app_cita`(`cita_id`),
    INDEX `fk_eva_app_psicologo`(`psicologo_id`),
    INDEX `idx_eva_app_instrumento`(`instrumento_id`),
    INDEX `idx_eva_app_paciente`(`paciente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eva_respuestas` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `aplicacion_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `respuesta_texto` TEXT NULL,
    `respuesta_numerica` DECIMAL(8, 2) NULL,
    `puntaje_obtenido` DECIMAL(5, 2) NULL,
    `respondido_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_eva_resp_item`(`item_id`),
    UNIQUE INDEX `uq_eva_respuesta`(`aplicacion_id`, `item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `act_biblioteca` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `titulo` VARCHAR(200) NOT NULL,
    `tipo` ENUM('tarea', 'cartilla', 'tecnica', 'recurso', 'ejercicio') NOT NULL DEFAULT 'tarea',
    `descripcion` TEXT NULL,
    `contenido_html` LONGTEXT NULL,
    `archivo_url` TEXT NULL,
    `area_psicologica` VARCHAR(100) NULL,
    `creado_por` CHAR(36) NOT NULL,
    `esta_activo` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_act_bib_creador`(`creado_por`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `act_asignaciones` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `paciente_id` CHAR(36) NOT NULL,
    `psicologo_id` CHAR(36) NOT NULL,
    `actividad_id` CHAR(36) NOT NULL,
    `cita_id` CHAR(36) NULL,
    `instrucciones` TEXT NULL,
    `fecha_asignacion` DATE NOT NULL,
    `fecha_limite` DATE NULL,
    `estado` ENUM('pendiente', 'en_progreso', 'completada', 'omitida') NOT NULL DEFAULT 'pendiente',
    `retroalimentacion` TEXT NULL,
    `completada_en` DATETIME(0) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_act_asig_actividad`(`actividad_id`),
    INDEX `fk_act_asig_cita`(`cita_id`),
    INDEX `fk_act_asig_psicologo`(`psicologo_id`),
    INDEX `idx_act_asig_estado`(`estado`),
    INDEX `idx_act_asig_paciente`(`paciente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `act_respuestas` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `asignacion_id` CHAR(36) NOT NULL,
    `contenido` LONGTEXT NULL,
    `archivos_adjuntos` JSON NULL,
    `porcentaje_avance` TINYINT NOT NULL DEFAULT 0,
    `enviado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_act_resp_asignacion`(`asignacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `esta_activa` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_categorias_nombre`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `categoria_id` CHAR(36) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `precio` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `foto_principal` TEXT NULL,
    `esta_activo` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_productos_categoria`(`categoria_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos_fotos` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `producto_id` CHAR(36) NOT NULL,
    `url` TEXT NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_prod_fotos_producto`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos_presentaciones` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `producto_id` CHAR(36) NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `contenido` TEXT NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_prod_pres_producto`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `cita_id` CHAR(36) NOT NULL,
    `paciente_id` CHAR(36) NOT NULL,
    `psicologo_id` CHAR(36) NOT NULL,
    `numero_factura` VARCHAR(30) NOT NULL,
    `descripcion_servicio` VARCHAR(255) NOT NULL DEFAULT 'Consulta psicológica',
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `igv` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `estado` ENUM('pendiente', 'pagada', 'reembolsada', 'parcial', 'anulada') NOT NULL DEFAULT 'pendiente',
    `emitida_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_facturas_cita`(`cita_id`),
    UNIQUE INDEX `uq_facturas_numero`(`numero_factura`),
    INDEX `fk_facturas_psicologo`(`psicologo_id`),
    INDEX `idx_facturas_estado`(`estado`),
    INDEX `idx_facturas_paciente`(`paciente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `factura_id` CHAR(36) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `metodo` ENUM('efectivo', 'yape', 'transferencia', 'tarjeta') NOT NULL,
    `codigo_referencia` VARCHAR(100) NULL,
    `url_comprobante` TEXT NULL,
    `registrado_por` CHAR(36) NOT NULL,
    `pagado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_pagos_usuario`(`registrado_por`),
    INDEX `idx_pagos_factura`(`factura_id`),
    INDEX `idx_pagos_metodo`(`metodo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cor_plantillas` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `codigo` VARCHAR(60) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `asunto` VARCHAR(255) NOT NULL,
    `cuerpo_html` LONGTEXT NOT NULL,
    `esta_activa` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_cor_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cor_cola` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `plantilla_id` CHAR(36) NULL,
    `destinatario` VARCHAR(255) NOT NULL,
    `asunto` VARCHAR(255) NOT NULL,
    `cuerpo_html` LONGTEXT NOT NULL,
    `variables_json` JSON NULL,
    `entidad_origen` VARCHAR(60) NULL,
    `entidad_id` CHAR(36) NULL,
    `estado` ENUM('pendiente', 'enviado', 'fallido', 'reintentando') NOT NULL DEFAULT 'pendiente',
    `intentos` TINYINT NOT NULL DEFAULT 0,
    `max_intentos` TINYINT NOT NULL DEFAULT 3,
    `ultimo_error` TEXT NULL,
    `programado_para` DATETIME(0) NULL,
    `enviado_en` DATETIME(0) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_cor_plantilla`(`plantilla_id`),
    INDEX `idx_cor_cola_estado`(`estado`, `programado_para`),
    INDEX `idx_cor_entidad`(`entidad_origen`, `entidad_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `web_medica` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `nombre_consultorio` VARCHAR(150) NOT NULL DEFAULT 'PsicLife',
    `titulo_principal` VARCHAR(255) NULL,
    `slogan` VARCHAR(255) NULL,
    `descripcion` TEXT NULL,
    `direccion` VARCHAR(255) NULL,
    `telefono` VARCHAR(20) NULL,
    `whatsapp` VARCHAR(20) NULL,
    `correo_contacto` VARCHAR(255) NULL,
    `logo_url` TEXT NULL,
    `mision` TEXT NULL,
    `vision` TEXT NULL,
    `redes_sociales_json` JSON NULL,
    `director_foto` TEXT NULL,
    `director_nombre` VARCHAR(150) NULL,
    `director_rol` VARCHAR(150) NULL,
    `director_frase` VARCHAR(255) NULL,
    `director_bio` TEXT NULL,
    `actualizado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `usuario_id` CHAR(36) NULL,
    `accion` VARCHAR(100) NOT NULL,
    `modulo` VARCHAR(60) NOT NULL,
    `entidad_id` CHAR(36) NULL,
    `datos_anteriores` JSON NULL,
    `datos_nuevos` JSON NULL,
    `ip_origen` VARCHAR(45) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_auditoria_accion`(`accion`),
    INDEX `idx_auditoria_creado`(`creado_en`),
    INDEX `idx_auditoria_modulo`(`modulo`),
    INDEX `idx_auditoria_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `fk_refresh_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tokens_recuperacion` ADD CONSTRAINT `fk_tokens_rec_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `fk_pacientes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `psicologos` ADD CONSTRAINT `fk_psicologos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `horarios` ADD CONSTRAINT `fk_horarios_psicologo` FOREIGN KEY (`psicologo_id`) REFERENCES `psicologos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `bloqueos_agenda` ADD CONSTRAINT `fk_bloqueos_creador` FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `bloqueos_agenda` ADD CONSTRAINT `fk_bloqueos_psicologo` FOREIGN KEY (`psicologo_id`) REFERENCES `psicologos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `fk_citas_original` FOREIGN KEY (`cita_original_id`) REFERENCES `citas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `fk_citas_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `fk_citas_psicologo` FOREIGN KEY (`psicologo_id`) REFERENCES `psicologos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `asistencias` ADD CONSTRAINT `fk_asistencias_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `asistencias` ADD CONSTRAINT `fk_asistencias_usuario` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `solicitudes_reembolso` ADD CONSTRAINT `fk_solicitudes_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `solicitudes_reembolso` ADD CONSTRAINT `fk_solicitudes_resolutor` FOREIGN KEY (`resuelto_por`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `solicitudes_reembolso` ADD CONSTRAINT `fk_solicitudes_solicitante` FOREIGN KEY (`solicitado_por`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dx_diagnosticos` ADD CONSTRAINT `fk_dx_catalogo` FOREIGN KEY (`catalogo_id`) REFERENCES `dx_catalogo`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dx_diagnosticos` ADD CONSTRAINT `fk_dx_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dx_diagnosticos` ADD CONSTRAINT `fk_dx_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dx_diagnosticos` ADD CONSTRAINT `fk_dx_psicologo` FOREIGN KEY (`psicologo_id`) REFERENCES `psicologos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `eva_items` ADD CONSTRAINT `fk_eva_item_instrumento` FOREIGN KEY (`instrumento_id`) REFERENCES `eva_instrumentos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `eva_aplicaciones` ADD CONSTRAINT `fk_eva_app_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `eva_aplicaciones` ADD CONSTRAINT `fk_eva_app_instrumento` FOREIGN KEY (`instrumento_id`) REFERENCES `eva_instrumentos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `eva_aplicaciones` ADD CONSTRAINT `fk_eva_app_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `eva_aplicaciones` ADD CONSTRAINT `fk_eva_app_psicologo` FOREIGN KEY (`psicologo_id`) REFERENCES `psicologos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `eva_respuestas` ADD CONSTRAINT `fk_eva_resp_aplicacion` FOREIGN KEY (`aplicacion_id`) REFERENCES `eva_aplicaciones`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `eva_respuestas` ADD CONSTRAINT `fk_eva_resp_item` FOREIGN KEY (`item_id`) REFERENCES `eva_items`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `act_biblioteca` ADD CONSTRAINT `fk_act_bib_creador` FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `act_asignaciones` ADD CONSTRAINT `fk_act_asig_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `act_biblioteca`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `act_asignaciones` ADD CONSTRAINT `fk_act_asig_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `act_asignaciones` ADD CONSTRAINT `fk_act_asig_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `act_asignaciones` ADD CONSTRAINT `fk_act_asig_psicologo` FOREIGN KEY (`psicologo_id`) REFERENCES `psicologos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `act_respuestas` ADD CONSTRAINT `fk_act_resp_asignacion` FOREIGN KEY (`asignacion_id`) REFERENCES `act_asignaciones`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `productos_fotos` ADD CONSTRAINT `fk_prod_fotos_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `productos_presentaciones` ADD CONSTRAINT `fk_prod_pres_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `fk_facturas_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `fk_facturas_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `fk_facturas_psicologo` FOREIGN KEY (`psicologo_id`) REFERENCES `psicologos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `fk_pagos_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cor_cola` ADD CONSTRAINT `fk_cor_plantilla` FOREIGN KEY (`plantilla_id`) REFERENCES `cor_plantillas`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

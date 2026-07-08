-- ============================================================
--  DIGITALIZABD — Script completo de base de datos
--  Versión actualizada: incluye tabla usuarios
-- ============================================================

DROP DATABASE IF EXISTS digitalizabd;

CREATE DATABASE digitalizabd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE digitalizabd;

-- ────────────────────────────────────────────────────────────
--  1. USUARIOS  (autenticación JWT)
-- ────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id         INT           AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100)  NOT NULL,
  email      VARCHAR(120)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  rol        ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  creado_en  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
--  2. CATEGORIA
-- ────────────────────────────────────────────────────────────
CREATE TABLE categoria (
  id_categoria     INT           AUTO_INCREMENT PRIMARY KEY,
  nombre_categoria VARCHAR(100)  NOT NULL,
  descripcion      TEXT
);

-- ────────────────────────────────────────────────────────────
--  3. PROVEEDOR
-- ────────────────────────────────────────────────────────────
CREATE TABLE proveedor (
  id_proveedor     INT           AUTO_INCREMENT PRIMARY KEY,
  nombre_proveedor VARCHAR(120)  NOT NULL,
  numero_contacto  VARCHAR(20)
);

-- ────────────────────────────────────────────────────────────
--  4. PRODUCTO  (FK → categoria, proveedor)
-- ────────────────────────────────────────────────────────────
CREATE TABLE producto (
  id_producto      INT            AUTO_INCREMENT PRIMARY KEY,
  id_proveedor_fk  INT            NOT NULL,
  id_categoria_fk  INT            NOT NULL,
  nombre_producto  VARCHAR(150)   NOT NULL,
  fecha_entrada    DATE           NOT NULL,
  precio_neto      DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  precio_venta     DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  activo           TINYINT(1)     NOT NULL DEFAULT 1,

  CONSTRAINT fk_producto_proveedor FOREIGN KEY (id_proveedor_fk)
    REFERENCES proveedor(id_proveedor) ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria_fk)
    REFERENCES categoria(id_categoria) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ────────────────────────────────────────────────────────────
--  5. PRODUCTO_PROVEEDOR  (tabla puente M:N)
-- ────────────────────────────────────────────────────────────
CREATE TABLE producto_proveedor (
  id_proveedor_fk   INT           NOT NULL,
  id_producto_fk    INT           NOT NULL,
  precio_compra     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  fecha_suministro  DATE,

  PRIMARY KEY (id_proveedor_fk, id_producto_fk),

  CONSTRAINT fk_pp_proveedor FOREIGN KEY (id_proveedor_fk)
    REFERENCES proveedor(id_proveedor) ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_pp_producto  FOREIGN KEY (id_producto_fk)
    REFERENCES producto(id_producto)  ON UPDATE CASCADE ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
--  6. INVENTARIO  (FK → producto)
-- ────────────────────────────────────────────────────────────
CREATE TABLE inventario (
  id_inventario   INT  AUTO_INCREMENT PRIMARY KEY,
  id_producto_fk  INT  NOT NULL,
  cantidad        INT  NOT NULL DEFAULT 0,

  CONSTRAINT fk_inventario_producto FOREIGN KEY (id_producto_fk)
    REFERENCES producto(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ────────────────────────────────────────────────────────────
--  7. FACTURA  (FK → inventario)
-- ────────────────────────────────────────────────────────────
CREATE TABLE factura (
  id_factura              INT           AUTO_INCREMENT PRIMARY KEY,
  id_inventario_fk        INT           NOT NULL,
  identificacion_cliente  VARCHAR(30)   NOT NULL,
  metodode_pago           VARCHAR(50)   NOT NULL,
  fecha_compra            DATE          NOT NULL DEFAULT (CURRENT_DATE),

  CONSTRAINT fk_factura_inventario FOREIGN KEY (id_inventario_fk)
    REFERENCES inventario(id_inventario) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ────────────────────────────────────────────────────────────
--  8. DETALLE_VENTA  (FK → factura)
-- ────────────────────────────────────────────────────────────
CREATE TABLE detalle_venta (
  id_detalle        INT           AUTO_INCREMENT PRIMARY KEY,
  id_factura_fk     INT           NOT NULL,
  cantidad_vendida  INT           NOT NULL DEFAULT 0,
  cantidad_perdida  INT           NOT NULL DEFAULT 0,
  cantidad_neta     INT           GENERATED ALWAYS AS
                      (cantidad_vendida - cantidad_perdida) STORED,
  fechas            DATE          NOT NULL DEFAULT (CURRENT_DATE),

  CONSTRAINT fk_detalle_factura FOREIGN KEY (id_factura_fk)
    REFERENCES factura(id_factura) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
--  DATOS DE PRUEBA
-- ============================================================

-- Usuario admin  (contraseña: admin123  — hash bcrypt 10 rondas)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@sistema.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Categorías
INSERT INTO categoria (nombre_categoria, descripcion) VALUES
  ('Electrónica',  'Dispositivos y equipos electrónicos'),
  ('Alimentos',    'Productos alimenticios y bebidas'),
  ('Ropa',         'Prendas de vestir y accesorios'),
  ('Papelería',    'Útiles de oficina y escritorio');

-- Proveedores
INSERT INTO proveedor (nombre_proveedor, numero_contacto) VALUES
  ('HP Colombia',    '601-3001000'),
  ('Molinos Diana',  '601-4005000'),
  ('Textiles SA',    '601-5008000'),
  ('Scribe',         '601-6002000');

-- Productos
INSERT INTO producto (id_proveedor_fk, id_categoria_fk, nombre_producto, fecha_entrada, precio_neto, precio_venta) VALUES
  (1, 1, 'Laptop HP 15',    '2024-01-10', 1800000.00, 2500000.00),
  (2, 2, 'Arroz Diana 5kg', '2024-02-05',   12000.00,   18000.00),
  (3, 3, 'Camiseta Polo',   '2024-03-15',   28000.00,   45000.00),
  (4, 4, 'Resma Papel A4',  '2024-04-01',    9000.00,   15000.00);

-- Producto_Proveedor (M:N)
INSERT INTO producto_proveedor (id_proveedor_fk, id_producto_fk, precio_compra, fecha_suministro) VALUES
  (1, 1, 1750000.00, '2024-01-08'),
  (2, 2,   11500.00, '2024-02-03'),
  (3, 3,   27000.00, '2024-03-13'),
  (4, 4,    8500.00, '2024-03-30');

-- Inventario
INSERT INTO inventario (id_producto_fk, cantidad) VALUES
  (1, 10),
  (2, 200),
  (3, 30),
  (4, 50);

-- Facturas
INSERT INTO factura (id_inventario_fk, identificacion_cliente, metodode_pago, fecha_compra) VALUES
  (1, '1020304050', 'Tarjeta débito', '2024-05-01'),
  (2, '9876543210', 'Efectivo',       '2024-05-03'),
  (3, '1122334455', 'Transferencia',  '2024-05-05');

-- Detalle Venta
INSERT INTO detalle_venta (id_factura_fk, cantidad_vendida, cantidad_perdida, fechas) VALUES
  (1, 2, 0, '2024-05-01'),
  (2, 5, 1, '2024-05-03'),
  (3, 3, 0, '2024-05-05');

SELECT 'digitalizabd creada correctamente' AS estado;

-- ============================================================
--  ACTUALIZACIÓN: tabla clientes + columna email en factura
-- ============================================================

-- 9. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente      INT           AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120)  NOT NULL,
  identificacion  VARCHAR(30)   NOT NULL UNIQUE,
  email           VARCHAR(120),
  telefono        VARCHAR(20),
  direccion       VARCHAR(200),
  creado_en       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna email_cliente a factura (si no existe)
ALTER TABLE factura
  ADD COLUMN IF NOT EXISTS email_cliente VARCHAR(120) NULL AFTER fecha_compra;

-- Datos de prueba clientes
INSERT IGNORE INTO clientes (nombre, identificacion, email, telefono, direccion) VALUES
  ('Juan Pérez',    '1020304050', 'juan@correo.com',  '300-1234567', 'Calle 10 # 20-30, Bogotá'),
  ('María García',  '9876543210', 'maria@correo.com', '311-9876543', 'Carrera 5 # 15-20, Medellín'),
  ('Carlos López',  '1122334455', 'carlos@correo.com','320-4455667', 'Av. 30 # 45-10, Cali');

SELECT 'Actualización de digitalizabd completada ✅' AS estado;

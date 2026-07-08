const router = require('express').Router();
const db     = require('../config/db');

// GET /api/estadisticas/inventario  — ganancias/pérdidas por producto
router.get('/inventario', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id_producto,
        p.nombre_producto,
        c.nombre_categoria,
        pr.nombre_proveedor,
        p.precio_neto,
        p.precio_venta,
        IFNULL(i.cantidad, 0)              AS stock_actual,
        IFNULL(SUM(dv.cantidad_vendida),0) AS total_vendido,
        IFNULL(SUM(dv.cantidad_perdida),0) AS total_perdido,
        IFNULL(SUM(dv.cantidad_neta),0)    AS cantidad_neta,
        -- Valor del inventario actual
        IFNULL(i.cantidad,0) * p.precio_neto    AS costo_inventario,
        IFNULL(i.cantidad,0) * p.precio_venta   AS valor_inventario,
        -- Ganancias por ventas realizadas
        IFNULL(SUM(dv.cantidad_neta),0) * (p.precio_venta - p.precio_neto) AS ganancia_ventas,
        -- Pérdidas por unidades perdidas
        IFNULL(SUM(dv.cantidad_perdida),0) * p.precio_neto AS perdida_merma,
        -- Ganancia potencial del stock restante
        IFNULL(i.cantidad,0) * (p.precio_venta - p.precio_neto) AS ganancia_potencial
      FROM producto p
      INNER JOIN categoria c  ON c.id_categoria  = p.id_categoria_fk
      INNER JOIN proveedor pr ON pr.id_proveedor = p.id_proveedor_fk
      LEFT  JOIN inventario i ON i.id_producto_fk = p.id_producto
      LEFT  JOIN factura f    ON f.id_inventario_fk = i.id_inventario
      LEFT  JOIN detalle_venta dv ON dv.id_factura_fk = f.id_factura
      WHERE p.activo = 1
      GROUP BY p.id_producto, i.id_inventario
      ORDER BY ganancia_ventas DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[ESTAD] inventario:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// GET /api/estadisticas/resumen  — totales globales
router.get('/resumen', async (req, res) => {
  try {
    const [[resumen]] = await db.query(`
      SELECT
        COUNT(DISTINCT p.id_producto)               AS total_productos,
        IFNULL(SUM(i.cantidad),0)                   AS total_stock,
        IFNULL(SUM(i.cantidad * p.precio_neto),0)   AS costo_total_inventario,
        IFNULL(SUM(i.cantidad * p.precio_venta),0)  AS valor_total_inventario,
        IFNULL(SUM(dv.cantidad_neta * (p.precio_venta - p.precio_neto)),0) AS ganancia_realizada,
        IFNULL(SUM(dv.cantidad_perdida * p.precio_neto),0)                 AS perdida_total,
        IFNULL(SUM(i.cantidad * (p.precio_venta - p.precio_neto)),0)       AS ganancia_potencial
      FROM producto p
      LEFT JOIN inventario i     ON i.id_producto_fk = p.id_producto
      LEFT JOIN factura f        ON f.id_inventario_fk = i.id_inventario
      LEFT JOIN detalle_venta dv ON dv.id_factura_fk = f.id_factura
      WHERE p.activo = 1
    `);
    res.json(resumen);
  } catch (err) {
    console.error('[ESTAD] resumen:', err);
    res.status(500).json({ error: 'Error al obtener resumen.' });
  }
});

// GET /api/estadisticas/ventas-por-mes  — ventas agrupadas por mes
router.get('/ventas-por-mes', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(dv.fechas, '%Y-%m') AS mes,
        SUM(dv.cantidad_vendida)        AS vendidas,
        SUM(dv.cantidad_perdida)        AS perdidas,
        SUM(dv.cantidad_neta)           AS netas,
        SUM(dv.cantidad_neta * (p.precio_venta - p.precio_neto)) AS ganancia
      FROM detalle_venta dv
      INNER JOIN factura f    ON f.id_factura = dv.id_factura_fk
      INNER JOIN inventario i ON i.id_inventario = f.id_inventario_fk
      INNER JOIN producto p   ON p.id_producto = i.id_producto_fk
      GROUP BY mes
      ORDER BY mes ASC
      LIMIT 12
    `);
    res.json(rows);
  } catch (err) {
    console.error('[ESTAD] ventas-por-mes:', err);
    res.status(500).json({ error: 'Error al obtener ventas por mes.' });
  }
});

module.exports = router;

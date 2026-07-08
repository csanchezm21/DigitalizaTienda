const router = require('express').Router();
const db     = require('../config/db');

// GET /api/categorias
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, COUNT(p.id_producto) AS total_productos
      FROM categoria c
      LEFT JOIN producto p ON p.id_categoria_fk = c.id_categoria AND p.activo = 1
      GROUP BY c.id_categoria
      ORDER BY c.nombre_categoria
    `);
    res.json(rows);
  } catch (err) {
    console.error('[CAT] GET /:', err);
    res.status(500).json({ error: 'Error al obtener categorías.' });
  }
});

// GET /api/categorias/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categoria WHERE id_categoria = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categoría.' });
  }
});

// POST /api/categorias
router.post('/', async (req, res) => {
  const { nombre_categoria, descripcion } = req.body;
  if (!nombre_categoria) return res.status(400).json({ error: 'El nombre es requerido.' });
  try {
    const [r] = await db.query(
      'INSERT INTO categoria (nombre_categoria, descripcion) VALUES (?, ?)',
      [nombre_categoria.trim(), descripcion || null]
    );
    const [rows] = await db.query('SELECT * FROM categoria WHERE id_categoria = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[CAT] POST /:', err);
    res.status(500).json({ error: 'Error al crear categoría.' });
  }
});

// PUT /api/categorias/:id
router.put('/:id', async (req, res) => {
  const { nombre_categoria, descripcion } = req.body;
  if (!nombre_categoria) return res.status(400).json({ error: 'El nombre es requerido.' });
  try {
    const [upd] = await db.query(
      'UPDATE categoria SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?',
      [nombre_categoria.trim(), descripcion || null, req.params.id]
    );
    if (upd.affectedRows === 0) return res.status(404).json({ error: 'Categoría no encontrada.' });
    const [rows] = await db.query('SELECT * FROM categoria WHERE id_categoria = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar categoría.' });
  }
});

// DELETE /api/categorias/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM categoria WHERE id_categoria = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'No se puede eliminar: tiene productos asociados.' });
    res.status(500).json({ error: 'Error al eliminar categoría.' });
  }
});

module.exports = router;

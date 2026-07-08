const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía una factura por correo al cliente.
 * @param {object} factura - datos de la factura
 * @param {string} destinatario - email del cliente
 */
async function enviarFactura(factura, destinatario) {
  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background:#FAF5F0; margin:0; padding:20px; }
    .card { background:#fff; border-radius:12px; max-width:600px; margin:0 auto;
            padding:32px; box-shadow:0 4px 20px rgba(124,61,30,.15); }
    .header { text-align:center; margin-bottom:24px; }
    .header h1 { color:#7C3D1E; font-size:22px; margin:8px 0 4px; }
    .header p  { color:#8C6D5A; font-size:13px; }
    .badge { display:inline-block; background:#7C3D1E; color:#fff;
             border-radius:999px; padding:4px 14px; font-size:12px; font-weight:700; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    th { background:#F5E8DF; color:#7C3D1E; text-align:left; padding:10px 12px; font-size:13px; }
    td { padding:10px 12px; border-bottom:1px solid #E8D8CC; font-size:14px; color:#2A1A0E; }
    .total-row td { background:#7C3D1E; color:#fff; font-weight:700; }
    .footer { text-align:center; margin-top:24px; font-size:12px; color:#8C6D5A; }
  </style>
  </head>
  <body>
  <div class="card">
    <div class="header">
      <h1>🏪 Digitaliza Tu Tienda</h1>
      <p>Gracias por tu compra — aquí está tu factura</p>
      <span class="badge">Factura #${factura.id_factura}</span>
    </div>

    <table>
      <tr><th colspan="2">Datos del Cliente</th></tr>
      <tr><td>Identificación</td><td>${factura.identificacion_cliente}</td></tr>
      <tr><td>Email</td><td>${destinatario}</td></tr>
      <tr><th colspan="2">Detalle de Compra</th></tr>
      <tr><td>Producto</td><td>${factura.nombre_producto}</td></tr>
      <tr><td>Método de pago</td><td>${factura.metodode_pago}</td></tr>
      <tr><td>Fecha</td><td>${factura.fecha_compra}</td></tr>
      <tr><td>Cantidad vendida</td><td>${factura.cantidad_vendida ?? 0}</td></tr>
      <tr><td>Precio unitario</td><td>$${Number(factura.precio_venta ?? 0).toLocaleString('es-CO')}</td></tr>
      <tr class="total-row">
        <td>TOTAL</td>
        <td>$${(Number(factura.precio_venta ?? 0) * Number(factura.cantidad_vendida ?? 1)).toLocaleString('es-CO')}</td>
      </tr>
    </table>

    <div class="footer">
      Este correo fue generado automáticamente por <strong>Digitaliza Tu Tienda</strong>.<br>
      Si tienes preguntas, responde a este mensaje.
    </div>
  </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      destinatario,
    subject: `Factura #${factura.id_factura} — Digitaliza Tu Tienda`,
    html,
  });
}

module.exports = { enviarFactura };

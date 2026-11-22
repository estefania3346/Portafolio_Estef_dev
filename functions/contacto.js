// Cloudflare Pages Function: recibe el formulario de contacto y lo envía por correo con Resend.
// Variables de entorno (Cloudflare > Settings > Environment variables):
//   RESEND_API_KEY  clave de Resend
//   CONTACT_TO      correo donde quieres recibir los mensajes
//   CONTACT_FROM    remitente verificado en Resend, p. ej. "Portafolio <contacto@tudominio.com>"

const escapar = (texto) => String(texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export async function onRequestPost({ request, env }) {
  try {
    const datos = await request.json();
    const nombre = (datos.nombre || '').trim();
    const email = (datos.email || datos.correo || '').trim();
    const mensaje = (datos.mensaje || '').trim();

    if (!nombre || !email || !mensaje) {
      return Response.json({ error: 'Faltan campos' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || mensaje.length > 5000) {
      return Response.json({ error: 'Datos no válidos' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: env.CONTACT_TO,
        subject: `Nuevo mensaje del portafolio de ${nombre.slice(0, 80)}`,
        reply_to: email,
        html: `
          <p><strong>De:</strong> ${escapar(nombre)}</p>
          <p><strong>Email:</strong> ${escapar(email)}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${escapar(mensaje).replace(/\n/g, '<br>')}</p>
        `
      })
    });

    return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 500 });
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

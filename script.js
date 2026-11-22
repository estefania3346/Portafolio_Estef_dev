// =========================================
// Portafolio de Estef
// Todo el contenido de proyectos se lee de proyectos.json
// =========================================

const REDUCIR_MOVIMIENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Íconos de tecnologías (archivos en assets/iconos). La clave va en minúsculas.
const ICONOS_TEC = {
  'python': 'python', 'c': 'c', 'c#': 'csharp', 'c / c#': 'csharp', 'java': 'java',
  'javascript': 'javascript', 'js': 'javascript', 'html': 'html5', 'css': 'css3', 'scss': 'sass',
  'sass': 'sass', 'django': 'django', 'flask': 'flask', 'mysql': 'mysql', 'firebase': 'firebase',
  'unity': 'unity', 'visual studio': 'visualstudio', 'android studio': 'androidstudio',
  'git': 'git', 'github': 'github', 'react': 'react', 'react native': 'react'
};

// Sujetadores y sellos para las hojas de proyecto
const SUJETADORES = ['clip', 'cinta', 'grapa'];
const SELLOS = { nuevo: 'Nuevo', aprobado: 'Aprobado', destacado: 'Destacado', 'en-progreso': 'En progreso' };

// Imagen de reserva para cuando falte una captura
const IMAGEN_RESERVA = "data:image/svg+xml," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 220'>" +
  "<rect width='320' height='220' fill='#efebe2'/>" +
  "<g stroke='#262626' stroke-opacity='.18' stroke-width='2' stroke-linecap='round'>" +
  "<path d='M40 70h240M40 100h200M40 130h160'/></g>" +
  "<text x='160' y='185' text-anchor='middle' font-family='monospace' font-size='13' fill='#5e5a55'>captura pendiente</text></svg>"
);

// =========================================
// Utilidades
// =========================================
let cacheProyectos = null;

async function obtenerProyectos() {
  if (cacheProyectos) return cacheProyectos;
  const response = await fetch('proyectos.json');
  if (!response.ok) throw new Error('No se pudo leer proyectos.json');
  cacheProyectos = await response.json();
  return cacheProyectos;
}

function el(tag, clase, texto) {
  const nodo = document.createElement(tag);
  if (clase) nodo.className = clase;
  if (texto) nodo.textContent = texto;
  return nodo;
}

function imagen(src, alt) {
  const img = el('img');
  img.src = src || IMAGEN_RESERVA;
  img.alt = alt || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => { img.src = IMAGEN_RESERVA; }, { once: true });
  return img;
}

function enlaceExterno(href, texto, clase) {
  const a = el('a', clase, texto);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener';
  return a;
}

function mensajeVacio(contenedor, texto) {
  contenedor.replaceChildren(el('p', 'estado-vacio', texto));
}

function chipTecnologia(nombre) {
  const li = el('li', 'chip');
  const archivo = ICONOS_TEC[nombre.toLowerCase()];
  if (archivo) {
    const ico = el('img');
    ico.src = `assets/iconos/${archivo}.svg`;
    ico.alt = '';
    ico.width = 18; ico.height = 18;
    li.append(ico);
  }
  li.append(document.createTextNode(nombre));
  return li;
}

function sello(tipo) {
  if (!tipo || !SELLOS[tipo]) return null;
  return el('span', `sello sello-${tipo}`, SELLOS[tipo]);
}

// Normaliza una captura: puede venir como texto ("assets/x.jpg") o como { "src": "...", "pie": "..." }
function captura(item, i, nombre) {
  if (typeof item === 'string') return { src: item, pie: `${nombre} · ${i + 1}` };
  return { src: item.src, pie: item.pie || `${nombre} · ${i + 1}` };
}

// =========================================
// Sonido de hojas (opcional, apagado por defecto)
// Se genera con Web Audio, no necesita archivos.
// =========================================
const Sonido = {
  activo: false,
  ctx: null,
  cargar() {
    try { this.activo = localStorage.getItem('sonidoHojas') === 'si'; } catch (e) { this.activo = false; }
  },
  guardar() {
    try { localStorage.setItem('sonidoHojas', this.activo ? 'si' : 'no'); } catch (e) { /* sin almacenamiento */ }
  },
  hoja(intensidad = 1) {
    if (!this.activo) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.ctx;
      const duracion = 0.28;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duracion, ctx.sampleRate);
      const datos = buffer.getChannelData(0);
      for (let i = 0; i < datos.length; i++) {
        const t = i / datos.length;
        // ruido con pequeños "crujidos" para que suene a papel
        datos[i] = (Math.random() * 2 - 1) * (Math.random() < 0.08 ? 1 : 0.35) * Math.pow(1 - t, 2);
      }
      const fuente = ctx.createBufferSource();
      fuente.buffer = buffer;
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'bandpass';
      filtro.frequency.value = 2600 + Math.random() * 1200;
      filtro.Q.value = 0.7;
      const volumen = ctx.createGain();
      volumen.gain.setValueAtTime(0.0001, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.16 * intensidad, ctx.currentTime + 0.03);
      volumen.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracion);
      fuente.connect(filtro).connect(volumen).connect(ctx.destination);
      fuente.start();
    } catch (e) { /* el navegador no soporta audio */ }
  }
};

function iniciarSonido() {
  Sonido.cargar();
  const boton = document.getElementById('btn-sonido');
  if (!boton) return;
  const pintar = () => {
    boton.setAttribute('aria-pressed', String(Sonido.activo));
    boton.title = Sonido.activo ? 'Sonido de hojas (encendido)' : 'Sonido de hojas (apagado)';
  };
  pintar();
  boton.addEventListener('click', () => {
    Sonido.activo = !Sonido.activo;
    Sonido.guardar();
    pintar();
    Sonido.hoja();
  });

  // Al cambiar de pestaña suena la hoja y luego se navega
  document.querySelectorAll('.pestana:not(.pestana-activa)').forEach(tab => {
    tab.addEventListener('click', (e) => {
      if (!Sonido.activo || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      Sonido.hoja();
      setTimeout(() => { window.location.href = tab.href; }, 140);
    });
  });
}

// =========================================
// Carruseles dentro de la carpeta
// =========================================
function iniciarCarrusel(carrusel) {
  const pista = carrusel.querySelector('.carrusel-pista');
  const anterior = carrusel.querySelector('.anterior');
  const siguiente = carrusel.querySelector('.siguiente');
  if (!pista) return;

  const paso = () => {
    const item = pista.firstElementChild;
    if (!item) return pista.clientWidth * 0.8;
    const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
    return item.getBoundingClientRect().width + gap;
  };

  const actualizar = () => {
    const max = pista.scrollWidth - pista.clientWidth - 2;
    const hayScroll = max > 0;
    carrusel.classList.toggle('sin-scroll', !hayScroll);
    if (anterior) anterior.disabled = pista.scrollLeft <= 2;
    if (siguiente) siguiente.disabled = pista.scrollLeft >= max;
  };

  carrusel.querySelectorAll('.carrusel-flecha').forEach(boton => {
    boton.addEventListener('click', () => {
      pista.scrollBy({ left: paso() * Number(boton.dataset.dir), behavior: REDUCIR_MOVIMIENTO ? 'auto' : 'smooth' });
      Sonido.hoja(0.6);
    });
  });

  pista.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); pista.scrollBy({ left: paso(), behavior: 'smooth' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); pista.scrollBy({ left: -paso(), behavior: 'smooth' }); }
  });

  pista.addEventListener('scroll', actualizar, { passive: true });
  new ResizeObserver(actualizar).observe(pista);
  new MutationObserver(actualizar).observe(pista, { childList: true });
  actualizar();
}

// =========================================
// Lightbox (galería e imágenes de proyectos)
// =========================================
const Lightbox = {
  dialogo: null,
  items: [],
  indice: 0,
  crear() {
    if (this.dialogo) return;
    const d = el('dialog', 'lightbox');
    d.setAttribute('aria-label', 'Imagen ampliada');
    d.innerHTML = `
      <figure class="lightbox-polaroid">
        <img class="lightbox-img" alt="">
        <figcaption class="lightbox-pie"></figcaption>
      </figure>
      <button type="button" class="lightbox-btn lightbox-cerrar" aria-label="Cerrar">✕</button>
      <button type="button" class="lightbox-btn lightbox-anterior" aria-label="Imagen anterior">‹</button>
      <button type="button" class="lightbox-btn lightbox-siguiente" aria-label="Imagen siguiente">›</button>
      <span class="lightbox-contador" aria-live="polite"></span>`;
    document.body.append(d);
    this.dialogo = d;

    d.querySelector('.lightbox-cerrar').addEventListener('click', () => this.cerrar());
    d.querySelector('.lightbox-anterior').addEventListener('click', () => this.mover(-1));
    d.querySelector('.lightbox-siguiente').addEventListener('click', () => this.mover(1));
    d.addEventListener('click', (e) => { if (e.target === d) this.cerrar(); });
    d.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.mover(1);
      if (e.key === 'ArrowLeft') this.mover(-1);
    });

    // Deslizar con el dedo
    let inicioX = null;
    d.addEventListener('pointerdown', (e) => { inicioX = e.clientX; });
    d.addEventListener('pointerup', (e) => {
      if (inicioX === null) return;
      const dx = e.clientX - inicioX;
      if (Math.abs(dx) > 50) this.mover(dx < 0 ? 1 : -1);
      inicioX = null;
    });
  },
  abrir(items, indice) {
    this.crear();
    this.items = items;
    this.indice = indice;
    this.pintar();
    this.dialogo.showModal();
    document.documentElement.classList.add('lightbox-abierto');
    Sonido.hoja(0.7);
    this.dialogo.addEventListener('close', () => document.documentElement.classList.remove('lightbox-abierto'), { once: true });
  },
  cerrar() { this.dialogo?.close(); },
  mover(dir) {
    if (this.items.length < 2) return;
    this.indice = (this.indice + dir + this.items.length) % this.items.length;
    this.pintar();
    Sonido.hoja(0.5);
  },
  pintar() {
    const item = this.items[this.indice];
    const img = this.dialogo.querySelector('.lightbox-img');
    img.src = item.src;
    img.alt = item.pie || '';
    this.dialogo.querySelector('.lightbox-pie').textContent = item.pie || '';
    this.dialogo.querySelector('.lightbox-contador').textContent =
      this.items.length > 1 ? `${this.indice + 1} / ${this.items.length}` : '';
    const varias = this.items.length > 1;
    this.dialogo.querySelector('.lightbox-anterior').hidden = !varias;
    this.dialogo.querySelector('.lightbox-siguiente').hidden = !varias;
  }
};

function polaroid(item, i, lista, clase = '') {
  const boton = el('button', `polaroid ${clase}`);
  boton.type = 'button';
  boton.setAttribute('aria-label', `Ver en grande: ${item.pie}`);
  const marco = el('span', 'polaroid-foto');
  marco.append(imagen(item.src, ''));
  boton.append(marco, el('span', 'polaroid-pie', item.pie));
  boton.addEventListener('click', () => Lightbox.abrir(lista, i));
  return boton;
}

// =========================================
// Portada que se abre (solo en el inicio)
// =========================================
function iniciarPortada() {
  const portada = document.getElementById('portada');
  const tapa = document.getElementById('portada-tapa');
  if (!portada || !tapa) return;

  if (document.documentElement.classList.contains('portada-vista')) {
    portada.remove();
    return;
  }

  document.querySelector('.carpeta').setAttribute('inert', '');
  document.querySelector('.pestanas').setAttribute('inert', '');

  const abrir = () => {
    if (portada.classList.contains('abriendo')) return;
    portada.classList.add('abriendo');
    Sonido.hoja(1.2);
    try { sessionStorage.setItem('portadaVista', '1'); } catch (e) { /* sin almacenamiento */ }
    const terminar = () => {
      portada.remove();
      document.querySelector('.carpeta').removeAttribute('inert');
      document.querySelector('.pestanas').removeAttribute('inert');
      document.getElementById('titulo-inicio')?.focus({ preventScroll: true });
    };
    if (REDUCIR_MOVIMIENTO) terminar();
    else setTimeout(terminar, 950);
  };

  tapa.addEventListener('click', abrir);
}

// =========================================
// Bolsillo con el CV (Sobre mí)
// =========================================
function iniciarBolsillo() {
  const bolsillo = document.getElementById('bolsillo');
  const hoja = document.getElementById('hoja-cv');
  const boton = document.getElementById('btn-bolsillo');
  if (!bolsillo || !hoja || !boton) return;

  const alternar = () => {
    const sacado = bolsillo.classList.toggle('sacado');
    boton.setAttribute('aria-expanded', String(sacado));
    boton.textContent = sacado ? 'Guardar mi CV' : 'Sacar mi CV';
    Sonido.hoja();
  };

  boton.addEventListener('click', alternar);
  bolsillo.addEventListener('click', (e) => {
    if (!bolsillo.classList.contains('sacado') && !e.target.closest('a')) alternar();
  });
}

// =========================================
// Cuenta de proyectos en cada carpeta (Proyectos)
// =========================================
async function contarProyectos() {
  try {
    const datos = await obtenerProyectos();
    document.querySelectorAll('[data-cuenta]').forEach(span => {
      const n = (datos[span.dataset.cuenta] || []).length;
      span.textContent = n === 1 ? '1 hoja' : `${n} hojas`;
    });
  } catch (e) { /* sin cuenta */ }
}

// =========================================
// Listas (Web, Apps, Videojuegos) como hojas sueltas
// =========================================
async function cargarLista(categoria) {
  const contenedor = document.getElementById('grid-dinamico');
  if (!contenedor) return;

  let proyectos;
  try {
    const datos = await obtenerProyectos();
    proyectos = datos[categoria] || [];
  } catch (e) {
    mensajeVacio(contenedor, 'No se pudieron cargar los proyectos. Intenta recargar la página.');
    return;
  }

  if (!proyectos.length) {
    mensajeVacio(contenedor, 'Muy pronto habrá proyectos aquí.');
    return;
  }

  proyectos.forEach((proyecto, i) => {
    const esWeb = categoria === 'web';
    const sujetador = SUJETADORES[i % SUJETADORES.length];
    const inclinacion = i % 2 ? 'inclinado-der' : 'inclinado-izq';
    const hoja = el('article', `hoja hoja-proyecto sujeta ${sujetador} ${inclinacion}`);

    const s = sello(proyecto.sello);
    if (s) hoja.append(s);

    // La captura principal como polaroid
    const foto = el('div', 'polaroid polaroid-fija');
    const marco = el('span', 'polaroid-foto');
    marco.append(imagen(proyecto.imagen, ''));
    foto.append(marco);
    hoja.append(foto);

    const titulo = el('h2', 'proyecto-titulo');
    if (esWeb) {
      titulo.textContent = proyecto.nombre;
    } else {
      const enlace = el('a', 'enlace-hoja', proyecto.nombre);
      enlace.href = `proyecto-detalle.html?id=${encodeURIComponent(proyecto.id)}&cat=${encodeURIComponent(categoria)}`;
      titulo.append(enlace);
    }
    hoja.append(titulo);

    if (proyecto.descripcion) hoja.append(el('p', 'proyecto-texto', proyecto.descripcion));

    if (proyecto.lenguajes?.length) {
      const chips = el('ul', 'chips chips-chicos');
      proyecto.lenguajes.forEach(l => chips.append(chipTecnologia(l)));
      hoja.append(chips);
    }

    const acciones = el('div', 'proyecto-acciones');
    if (esWeb && proyecto.enlace_externo) acciones.append(enlaceExterno(proyecto.enlace_externo, 'Visitar ↗', 'enlace-accion'));
    if (proyecto.repositorio) acciones.append(enlaceExterno(proyecto.repositorio, 'Código', 'enlace-accion'));
    if (!esWeb) {
      const ver = el('span', 'enlace-accion falso', 'Ver detalle →');
      ver.setAttribute('aria-hidden', 'true');
      acciones.append(ver);
    }
    if (acciones.children.length) hoja.append(acciones);

    contenedor.append(hoja);
  });
}

// =========================================
// Vista de detalle (proyecto-detalle.html)
// =========================================
async function cargarDetalle() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const cat = params.get('cat');
  const titulo = document.getElementById('titulo-dinamico');
  const descripcion = document.getElementById('descripcion-dinamica');

  const volver = document.getElementById('btn-volver');
  const paginas = { web: 'web.html', app: 'apps.html', videojuego: 'videojuegos.html' };
  if (volver && paginas[cat]) volver.href = paginas[cat];

  let proyecto;
  try {
    const datos = await obtenerProyectos();
    proyecto = (datos[cat] || []).find(p => p.id === id);
  } catch (e) { /* se muestra el mensaje de abajo */ }

  if (!proyecto) {
    titulo.textContent = 'Proyecto no encontrado';
    descripcion.textContent = 'Puede que el enlace esté incompleto. Vuelve a la lista de proyectos.';
    return;
  }

  document.title = `${proyecto.nombre} | Estefanía Hernández`;
  titulo.textContent = proyecto.nombre;
  descripcion.textContent = proyecto.descripcion || '';

  const s = sello(proyecto.sello);
  if (s) document.getElementById('sello-dinamico').replaceWith(s);

  const chips = document.getElementById('lenguajes-dinamicos');
  (proyecto.lenguajes || []).forEach(l => chips.append(chipTecnologia(l)));

  const acciones = document.getElementById('acciones-dinamicas');
  if (proyecto.enlace_externo) acciones.append(enlaceExterno(proyecto.enlace_externo, 'Probarlo ↗', 'enlace-accion'));
  if (proyecto.repositorio) acciones.append(enlaceExterno(proyecto.repositorio, 'Ver código en GitHub', 'enlace-accion'));

  const capturas = (proyecto.imagenes_detalle || []).map((c, i) => captura(c, i, proyecto.nombre));
  if (capturas.length) {
    document.getElementById('bloque-capturas').hidden = false;
    const pista = document.getElementById('multimedia-dinamica');
    capturas.forEach((c, i) => pista.append(polaroid(c, i, capturas, i % 2 ? 'inclinado-der' : 'inclinado-izq')));
  }

  if (proyecto.video_url) {
    const marco = document.getElementById('video-dinamico');
    const iframe = el('iframe');
    iframe.src = proyecto.video_url;
    iframe.title = `Video de ${proyecto.nombre}`;
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    marco.append(iframe);
    marco.hidden = false;
  }
}

// =========================================
// Galería de ilustraciones (polaroids + lightbox)
// =========================================
async function cargarGaleria() {
  const contenedor = document.getElementById('galeria-dinamica');
  if (!contenedor) return;

  let ilustraciones;
  try {
    const datos = await obtenerProyectos();
    ilustraciones = datos.ilustracion || [];
  } catch (e) {
    mensajeVacio(contenedor, 'No se pudo cargar la galería. Intenta recargar la página.');
    return;
  }
  if (!ilustraciones.length) {
    mensajeVacio(contenedor, 'Muy pronto habrá ilustraciones aquí.');
    return;
  }

  const items = ilustraciones.map(ilu => ({ src: ilu.imagen, pie: ilu.nombre }));
  items.forEach((item, i) => {
    const p = polaroid(item, i, items, i % 2 ? 'inclinado-der' : 'inclinado-izq');
    const s = sello(ilustraciones[i].sello);
    if (s) p.append(s);
    contenedor.append(p);
  });
}

// =========================================
// Contacto: tarjeta que se voltea + formulario
// =========================================
function iniciarContacto() {
  const tarjeta = document.getElementById('tarjeta-giro');
  const frente = document.getElementById('cara-frente');
  const reverso = document.getElementById('cara-reverso');

  if (tarjeta) {
    tarjeta.querySelectorAll('[data-voltear]').forEach(boton => {
      boton.addEventListener('click', () => {
        const volteada = tarjeta.classList.toggle('volteada');
        frente.toggleAttribute('inert', volteada);
        reverso.toggleAttribute('inert', !volteada);
        Sonido.hoja();
        setTimeout(() => {
          (volteada ? reverso.querySelector('input') : frente.querySelector('[data-voltear]'))?.focus({ preventScroll: true });
        }, REDUCIR_MOVIMIENTO ? 0 : 450);
      });
    });
  }

  const form = document.getElementById('form-contacto');
  const estado = document.getElementById('form-estado');
  if (!form) return;

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    estado.className = 'form-estado';

    if (!form.checkValidity()) {
      estado.textContent = 'Revisa que tu nombre, correo y mensaje estén completos.';
      estado.classList.add('es-error');
      form.querySelector(':invalid')?.focus();
      return;
    }

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    estado.textContent = 'Enviando…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.value.trim(),
          email: form.email.value.trim(),
          mensaje: form.mensaje.value.trim()
        })
      });
      if (!res.ok) throw new Error();
      form.reset();
      estado.textContent = '¡Gracias! Tu mensaje llegó, te responderé pronto.';
      estado.classList.add('es-exito');
    } catch (e) {
      estado.textContent = 'No se pudo enviar. Inténtalo más tarde o escríbeme por LinkedIn.';
      estado.classList.add('es-error');
    } finally {
      boton.disabled = false;
    }
  });
}

// =========================================
// Arranque común a todas las páginas
// =========================================
iniciarSonido();

// En celular el post-it pasa al final del contenido para no tapar nada
if (window.matchMedia('(max-width: 768px)').matches) {
  const nota = document.querySelector('.carpeta-scroll > .postit');
  const destino = document.querySelector('.contenido-carpeta');
  if (nota && destino) destino.append(nota);
}

document.querySelectorAll('[data-carrusel]').forEach(iniciarCarrusel);

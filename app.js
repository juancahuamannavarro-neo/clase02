const API_BASE = 'http://127.0.0.1:8000';
let loggedInEmail = null;

const protectedTabs = ['servicios', 'mascotas', 'reporte'];

const dom = {
  navLinks: document.querySelectorAll('.sidebar-nav a'),
  sections: document.querySelectorAll('.section'),
  sidebarItems: document.querySelectorAll('.sidebar-nav li'),
  userBadge: document.querySelector('.user-name'),
  logoutBtn: document.querySelector('.btn-logout'),
  serviciosList: document.querySelector('#servicios-list'),
  mascotaServicioSelect: document.querySelector('#mascota-servicio'),
  mascotasList: document.querySelector('#mascotas-list'),
  reporteResultados: document.querySelector('#reporte-resultados'),
  reporteCorreoInput: document.querySelector('#buscador-correo'),
  btnBuscarReporte: document.querySelector('#btn-buscar-reporte'),
  formGreeting: document.querySelector('.greeting-form'),
  formRegistro: document.querySelector('.registro-form'),
  formLogin: document.querySelector('.login-form'),
  formAgregarServicio: document.querySelector('.agregar-servicio-form'),
  formRegistrarMascota: document.querySelector('.registrar-mascota-form'),
};

function showAlert(container, message, type = 'success', duration = 3500) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.prepend(alert);

  setTimeout(() => {
    alert.remove();
  }, duration);
}

function setProtectedTabs(enabled) {
  dom.sidebarItems.forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const tab = a.dataset.tab;
    if (protectedTabs.includes(tab)) {
      if (enabled) {
        li.classList.remove('locked');
      } else {
        li.classList.add('locked');
      }
    }
  });
}

function updateAuthUI() {
  if (loggedInEmail) {
    dom.userBadge.textContent = loggedInEmail;
    dom.logoutBtn.style.display = 'block';
  } else {
    dom.userBadge.textContent = 'Usuario';
    dom.logoutBtn.style.display = 'none';
  }
}

function isTabProtected(name) {
  return protectedTabs.includes(name);
}

function switchTab(name) {
  const targetSection = document.getElementById(name);
  if (!targetSection) return;

  if (isTabProtected(name) && !loggedInEmail) {
    const active = document.querySelector('.section.active') || targetSection;
    showAlert(active, 'Debes iniciar sesión para acceder a esta sección', 'error');
    return;
  }

  dom.sections.forEach((section) => {
    section.classList.remove('active');
  });

  targetSection.classList.add('active');

  if (name === 'reporte' && loggedInEmail) {
    dom.reporteCorreoInput.value = loggedInEmail;
    loadReporte(loggedInEmail);
  }

  if (name === 'mascotas' && loggedInEmail) {
    loadMascotas(loggedInEmail);
  }

  if (name === 'servicios') {
    loadServicios();
  }
}

function logout() {
  loggedInEmail = null;
  setProtectedTabs(false);
  updateAuthUI();
  switchTab('acceso');
  clearDataViews();
}

function clearDataViews() {
  if (dom.mascotasList) dom.mascotasList.innerHTML = '';
  if (dom.reporteResultados) dom.reporteResultados.innerHTML = '';
}

async function fetchJSON(url, options = {}) {
  try {
    const resp = await fetch(url, options);
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data?.mensaje || data?.detail || 'Error en la petición');
    }
    return data;
  } catch (error) {
    throw error;
  }
}

async function loadServicios() {
  try {
    const { servicios } = await fetchJSON(`${API_BASE}/servicios`);

    if (Array.isArray(servicios)) {
      dom.serviciosList.innerHTML = '';
      dom.mascotaServicioSelect.innerHTML = '<option value="">Selecciona un servicio</option>';

      servicios.forEach((servicio) => {
        const li = document.createElement('li');
        li.textContent = `${servicio.nombre} - $${Number(servicio.precio).toFixed(2)}`;
        dom.serviciosList.appendChild(li);

        const opt = document.createElement('option');
        opt.value = servicio.nombre;
        opt.textContent = `${servicio.nombre} ($${Number(servicio.precio).toFixed(2)})`;
        dom.mascotaServicioSelect.appendChild(opt);
      });
    }
  } catch (error) {
    const section = document.getElementById('servicios');
    showAlert(section, `No se pudo cargar los servicios: ${error.message}`, 'error');
  }
}

async function loadMascotas(correo) {
  if (!correo) return;
  try {
    const { mascotas } = await fetchJSON(`${API_BASE}/mascotas/${encodeURIComponent(correo)}`);

    dom.mascotasList.innerHTML = '';

    if (!Array.isArray(mascotas) || mascotas.length === 0) {
      const noData = document.createElement('p');
      noData.textContent = 'No hay mascotas registradas para este correo.';
      dom.mascotasList.appendChild(noData);
      return;
    }

    mascotas.forEach((mascota) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h4>${mascota.nombre || 'Sin nombre'}</h4>
        <p><strong>Correo:</strong> ${mascota.correo || correo}</p>
        <p><strong>Servicio:</strong> ${mascota.tipo_servicio || mascota.servicio || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${mascota.fecha || 'N/A'}</p>
      `;
      dom.mascotasList.appendChild(card);
    });
  } catch (error) {
    const section = document.getElementById('mascotas');
    showAlert(section, `No se pudo cargar las mascotas: ${error.message}`, 'error');
  }
}

async function loadReporte(correo) {
  if (!correo) return;
  try {
    const reporte = await fetchJSON(`${API_BASE}/reporte/${encodeURIComponent(correo)}`);

    dom.reporteResultados.innerHTML = '';

    const stats = document.createElement('div');
    stats.className = 'report-stats';
    stats.innerHTML = `
      <div class="card">
        <h4>Cantidad de servicios</h4>
        <p>${reporte.cantidad_servicios ?? 0}</p>
      </div>
      <div class="card">
        <h4>Total gastado</h4>
        <p>$${Number(reporte.total_gastado ?? 0).toFixed(2)}</p>
      </div>
      <div class="card">
        <h4>Correo</h4>
        <p>${reporte.correo || correo}</p>
      </div>
    `;

    dom.reporteResultados.appendChild(stats);

    const servicios = reporte.servicios || [];
    if (servicios.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'report-tags';
      tags.style.marginTop = '0.75rem';
      tags.innerHTML = '<strong>Servicios usados:</strong>';

      const tagList = document.createElement('div');
      tagList.style.display = 'flex';
      tagList.style.flexWrap = 'wrap';
      tagList.style.gap = '0.5rem';
      tagList.style.marginTop = '0.5rem';

      servicios.forEach((serv) => {
        const span = document.createElement('span');
        span.textContent = serv;
        span.style.padding = '0.3rem 0.6rem';
        span.style.borderRadius = '999px';
        span.style.background = 'rgba(14,165,160,0.15)';
        span.style.color = '#065f46';
        span.style.fontSize = '0.85rem';
        tagList.appendChild(span);
      });

      tags.appendChild(tagList);
      dom.reporteResultados.appendChild(tags);
    }
  } catch (error) {
    const section = document.getElementById('reporte');
    showAlert(section, `No se pudo cargar el reporte: ${error.message}`, 'error');
  }
}

async function handleGreeting(event) {
  event.preventDefault();
  const input = document.querySelector('#nombre-usuario');
  const nombre = input.value.trim();
  if (!nombre) return;

  try {
    const data = await fetchJSON(`${API_BASE}/bienvenido/${encodeURIComponent(nombre)}`);
    showAlert(document.getElementById('inicio'), data.mensaje || `¡Hola ${nombre}!`, 'success');
    input.value = '';
  } catch (error) {
    showAlert(document.getElementById('inicio'), `Error: ${error.message}`, 'error');
  }
}

async function handleRegistro(event) {
  event.preventDefault();
  const correo = document.querySelector('#reg-email').value.trim();
  const contrasena = document.querySelector('#reg-password').value.trim();
  if (!correo || !contrasena) return;

  try {
    const data = await fetchJSON(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena }),
    });

    showAlert(document.getElementById('acceso'), data.mensaje || 'Registro exitoso', 'success');
    event.target.reset();
  } catch (error) {
    showAlert(document.getElementById('acceso'), `Error: ${error.message}`, 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const correo = document.querySelector('#login-email').value.trim();
  const contrasena = document.querySelector('#login-password').value.trim();
  if (!correo || !contrasena) return;

  try {
    const data = await fetchJSON(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena }),
    });

    loggedInEmail = correo;
    setProtectedTabs(true);
    updateAuthUI();
    showAlert(document.getElementById('acceso'), data.mensaje || 'Inicio de sesión correcto', 'success');
    event.target.reset();
    switchTab('servicios');
  } catch (error) {
    showAlert(document.getElementById('acceso'), `Error: ${error.message}`, 'error');
  }
}

async function handleAgregarServicio(event) {
  event.preventDefault();
  const nombre = document.querySelector('#servicio-nombre').value.trim();
  const precio = document.querySelector('#servicio-precio').value.trim();
  if (!nombre || !precio) return;

  try {
    const data = await fetchJSON(`${API_BASE}/agregar-servicio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, precio: Number(precio) }),
    });

    showAlert(document.getElementById('servicios'), data.mensaje || 'Servicio agregado', 'success');
    event.target.reset();
    await loadServicios();
  } catch (error) {
    showAlert(document.getElementById('servicios'), `Error: ${error.message}`, 'error');
  }
}

async function handleRegistrarMascota(event) {
  event.preventDefault();
  const correo = document.querySelector('#mascota-correo').value.trim();
  const nombre = document.querySelector('#mascota-nombre').value.trim();
  const tipo_servicio = document.querySelector('#mascota-servicio').value.trim();
  const fecha = document.querySelector('#mascota-fecha').value;

  if (!correo || !nombre || !tipo_servicio || !fecha) return;

  try {
    const data = await fetchJSON(`${API_BASE}/registrar-mascota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, nombre, tipo_servicio, fecha }),
    });

    showAlert(document.getElementById('mascotas'), data.mensaje || 'Mascota registrada', 'success');
    event.target.reset();
    if (correo === loggedInEmail) {
      loadMascotas(correo);
    }
  } catch (error) {
    showAlert(document.getElementById('mascotas'), `Error: ${error.message}`, 'error');
  }
}

async function handleBuscarReporte(event) {
  event.preventDefault();
  const correo = dom.reporteCorreoInput.value.trim();
  if (!correo) {
    showAlert(document.getElementById('reporte'), 'Ingresa un correo para buscar el reporte', 'error');
    return;
  }
  await loadReporte(correo);
}

function attachListeners() {
  dom.navLinks.forEach((a) => {
    a.addEventListener('click', (event) => {
      event.preventDefault();
      const tab = a.dataset.tab;
      switchTab(tab);
    });
  });

  dom.logoutBtn.addEventListener('click', logout);

  dom.formGreeting.addEventListener('submit', handleGreeting);
  dom.formRegistro.addEventListener('submit', handleRegistro);
  dom.formLogin.addEventListener('submit', handleLogin);
  dom.formAgregarServicio.addEventListener('submit', handleAgregarServicio);
  dom.formRegistrarMascota.addEventListener('submit', handleRegistrarMascota);

  dom.btnBuscarReporte.addEventListener('click', handleBuscarReporte);

  dom.reporteCorreoInput.addEventListener('focus', () => {
    if (loggedInEmail) dom.reporteCorreoInput.value = loggedInEmail;
  });
}

function init() {
  setProtectedTabs(false);
  updateAuthUI();
  attachListeners();
  switchTab('inicio');
  loadServicios();
}

init();

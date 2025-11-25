/*
  Cambios principales:
  - API_URL dinámico para evitar 404 por ruta relativa incorrecta.
  - normalizeFestivos devuelve objetos {diaFestivo, definicion}.
  - buildHtml respeta los inputs existentes en index_evg.html y sólo rellena tbody.
  - crearFestivo envía definicion.
  - handlers para btnCrearFestivo / btnBorrarTodosFestivos usan las funciones existentes.
*/

/**
 * Controlador cliente para gestión de festivos (formulario inline).
 * Usa API REST existente en php/api/controllers/festivos.php (JSON bodies).
 */
const API_URL = 'php/api/index.php?controller=festivos&public=1';

function mostrarFeedback(msg, tipo = 'info') {
  const fb = document.getElementById('festivosMsg');
  if (!fb) return;
  fb.innerHTML = `<div class="alert alert-${tipo}" role="alert">${msg}</div>`;
  setTimeout(() => { fb.innerHTML = ''; }, 3500);
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, Object.assign({ credentials: 'same-origin' }, opts));
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${t || res.statusText}`);
  }
  return res.json().catch(() => ({}));
}

async function cargarFestivos() {
  try {
    const data = await fetchJson(API_URL);
    renderTabla(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
    mostrarFeedback('Error cargando festivos', 'danger');
  }
}

function formatDisplayISO(iso) {
  if (!iso) return '';
  const p = String(iso).split('-');
  if (p.length !== 3) return iso;
  return `${p[2].padStart(2,'0')}/${p[1].padStart(2,'0')}/${p[0]}`;
}

function renderTabla(items) {
  const tabla = document.getElementById('tablaFestivos');
  if (!tabla) return;
  let tbody = tabla.querySelector('tbody');
  if (!tbody) {
    tbody = document.createElement('tbody');
    tabla.appendChild(tbody);
  }
  tbody.innerHTML = '';
  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3"><em>No hay festivos registrados.</em></td></tr>';
    return;
  }
  for (const f of items) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-fecha', f.diaFestivo ?? f.fecha ?? f.fechaFest ?? '');
    tr.innerHTML = `<td>${escapeHtml(formatDisplayISO(f.diaFestivo ?? f.fecha ?? f.fechaFest ?? ''))}</td>
                    <td>${escapeHtml(f.definicion ?? f.descripcion ?? '')}</td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary btn-edit-festivo" data-fecha="${escapeHtml(f.diaFestivo ?? f.fecha ?? '')}" data-definicion="${escapeHtml(f.definicion ?? f.descripcion ?? '')}">Editar</button>
                      <button class="btn btn-sm btn-outline-danger btn-delete-festivo" data-fecha="${escapeHtml(f.diaFestivo ?? f.fecha ?? '')}">Eliminar</button>
                    </td>`;
    tbody.appendChild(tr);
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function isValidISODate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + 'T00:00:00').getTime());
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('gestionFestivos')) return;

  // soportar dos variantes del HTML: formulario compacto (formFestivo) o inputs sueltos (nuevoFestivo ...)
  const form = document.getElementById('formFestivo');
  const inputFecha = document.getElementById('festivoFecha') || document.getElementById('nuevoFestivo');
  const inputDesc = document.getElementById('festivoDescripcion') || document.getElementById('nuevoFestivoDescripcion');
  const inputId = document.getElementById('festivoId'); // opcional: oldFecha cuando editamos
  const btnCancelar = document.getElementById('btnCancelarEdicion');
  const btnMostrarConfirm = document.getElementById('btnMostrarConfirmBorrarTodos');
  const divConfirm = document.getElementById('confirmBorrarTodos');
  const btnConfirmSi = document.getElementById('btnConfirmBorrarTodosSi');
  const btnConfirmNo = document.getElementById('btnConfirmBorrarTodosNo');
  const tabla = document.getElementById('tablaFestivos');
  // botones del layout de index_evg.html
  const btnCrearSimple = document.getElementById('btnCrearFestivo');
  const btnBorrarTodosSimple = document.getElementById('btnBorrarTodosFestivos');

  // inicializar listado
  cargarFestivos();

  // delegación para botones Editar / Eliminar dentro de la tabla
  if (tabla) {
    tabla.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      if (btn.classList.contains('btn-edit-festivo')) {
        const fecha = btn.getAttribute('data-fecha');
        const definicion = btn.getAttribute('data-definicion') || '';
        abrirEdicion(fecha, definicion);
      } else if (btn.classList.contains('btn-delete-festivo')) {
        const fecha = btn.getAttribute('data-fecha');
        if (!fecha) return;
        // pedir confirmación visual simple
        if (!confirm(`Borrar festivo ${formatDisplayISO(fecha)} ?`)) return;
        borrarFestivo(fecha);
      }
    });
  }

  function abrirEdicion(fecha, definicion) {
    if (!fecha) return;
    // Si no existe inputFecha/similares, evitar errores
    if (inputFecha) {
      inputFecha.value = fecha;
      // guardar fecha antigua en dataset para el layout compacto
      inputFecha.dataset.oldFecha = fecha;
    }
    if (inputDesc) inputDesc.value = definicion || '';
    if (inputId) inputId.value = fecha; // si existe el form completo
    if (btnCancelar) btnCancelar.classList.remove('d-none');
    if (inputFecha) inputFecha.focus();
  }

  function resetForm() {
    if (form) form.reset();
    if (inputFecha) {
      inputFecha.removeAttribute('data-old-fecha');
      // si no hay form debería limpiar el valor (opcional)
      inputFecha.value = '';
    }
    if (inputDesc) inputDesc.value = '';
    if (inputId) inputId.value = '';
    if (btnCancelar) btnCancelar.classList.add('d-none');
  }

  // submit: crear o modificar según inputId
  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fecha = inputFecha.value;
      // descripción NO obligatoria
      const descripcion = (inputDesc.value || '').trim();
      if (!fecha) {
        mostrarFeedback('Fecha obligatoria', 'warning');
        return;
      }
      if (!isValidISODate(fecha)) {
        mostrarFeedback('Fecha debe ser YYYY-MM-DD', 'warning');
        return;
      }
      try {
        if (inputId.value) {
          // PUT: oldFecha + fecha + definicion (definicion puede estar vacía)
          const payload = { oldFecha: inputId.value, fecha, definicion: descripcion };
          await fetchJson(API_URL, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          mostrarFeedback('Festivo modificado', 'success');
        } else {
          // POST: fecha + definicion (definicion puede estar vacía)
          const payload = { fecha, definicion: descripcion };
          await fetchJson(API_URL, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          mostrarFeedback('Festivo creado', 'success');
        }
        resetForm();
        cargarFestivos();
      } catch (e) {
        console.error(e);
        mostrarFeedback('Error guardando festivo', 'danger');
      }
    });
  }

  if (btnCancelar) btnCancelar.addEventListener('click', (ev) => { ev.preventDefault(); resetForm(); });

  // Borrar todos — confirm in-page
  if (btnMostrarConfirm && divConfirm) btnMostrarConfirm.addEventListener('click', () => divConfirm.classList.toggle('d-none'));
  if (btnConfirmNo && divConfirm) btnConfirmNo.addEventListener('click', () => divConfirm.classList.add('d-none'));
  if (btnConfirmSi) {
    btnConfirmSi.addEventListener('click', async () => {
      try {
        await fetchJson(API_URL, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ borrarTodos: true }) });
        mostrarFeedback('Todos los festivos borrados', 'success');
        divConfirm.classList.add('d-none');
        cargarFestivos();
      } catch (e) {
        console.error(e);
        mostrarFeedback('Error borrando todos', 'danger');
      }
    });
  }

  // borrar individual
  async function borrarFestivo(fecha) {
    try {
      await fetchJson(API_URL, { method: 'DELETE', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ fecha }) });
      mostrarFeedback('Festivo eliminado', 'success');
      cargarFestivos();
    } catch (e) {
      console.error(e);
      mostrarFeedback('Error eliminando festivo', 'danger');
    }
  }

  // Handlers para los controles simples de index_evg.html
  if (btnCrearSimple && inputFecha) {
    btnCrearSimple.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const fecha = inputFecha.value;
      const descripcion = (inputDesc && inputDesc.value) ? inputDesc.value.trim() : '';
      if (!fecha) {
        mostrarFeedback('Fecha obligatoria', 'warning');
        return;
      }
      if (!isValidISODate(fecha)) {
        mostrarFeedback('Fecha debe ser YYYY-MM-DD', 'warning');
        return;
      }
      try {
        // Si existe data-old-fecha hacemos PUT (editar), si no POST (crear)
        const oldFecha = inputFecha.dataset ? inputFecha.dataset.oldFecha : null;
        if (oldFecha) {
          const payload = { oldFecha: oldFecha, fecha, definicion: descripcion };
          await fetchJson(API_URL, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          mostrarFeedback('Festivo modificado', 'success');
        } else {
          const payload = { fecha, definicion: descripcion };
          await fetchJson(API_URL, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          mostrarFeedback('Festivo creado', 'success');
        }
        // limpiar campos si existen
        resetForm();
        cargarFestivos();
      } catch (e) {
        console.error(e);
        mostrarFeedback('Error guardando festivo', 'danger');
      }
    });
  }

  if (btnBorrarTodosSimple) {
    btnBorrarTodosSimple.addEventListener('click', async () => {
      if (!confirm('¿Borrar todos los festivos?')) return;
      try {
        await fetchJson(API_URL, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ borrarTodos: true }) });
        mostrarFeedback('Todos los festivos borrados', 'success');
        cargarFestivos();
      } catch (e) {
        console.error(e);
        mostrarFeedback('Error borrando todos', 'danger');
      }
    });
  }

});
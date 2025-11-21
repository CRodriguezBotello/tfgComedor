/*
  Cambios principales:
  - API_URL dinámico para evitar 404 por ruta relativa incorrecta.
  - normalizeFestivos devuelve objetos {diaFestivo, definicion}.
  - buildHtml respeta los inputs existentes en index_evg.html y sólo rellena tbody.
  - crearFestivo envía definicion.
  - handlers para btnCrearFestivo / btnBorrarTodosFestivos usan las funciones existentes.
*/

const API_URL = (function(){
  // construye URL absoluta basada en la ruta actual (evita problemas con subcarpetas)
  const basePath = window.location.pathname.replace(/\/[^\/]*$/, '/'); // /hugo/Comedor18-11-2025/
  return `${window.location.origin}${basePath}php/api/index.php?controller=festivos&public=1`;
})();

async function fetchFestivos() {
  try {
    const res = await fetch(API_URL, { credentials: 'same-origin' });
    const text = await res.text();

    if (!res.ok) {
      console.error('fetchFestivos - respuesta no OK:', res.status, res.statusText, text);
      const msg = document.getElementById('festivosMsg');
      if (msg) msg.textContent = `Error ${res.status}: ${res.statusText} — revisar respuesta del servidor (véase consola).`;
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('fetchFestivos - JSON parse error. Respuesta completa:', text);
      const msg = document.getElementById('festivosMsg');
      if (msg) msg.textContent = 'Respuesta inválida del servidor (no JSON). Revisa el endpoint PHP.';
      throw new Error('Respuesta no JSON');
    }
  } catch (e) {
    console.error('fetchFestivos - fetch error:', e);
    throw e;
  }
}

function normalizeFestivos(data) {
    const out = [];
    if (!Array.isArray(data)) return out;
    for (const item of data) {
        if (!item) continue;
        if (typeof item === 'string') {
            out.push({ diaFestivo: item, definicion: '' });
        } else if (typeof item === 'object') {
            const dia = item.diaFestivo ?? item.dia ?? item.fecha ?? Object.values(item)[0] ?? null;
            const definicion = item.definicion ?? item.definición ?? item.desc ?? item.descripcion ?? item.description ?? '';
            if (dia) out.push({ diaFestivo: String(dia), definicion: String(definicion) });
        }
    }
    // ordenar ascendente por fecha
    out.sort((a,b) => String(a.diaFestivo).localeCompare(String(b.diaFestivo)));
    return out;
}

function buildHtml(festivos) {
    // Si en index_evg.html existen los inputs (#nuevoFestivo ...) no sobrescribimos todo el contenedor.
    const container = document.getElementById('gestionFestivos');
    if (!container) return;

    const formatDisplay = (iso) => {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length !== 3) return iso;
        return `${parts[2].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[0]}`;
    };

    // si la página ya tiene el formulario (index_evg.html), rellenamos solo el tbody existente
    const existingTabla = document.getElementById('tablaFestivos');
    if (existingTabla) {
        let tbody = existingTabla.querySelector('tbody');
        if (!tbody) {
            tbody = document.createElement('tbody');
            existingTabla.appendChild(tbody);
        }
        tbody.innerHTML = '';
        if (!festivos || festivos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3"><em>No hay festivos registrados.</em></td></tr>';
        } else {
            for (const f of festivos) {
                const display = formatDisplay(f.diaFestivo);
                const tr = document.createElement('tr');
                // añadimos data-definicion para poder obtenerla al editar
                tr.setAttribute('data-fecha', f.diaFestivo);
                tr.setAttribute('data-definicion', f.definicion || '');
                tr.innerHTML = `<td>${escapeHtml(display)}</td>
                                <td>${escapeHtml(f.definicion || '')}</td>
                                <td>
                                  <button class="btn btn-sm btn-outline-secondary btn-edit-festivo" data-fecha="${escapeHtml(f.diaFestivo)}" data-definicion="${escapeHtml(f.definicion || '')}">Editar</button>
                                  <button class="btn btn-sm btn-outline-danger btn-delete-festivo" data-fecha="${escapeHtml(f.diaFestivo)}">Borrar</button>
                                </td>`;
                tbody.appendChild(tr);
            }
        }
        return;
    }

    // Si no existe tabla en el HTML (vista alternativa), generamos todo
    let html = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h1 class="text-center my-0">Gestión de festivos</h1>
        <div>
          <button id="btnAñadirFestivo" class="btn btn-sm btn-primary">Añadir festivo</button>
          <button id="btnBorrarTodosFestivos" class="btn btn-sm btn-danger">Borrar
        </div>
      </div>
      <div id="festivosMsg" class="my-2"></div>
      <table id="tablaFestivos" class="table table-striped">
        <thead><tr><th>Fecha</th><th>Descripción</th><th>Acciones</th></tr></thead>
        <tbody>
    `;
    if (!festivos || festivos.length === 0) {
        html += '<tr><td colspan="3"><em>No hay festivos registrados.</em></td></tr>';
    } else {
        for (const f of festivos) {
            const display = formatDisplay(f.diaFestivo);
            html += `<tr data-fecha="${escapeHtml(f.diaFestivo)}" data-definicion="${escapeHtml(f.definicion || '')}"><td>${escapeHtml(display)}</td>
                     <td>${escapeHtml(f.definicion || '')}</td>
                     <td>
                       <button class="btn btn-sm btn-outline-secondary btn-edit-festivo" data-fecha="${escapeHtml(f.diaFestivo)}" data-definicion="${escapeHtml(f.definicion || '')}">Editar</button>
                       <button class="btn btn-sm btn-outline-danger btn-delete-festivo" data-fecha="${escapeHtml(f.diaFestivo)}">Borrar</button>
                     </td></tr>`;
        }
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function cargarYMostrar() {
    const msgEl = document.getElementById('festivosMsg') || (() => {
        const c = document.getElementById('gestionFestivos');
        if (c) { c.innerHTML = '<div id="festivosMsg"></div>';}
        return document.getElementById('festivosMsg');
    })();
    if (msgEl) msgEl.textContent = 'Cargando festivos...';
    try {
        const data = await fetchFestivos();
        const festivos = normalizeFestivos(data);
        buildHtml(festivos);
        if (msgEl) msgEl.textContent = `Mostrados ${festivos.length} festivos.`;
    } catch (err) {
        const container = document.getElementById('gestionFestivos');
        if (container) {
            container.innerHTML = `<h1 class="text-center my-3">Gestión de festivos</h1>
                <div id="festivosMsg" class="my-2 text-danger">Error: ${escapeHtml(err.message)}</div>`;
        } else {
            console.error(err);
        }
    }
}

// DOM ready: sólo enganchar handlers de los botones que están en index_evg.html
document.addEventListener('DOMContentLoaded', ()=> {
    if (!document.getElementById('gestionFestivos')) return;

    // cargar lista inicial
    cargarYMostrar();

    // crear
    const btnCrear = document.getElementById('btnCrearFestivo');
    if (btnCrear) {
      btnCrear.addEventListener('click', async () => {
        const inputFecha = document.getElementById('nuevoFestivo');
        const inputDesc  = document.getElementById('nuevoFestivoDescripcion');
        const msg = document.getElementById('festivosMsg');
        if (!inputFecha) return;
        const fecha = inputFecha.value;
        const definicion = inputDesc ? inputDesc.value.trim() : '';
        if (!fecha) { if (msg) msg.textContent = 'Introduce fecha.'; return; }
        try {
          await crearFestivo(fecha, definicion);
          if (msg) msg.textContent = 'Festivo añadido.';
          cargarYMostrar();
        } catch (e) {
          if (msg) msg.textContent = 'Error: ' + e.message;
          console.error(e);
        }
      });
    }

    // NOTE: se eliminó aquí el listener específico de "Borrar todos" porque existe
    // un delegador global al final del archivo que ya maneja ese botón.
});

// helper: validar YYYY-MM-DD
function isValidISODate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + 'T00:00:00').getTime());
}

// Parsear entrada flexible (dd/mm/yyyy, d/m/yyyy, dd-mm-yyyy o yyyy-mm-dd) y devolver YYYY-MM-DD o null
function parseDateInput(input) {
    if (!input) return null;
    const s = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s) && isValidISODate(s)) return s;
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
        const d = String(m[1]).padStart(2, '0');
        const mo = String(m[2]).padStart(2, '0');
        const y = m[3];
        const iso = `${y}-${mo}-${d}`;
        return isValidISODate(iso) ? iso : null;
    }
    return null;
}

async function crearFestivo(fecha, definicion = '') {
    if (!isValidISODate(fecha)) throw new Error('Fecha inválida (YYYY-MM-DD).');
    const url = API_URL;
    // <-- Cambiado: enviar "fecha" en vez de "diaFestivo"
    const body = JSON.stringify({ fecha: fecha, definicion });
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} - ${t}`);
    }
    return res.json().catch(() => ({}));
}

async function actualizarFestivo(oldFecha, newFecha, definicion = null) {
    if (!isValidISODate(newFecha)) throw new Error('Fecha nueva inválida (YYYY-MM-DD).');
    const url = API_URL;
    const body = JSON.stringify({ oldFecha, fecha: newFecha, definicion });
    const res = await fetch(url, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} - ${t}`);
    }
    return res.json().catch(() => ({}));
}

async function borrarFestivo(fecha) {
    if (!isValidISODate(fecha)) throw new Error('Fecha inválida.');
    const url = API_URL;
    const body = JSON.stringify({ fecha });
    const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} - ${t}`);
    }
    return res.json().catch(() => ({}));
}

async function borrarTodosFestivos() {
    const url = API_URL + '&action=borrarTodos';
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrarTodos: true })
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} - ${t}`);
    }
    return res.json().catch(() => ({}));
}

// Delegación de eventos dentro del contenedor para botones (añadir/editar/borrar)
document.addEventListener('click', async (ev) => {
    const cont = ev.target.closest('#gestionFestivos');
    if (!cont) return;

    // Añadir
    if (ev.target.id === 'btnAñadirFestivo') {
        const raw = prompt('Introduce fecha (DD/MM/YYYY o YYYY-MM-DD):');
        if (!raw) return;
        const iso = parseDateInput(raw);
        if (!iso) {
            alert('Formato de fecha inválido. Usa DD/MM/YYYY o YYYY-MM-DD.');
            return;
        }
        try {
            await crearFestivo(iso);
            cargarYMostrar();
        } catch (e) {
            alert('Error creando festivo: ' + e.message);
            console.error(e);
        }
        return;
    }

    // Borrar todos
    if (ev.target.id === 'btnBorrarTodosFestivos') {
        if (!confirm('¿Borrar TODOS los festivos? Esta acción no se puede deshacer.')) return;
        try {
            await borrarTodosFestivos();
            cargarYMostrar();
        } catch (e) {
            alert('Error borrando todos: ' + e.message);
            console.error(e);
        }
        return;
    }

    // Editar uno
    const btnEdit = ev.target.closest('.btn-edit-festivo');
    if (btnEdit) {
        const oldF = btnEdit.getAttribute('data-fecha'); // ISO almacenada
        const currentDesc = btnEdit.getAttribute('data-definicion') || '';
        const defaultValue = (oldF && /^\d{4}-\d{2}-\d{2}$/.test(oldF))
            ? `${oldF.split('-')[2]}/${oldF.split('-')[1]}/${oldF.split('-')[0]}`
            : oldF;
        const nuevoRaw = prompt('Editar fecha (DD/MM/YYYY o YYYY-MM-DD):', defaultValue);
        if (!nuevoRaw) return;
        const nuevoIso = parseDateInput(nuevoRaw);
        if (!nuevoIso) {
            alert('Formato de fecha inválido. Usa DD/MM/YYYY o YYYY-MM-DD.');
            return;
        }
        const nuevaDesc = prompt('Editar descripción (dejar vacío para borrar):', currentDesc);
        if (nuevaDesc === null) return;
        if (nuevoIso === oldF && String((nuevaDesc||'').trim()) === String((currentDesc||'').trim())) return;
        try {
            await actualizarFestivo(oldF, nuevoIso, (nuevaDesc||'').trim());
            cargarYMostrar();
        } catch (e) {
            alert('Error actualizando: ' + e.message);
            console.error(e);
        }
        return;
    }

    // Borrar uno
    const btnDel = ev.target.closest('.btn-delete-festivo');
    if (btnDel) {
        const f = btnDel.getAttribute('data-fecha');
        if (!confirm(`Borrar festivo ${f.split('-').reverse().join('/')}?`)) return;
        try {
            await borrarFestivo(f);
            cargarYMostrar();
        } catch (e) {
            alert('Error borrando: ' + e.message);
            console.error(e);
        }
        return;
    }
}, false);
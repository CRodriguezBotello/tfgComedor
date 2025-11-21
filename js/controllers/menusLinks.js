// Código para cargar los PDFs de /menus y actualizar el enlace según el mes mostrado en el calendario
const API_LIST = 'php/api/index.php?controller=menus&action=list';
let menusData = {};

async function loadMenus() {
  try {
    const res = await fetch(API_LIST, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo listar menús');
    menusData = await res.json();

    // Normaliza las URLs recibidas para apuntar siempre a la carpeta /menus/
    const getProjectBasePath = () => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => p.toLowerCase().includes('comedor'));
      if (idx >= 0) return '/' + parts.slice(0, idx + 1).join('/');
      // fallback: si no encuentra "comedor" usa los dos primeros segmentos (por ejemplo /hugo/Proyecto)
      if (parts.length >= 2) return '/' + parts.slice(0, 2).join('/');
      return '';
    };

    const base = window.location.origin + getProjectBasePath() + '/menus/';

    const normalize = (val) => {
      if (!val) return null;
      val = String(val).trim();
      // si es URL absoluta o empieza con /, devolver tal cual
      if (/^(https?:)?\/\//.test(val) || val.startsWith('/')) {
        // si contiene "/menus/" y es absoluta, recortar hasta /menus/ y rehacer con base detectada
        const mIdx = val.indexOf('/menus/');
        if (mIdx >= 0) {
          const filename = val.substring(mIdx + 7);
          return base + encodeURIComponent(filename);
        }
        return val;
      }
      // si contiene "menus/" o "/menus/" quitar prefijo y tomar nombre de archivo
      let filename = val;
      const menusPos = val.indexOf('menus/');
      if (menusPos >= 0) filename = val.substring(menusPos + 6);
      // si venía "ruta/archivo.pdf" tomar último segmento
      filename = filename.split('/').pop();
      return base + encodeURIComponent(filename);
    };

    for (const k in menusData) {
      menusData[k] = normalize(menusData[k]);
    }

  } catch (e) {
    console.error('Error cargando menús', e);
    menusData = {};
  }
}

const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function monthNameToNumber(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  for (let i = 0; i < monthNames.length; i++) {
    if (t.includes(monthNames[i])) return i + 1;
  }
  const m = text.match(/\b(0?[1-9]|1[0-2])\b/);
  return m ? parseInt(m[0], 10) : null;
}

function getDisplayedMonth() {
  const el = document.getElementById('monthYear');
  if (el && el.textContent) {
    const num = monthNameToNumber(el.textContent);
    if (num) return num;
  }
  return (new Date()).getMonth() + 1;
}

const monthsDisplay = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function renderForMonth(month) {
  const cont = document.getElementById('menusLinks');
  if (!cont) return;
  if (!month) {
    cont.innerHTML = '<span class="text-muted">Seleccione un mes en el calendario.</span>';
    return;
  }
  const url = menusData[month] || null;
  if (url) {
    cont.innerHTML = `<a href="${url}" target="_blank" rel="noopener">Menú ${monthsDisplay[month-1]}</a>`;
  } else {
    cont.innerHTML = '<span class="text-muted">No hay menú para este mes.</span>';
  }
}

function renderAllMonths() {
  const cont = document.getElementById('menusLinks');
  if (!cont) return;
  let html = '<div class="d-flex flex-wrap justify-content-center">';
  for (let m = 1; m <= 12; m++) {
    const url = menusData[m] || null;
    if (url) {
      html += `<a class="badge badge-primary m-1 p-2" href="${url}" target="_blank" rel="noopener">Menú ${monthsDisplay[m-1]}</a>`;
    } else {
      html += `<span class="badge badge-secondary m-1 p-2 text-muted">Sin ${monthsDisplay[m-1]}</span>`;
    }
  }
  html += '</div>';
  cont.innerHTML = html;
}

async function initMenusLinks() {
  await loadMenus();
  renderAllMonths();

  const monthYearEl = document.getElementById('monthYear');
  if (monthYearEl) {
    const mo = new MutationObserver(() => renderAllMonths());
    mo.observe(monthYearEl, { childList: true, characterData: true, subtree: true });
  }

  document.getElementById('prevMonth')?.addEventListener('click', () => setTimeout(() => renderForMonth(getDisplayedMonth()), 80));
  document.getElementById('nextMonth')?.addEventListener('click', () => setTimeout(() => renderForMonth(getDisplayedMonth()), 80));
}

// Auto-iniciar cuando se cargue el módulo
initMenusLinks();
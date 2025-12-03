const API_URL = './php/api/index.php?controller=precios';

class ControladorTarifas {
    constructor() {
        this.api = API_URL;
        this.rootId = 'gestionTarifas';
        this.usuario = null;
        document.addEventListener('DOMContentLoaded', this.iniciar.bind(this));
    }

    /**
     * Inicia al cargar la página.
     */
    iniciar() {
        this.usuario = JSON.parse(sessionStorage.getItem('usuario')) || null;
        if (window.Rest && this.usuario && this.usuario.autorizacion) {
            Rest.setAutorizacion(this.usuario.autorizacion);
        }

        // Ocultar la zona de creación: ahora las tarifas son columnas fijas en BD
        const nuevoNombre = document.getElementById('nuevoNombre');
        const nuevoCantidad = document.getElementById('nuevoCantidad');
        const crearBtn = document.getElementById('btnCrearTarifa');
        if (nuevoNombre) nuevoNombre.style.display = 'none';
        if (nuevoCantidad) nuevoCantidad.style.display = 'none';
        if (crearBtn) crearBtn.style.display = 'none';

        // Mostrar vista al clicar su entrada de menú
        const li = document.querySelector('nav.topnav li[data-view="gestionTarifas"]');
        if (li) li.addEventListener('click', () => {
            this.mostrarVista();
            this.cargarTarifas();
        });

        // Ocultar vista cuando se selecciona otra opción del menú
        document.querySelectorAll('nav.topnav li[data-view]').forEach(menuLi => {
            menuLi.addEventListener('click', () => {
                const view = menuLi.getAttribute('data-view');
                if (view !== 'gestionTarifas') this.ocultarVista();
            });
        });

        // Delegación sobre la tabla
        const tbody = document.querySelector('#tablaTarifas tbody');
        if (tbody) tbody.addEventListener('click', this._onTablaClick.bind(this));
    }

    /**
     * fetchTarifas - Obtiene la lista de tarifas desde la API.
     * @returns {Promise<Array>} Lista de tarifas desde la API.
     */
    async fetchTarifas() {
        const res = await fetch(this.api);
        return await res.json();
    }

    /**
     * renderTarifas - Renderiza la lista de tarifas en la tabla.
     * @param {*} list Lista de tarifas
     */
    _renderTarifas(list) {
        const tbody = document.querySelector('#tablaTarifas tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        list.forEach(p => {
            const tr = document.createElement('tr');
            // p.idPrecio puede ser un nombre de columna (string) o id numérico
            tr.innerHTML = `
                <td class="nombre">${p.nombreP}</td>
                <td><input type="number" step="0.01" class="form-control cantidad" value="${Number(p.cantidad).toFixed(2)}" /></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-save">Guardar</button>
                </td>
            `;
            tr.dataset.id = p.idPrecio;
            tbody.appendChild(tr);
        });
    }

    /**
     * cargarTarifas - Carga las tarifas desde la API y las renderiza.
     */
    async cargarTarifas() {
        try {
            const data = await this.fetchTarifas();
            this._renderTarifas(Array.isArray(data) ? data : []);
            this._setMsg('');
        } catch (e) {
            console.error(e);
            this._setMsg('Error cargando tarifas');
        }
    }

    
    /**
     * actualizarTarifa - Actualiza una tarifa en la API.
     * @param {*} id 
     * @param {*} cantidad 
     * @returns {Promise<Object>} Resultado de la actualización
     */
    async actualizarTarifa(id, cantidad) {
        const headers = this._getHeaders();
        // normalizar coma -> punto y convertir a número
        const cantidadNum = parseFloat(String(cantidad).replace(',', '.'));
        const res = await fetch(this.api, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ idPrecio: id, cantidad: isNaN(cantidadNum) ? 0 : cantidadNum })
        });
        return await res.json();
    }


    /**
     * mostrarVista - Muestra la vista de gestión de tarifas.
     */
    mostrarVista() {
        document.querySelectorAll('body > div[id]').forEach(d => d.classList.add('d-none'));
        const v = document.getElementById(this.rootId);
        if (v) v.classList.remove('d-none');
    }

    /**
     * ocultarVista - Oculta la vista de gestión de tarifas.
     */
    ocultarVista() {
        const v = document.getElementById(this.rootId);
        if (v && !v.classList.contains('d-none')) v.classList.add('d-none');
    }

    /**
     * setMsg - Establece un mensaje en la zona de mensajes.
     * @param {*} msg 
     */
    _setMsg(msg) {
        const el = document.getElementById('tarifasMsg');
        if (el) el.textContent = msg;
    }

    /**
     * getHeaders - Obtiene los headers para las peticiones API.
     * @returns {Object} Headers para las peticiones API
     */
    _getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = sessionStorage.getItem('Authorization2') || localStorage.getItem('Authorization2') || (this.usuario && this.usuario.autorizacion);
        if (token) headers['Authorization2'] = token;
        return headers;
    }

    
    /**
     * onTablaClick - Maneja los clics en la tabla de tarifas.
     * @param {*} ev 
     */
    async _onTablaClick(ev) {
        const btn = ev.target;
        const tr = btn.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;
        if (btn.classList.contains('btn-save')) {
            const val = tr.querySelector('.cantidad').value;
            btn.disabled = true;
            try {
                const r = await this.actualizarTarifa(id, val);
                await this.cargarTarifas(); // recargar antes de mostrar el mensaje para que no se borre
                this._setMsg(r.success ? 'Guardado' : (r.error || 'Guardado correctamente'));
            } catch (e) {
                console.error(e);
                this._setMsg('Error servidor');
            } finally {
                btn.disabled = false;
            }
        }
    }
}

new ControladorTarifas();
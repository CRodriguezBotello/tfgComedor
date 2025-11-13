const API_URL = './php/api/index.php?controller=precios';

class ControladorTarifas {
    constructor() {
        this.api = API_URL;
        this.rootId = 'gestionTarifas';
        this.usuario = null;
        document.addEventListener('DOMContentLoaded', this.iniciar.bind(this));
    }

    iniciar() {
        this.usuario = JSON.parse(sessionStorage.getItem('usuario')) || null;
        if (window.Rest && this.usuario && this.usuario.autorizacion) {
            Rest.setAutorizacion(this.usuario.autorizacion);
        }

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

        // Botón crear
        const crearBtn = document.getElementById('btnCrearTarifa');
        if (crearBtn) crearBtn.addEventListener('click', this._onCrear.bind(this));

        // Delegación sobre la tabla
        const tbody = document.querySelector('#tablaTarifas tbody');
        if (tbody) tbody.addEventListener('click', this._onTablaClick.bind(this));
    }

    async fetchTarifas() {
        const res = await fetch(this.api);
        return await res.json();
    }

    _renderTarifas(list) {
        const tbody = document.querySelector('#tablaTarifas tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        list.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="nombre">${p.nombreP}</td>
                <td><input type="number" step="0.01" class="form-control cantidad" value="${Number(p.cantidad).toFixed(2)}" /></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-save">Guardar</button>
                    <button class="btn btn-sm btn-danger btn-del">Borrar</button>
                </td>
            `;
            tr.dataset.id = p.idPrecio;
            tbody.appendChild(tr);
        });
    }

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

    async crearTarifa(nombre, cantidad) {
        const headers = this._getHeaders();
        // normalizar coma -> punto y convertir a número
        const cantidadNum = parseFloat(String(cantidad).replace(',', '.'));
        const res = await fetch(this.api, {
            method: 'POST',
            headers,
            body: JSON.stringify({ nombreP: nombre, cantidad: isNaN(cantidadNum) ? 0 : cantidadNum })
        });
        return await res.json();
    }
    
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

    async borrarTarifa(id) {
        const url = this.api + '&id=' + encodeURIComponent(id);
        const headers = this._getHeaders();
        const res = await fetch(url, { method: 'DELETE', headers });
        return await res.json();
    }

    mostrarVista() {
        document.querySelectorAll('body > div[id]').forEach(d => d.classList.add('d-none'));
        const v = document.getElementById(this.rootId);
        if (v) v.classList.remove('d-none');
    }

    ocultarVista() {
        const v = document.getElementById(this.rootId);
        if (v && !v.classList.contains('d-none')) v.classList.add('d-none');
    }

    _setMsg(msg) {
        const el = document.getElementById('tarifasMsg');
        if (el) el.textContent = msg;
    }

    _getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = sessionStorage.getItem('Authorization2') || localStorage.getItem('Authorization2') || (this.usuario && this.usuario.autorizacion);
        if (token) headers['Authorization2'] = token;
        return headers;
    }

    async _onCrear() {
        const nombre = document.querySelector('#nuevoNombre')?.value.trim() || '';
        const cantidad = document.querySelector('#nuevoCantidad')?.value;
        if (!nombre || cantidad === '') { this._setMsg('Nombre y cantidad obligatorios'); return; }
        try {
            const r = await this.crearTarifa(nombre, cantidad);
            if (r.success) {
                document.querySelector('#nuevoNombre').value = '';
                document.querySelector('#nuevoCantidad').value = '';
                this._setMsg('Creada');
                await this.cargarTarifas();
            } else {
                this._setMsg(r.error || 'Error');
            }
        } catch (e) {
            console.error(e);
            this._setMsg('Error servidor');
        }
    }

    async _onTablaClick(ev) {
        const btn = ev.target;
        const tr = btn.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;
        if (btn.classList.contains('btn-save')) {
            const val = tr.querySelector('.cantidad').value;
            try {
                const r = await this.actualizarTarifa(id, val);
                this._setMsg(r.success ? 'Guardado' : (r.error || 'Error al guardar'));
                await this.cargarTarifas();
            } catch (e) {
                console.error(e);
                this._setMsg('Error servidor');
            }
        } else if (btn.classList.contains('btn-del')) {
            if (!confirm('Borrar tarifa?')) return;
            try {
                const r = await this.borrarTarifa(id);
                this._setMsg((r.ok || r.success) ? 'Borrado' : (r.error || 'Error al borrar'));
                await this.cargarTarifas();
            } catch (e) {
                console.error(e);
                this._setMsg('Error servidor');
            }
        }
    }
}

new ControladorTarifas();
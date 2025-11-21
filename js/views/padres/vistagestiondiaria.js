export class VistaGestionDiaria {
    constructor(controlador, div) {
        this.controlador = controlador;
        this.div = div;

        this.div.innerHTML = `
            <div class="container mb-3">
                <div class="d-flex justify-content-center align-items-center mb-2">
                    <button class="btn btn-info btn-prev mr-2">Anterior</button>
                    <input type="date" id="fechaDiaria" class="form-control w-auto">
                    <button class="btn btn-info btn-next ml-2">Siguiente</button>
                </div>
                <div class="text-center">
                    <button class="btn btn-primary seleccionar_fecha">Seleccionar fecha</button>
                    <button class="btn btn-success btn-confirmar ml-2">Confirmar</button>
                </div>
                <div id="mensajeFecha" class="text-center text-danger mt-2"></div>
            </div>

            <table id="tablaDiario" class="table table-striped text-center align-middle">
                <thead>
                    <tr class="datos bg-info text-white">
                        <th colspan="4">Pedidos totales: <span id="totalPedidos">0</span></th>
                    </tr>
                    <tr>
                        <th>Nombre</th>
                        <th>Curso</th>
                        <th>Tupper</th>
                        <th>Incidencias</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;

        this.tbody = this.div.querySelector('tbody');
        this.totalPedidos = this.div.querySelector('#totalPedidos');

        this.div.querySelector('.btn-prev').addEventListener('click', () => this.cambiarFecha(-1));
        this.div.querySelector('.btn-next').addEventListener('click', () => this.cambiarFecha(1));
        this.div.querySelector('.seleccionar_fecha').addEventListener('click', () => this.seleccionarFecha());

        // Guardamos referencia al botón confirmar para poder habilitar/deshabilitar
        this.confirmBtn = this.div.querySelector('.btn-confirmar');
        if (this.confirmBtn) this.confirmBtn.addEventListener('click', () => this.confirmar());
    }

    mostrar(ver) {
        this.div.classList.toggle('d-none', !ver);
    }

    obtenerDatos(usuario) {
        if (!this.controlador || typeof this.controlador.dameHijosDiaria !== 'function') {
            console.error('VistaGestionDiaria: controlador.dameHijosDiaria no disponible');
            this.div.innerHTML = `
                <table class="table">
                    <tbody><tr><td>No se pueden cargar los datos (error interno).</td></tr></tbody>
                </table>
            `;
            return;
        }

        this.tbody = this.div.querySelector('tbody');
        this.totalPedidos = this.div.querySelector('#totalPedidos');

        // Obtener los hijos y cargar la tabla
        this.controlador.dameHijosDiaria(usuario.id)
            .then(hijos => this.cargarListado(hijos))
            .catch(e => {
                console.error('Error obteniendo hijos:', e);
                if (this.tbody) this.tbody.innerHTML = `<tr><td colspan="4">Error cargando datos.</td></tr>`;
            });
    }

    cargarListado(hijos, cursosMap = new Map(), idPadre = null) {
        // Asegurar referencias
        this.tbody = this.div.querySelector('tbody');
        this.totalPedidos = this.div.querySelector('#totalPedidos');

        if (!this.tbody) {
            console.error('VistaGestionDiaria: tbody no encontrado en el contenedor.');
            return;
        }

        this.tbody.innerHTML = '';

        if (!hijos || hijos.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.textContent = 'No hay hijos registrados';
            tr.appendChild(td);
            this.tbody.appendChild(tr);
            if (this.totalPedidos) this.totalPedidos.textContent = 0;
            return;
        }

        let total = 0;
        hijos.forEach(hijo => {
            const tr = document.createElement('tr');

            // Guardar ids en data-attributes para su posterior uso
            tr.dataset.idPersona = hijo.id;
            if (idPadre != null) tr.dataset.idPadre = idPadre;

            const tdNombre = document.createElement('td');
            tdNombre.textContent = hijo.nombre || '';
            tr.appendChild(tdNombre);

            const tdCurso = document.createElement('td');
            const nombreCurso = cursosMap.get(hijo.idCurso) || (hijo.idCurso != null ? String(hijo.idCurso) : '');
            tdCurso.textContent = nombreCurso;
            tr.appendChild(tdCurso);

            const tdCheckbox = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'tupper-checkbox';
            tdCheckbox.appendChild(checkbox);
            tr.appendChild(tdCheckbox);

            const tdIncidencia = document.createElement('td');
            const textarea = document.createElement('textarea');
            textarea.className = 'form-control incidencia-text';
            textarea.rows = 1;
            tdIncidencia.appendChild(textarea);
            tr.appendChild(tdIncidencia);

            this.tbody.appendChild(tr);

            checkbox.addEventListener('change', () => {
                total = this.div.querySelectorAll('.tupper-checkbox:checked').length;
                if (this.totalPedidos) this.totalPedidos.textContent = total;
            });
        });

        // Comprobaciones sobre la fecha seleccionada y capacidad de edición
        const mensajeDiv = this.div.querySelector('#mensajeFecha');
        const fechaStr = this.div.querySelector('#fechaDiaria').value;
        if (!fechaStr) {
            if (mensajeDiv) mensajeDiv.textContent = 'Seleccione primero una fecha.';
            return;
        }

        const fechaObj = new Date(fechaStr);
        const diaSemana = fechaObj.getDay(); // 0 domingo, 6 sábado

        if (diaSemana === 0 || diaSemana === 6) {
            if (mensajeDiv) mensajeDiv.textContent = 'Aviso: los fines de semana no se pueden marcar.';
        } else {
            if (mensajeDiv) mensajeDiv.textContent = '';
        }

        // Comprobar si la fecha es editable según la política de 13:30
        const editable = this.isFechaEditable(fechaStr);
        if (!editable) {
            if (mensajeDiv) mensajeDiv.textContent = (mensajeDiv.textContent ? mensajeDiv.textContent + ' ' : '') +
                'No se permiten cambios para esta fecha (plazo cerrado a las 13:30).';
        }

        // Pedir al controlador los registros de tupper e incidencias para esa fecha
        Promise.all([
            this.controlador.obtenerTupper(fechaObj),
            this.controlador.obtenerIncidencias(fechaObj)
        ])
        .then(([tuppers, incidencias]) => {
            // Construir mapas rápidos por idPersona
            const tmap = new Map();
            (tuppers || []).forEach(r => {
                tmap.set(Number(r.idPersona), Number(r.tupper));
            });
            const imap = new Map();
            (incidencias || []).forEach(r => {
                imap.set(Number(r.idPersona), r.incidencia);
            });

            // Aplicar datos a las filas existentes
            const filas = Array.from(this.tbody.querySelectorAll('tr'));
            let totalLocal = 0;
            filas.forEach(tr => {
                const idAttr = tr.dataset.idPersona || tr.dataset.idpersona;
                const idPersona = idAttr ? Number(idAttr) : null;
                if (!idPersona) return;

                const checkbox = tr.querySelector('.tupper-checkbox');
                const textarea = tr.querySelector('.incidencia-text');

                // Si no editable, bloquear controles para evitar cambios
                if (!editable) {
                    if (checkbox) checkbox.disabled = true;
                    if (textarea) textarea.disabled = true;
                } else {
                    if (checkbox) checkbox.disabled = false;
                    if (textarea) textarea.disabled = false;
                }

                const marcado = tmap.has(idPersona) ? (tmap.get(idPersona) === 1) : false;
                if (checkbox) {
                    checkbox.checked = marcado;
                    if (marcado) totalLocal++;
                    // Guardar estado original para detectar cambios posteriores
                    tr.dataset.origTupper = marcado ? '1' : '0';
                }
                if (textarea) {
                    const valorInc = imap.has(idPersona) ? imap.get(idPersona) : '';
                    textarea.value = valorInc;
                    // Guardar incidencia original (cadena vacía si no existe)
                    tr.dataset.origIncidencia = valorInc;
                }

                // actualizar contador al cambiar si editable
                if (checkbox && editable) {
                    checkbox.addEventListener('change', () => {
                        const cnt = this.div.querySelectorAll('.tupper-checkbox:checked').length;
                        if (this.totalPedidos) this.totalPedidos.textContent = cnt;
                    });
                }
            });

            if (this.totalPedidos) this.totalPedidos.textContent = totalLocal;

            // Habilitar/deshabilitar botón confirmar según editable
            if (this.confirmBtn) this.confirmBtn.disabled = !editable;
        })
        .catch(e => {
            console.error('Error cargando datos del día:', e);
            alert('Error cargando datos del día. Revisa la consola.');
        });
    }

    // Nuevo método: comprueba si una fecha (Date o string) es anterior a hoy
    isPastDate(fechaInput) {
        if (!fechaInput) return false;
        const d = (fechaInput instanceof Date) ? new Date(fechaInput) : new Date(fechaInput);
        d.setHours(0,0,0,0);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        return d < hoy;
    }

    /**
     * Comprueba si la fecha seleccionada es editable:
     * - no editable si es anterior a hoy
     * - editable si es futura
     * - si es hoy, editable solo antes de 13:30
     * @param {String} fechaStr 'YYYY-MM-DD'
     * @returns {Boolean}
     */
    isFechaEditable(fechaStr) {
        if (!fechaStr) return false;
        // Crear objetos Date en horario local
        const chosen = new Date(fechaStr + 'T00:00:00');
        const now = new Date();

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const chosenDay = new Date(chosen.getFullYear(), chosen.getMonth(), chosen.getDate());

        // Si la fecha elegida es anterior a hoy -> no editable
        if (chosenDay.getTime() < today.getTime()) return false;

        // Si la fecha es hoy -> solo editable antes de 13:30
        if (chosenDay.getTime() === today.getTime()) {
            const cutoff = new Date(chosenDay.getFullYear(), chosenDay.getMonth(), chosenDay.getDate(), 13, 30, 0);
            return now.getTime() < cutoff.getTime();
        }

        // Fecha futura -> editable
        return true;
    }

    cambiarFecha(dias) {
        const input = this.div.querySelector('#fechaDiaria');
        const base = input.value ? new Date(input.value) : new Date();
        const fecha = new Date(base);
        fecha.setDate(fecha.getDate() + dias);
        fecha.setHours(0,0,0,0);

        const hoy = new Date();
        hoy.setHours(0,0,0,0);

        if (fecha < hoy) {
            // No permitimos retroceder a días pasados: fijar a hoy y mostrar aviso
            input.valueAsDate = hoy;
            const mensajeDiv = this.div.querySelector('#mensajeFecha');
            if (mensajeDiv) mensajeDiv.textContent = 'No se puede retroceder a una fecha anterior a hoy.';
            return;
        }

        input.valueAsDate = fecha;
    }

    seleccionarFecha() {
        const fechaStr = this.div.querySelector('#fechaDiaria').value;
        if (!fechaStr) {
            alert('Seleccione primero una fecha.');
            return;
        }
        console.log("Fecha seleccionada:", fechaStr);

        const mensajeDiv = this.div.querySelector('#mensajeFecha');
        const fechaObj = new Date(fechaStr);

        // Comprobar si es fecha pasada
        if (this.isPastDate(fechaObj)) {
            if (mensajeDiv) mensajeDiv.textContent = 'Aviso: no se puede seleccionar una fecha anterior a hoy.';
            return; // no cargar datos de días pasados
        } else {
            // limpiar mensaje si no es pasado
            if (mensajeDiv) mensajeDiv.textContent = '';
        }

        const diaSemana = fechaObj.getDay(); // 0 domingo, 6 sábado

        if (diaSemana === 0 || diaSemana === 6) {
            if (mensajeDiv) mensajeDiv.textContent = 'Aviso: los fines de semana no se pueden marcar.';
        } else {
            if (mensajeDiv) mensajeDiv.textContent = '';
        }

        // Pedir al controlador los registros de tupper e incidencias para esa fecha
        Promise.all([
            // pasar Date al controlador (modelo espera Date)
            this.controlador.obtenerTupper(fechaObj),
            this.controlador.obtenerIncidencias(fechaObj)
        ])
        .then(([tuppers, incidencias]) => {
            // Construir mapas rápidos por idPersona
            const tmap = new Map();
            (tuppers || []).forEach(r => {
                tmap.set(Number(r.idPersona), Number(r.tupper));
            });
            const imap = new Map();
            (incidencias || []).forEach(r => {
                imap.set(Number(r.idPersona), r.incidencia);
            });

            // Aplicar datos a las filas existentes
            const filas = Array.from(this.tbody.querySelectorAll('tr'));
            let total = 0;
            filas.forEach(tr => {
                const idAttr = tr.dataset.idPersona || tr.dataset.idpersona;
                const idPersona = idAttr ? Number(idAttr) : null;
                if (!idPersona) return;

                const checkbox = tr.querySelector('.tupper-checkbox');
                const textarea = tr.querySelector('.incidencia-text');

                if (checkbox) {
                    const marcado = tmap.has(idPersona) ? (tmap.get(idPersona) === 1) : false;
                    checkbox.checked = marcado;
                    if (marcado) total++;
                    tr.dataset.origTupper = marcado ? '1' : '0';
                }
                if (textarea) {
                    const valorInc = imap.has(idPersona) ? imap.get(idPersona) : '';
                    textarea.value = valorInc;
                    tr.dataset.origIncidencia = valorInc;
                }
            });

            if (this.totalPedidos) this.totalPedidos.textContent = total;
        })
        .catch(e => {
            console.error('Error cargando datos del día:', e);
            alert('Error cargando datos del día. Revisa la consola.');
        });
    }

    confirmar() {
        const fecha = this.div.querySelector('#fechaDiaria').value;
        const mensajeDiv = this.div.querySelector('#mensajeFecha');

        if (!fecha) {
            alert('Seleccione primero una fecha.');
            return;
        }

        // Evitar confirmar para fechas pasadas
        if (this.isPastDate(new Date(fecha))) {
            if (mensajeDiv) mensajeDiv.textContent = 'No se puede confirmar una fecha anterior a hoy.';
            alert('No se puede confirmar una fecha anterior a hoy.');
            return;
        }

        // Evitar confirmar fines de semana
        const fechaObj = new Date(fecha);
        const diaSemana = fechaObj.getDay(); // 0 domingo, 6 sábado
        if (diaSemana === 0 || diaSemana === 6) {
            if (mensajeDiv) mensajeDiv.textContent = 'Aviso: los fines de semana no se pueden marcar.';
            alert('Aviso: los fines de semana no se pueden marcar.');
            return;
        }

        // Evitar confirmar si la fecha no es editable según la regla 13:30
        if (!this.isFechaEditable(fecha)) {
            if (mensajeDiv) mensajeDiv.textContent = 'No se pueden guardar cambios: se ha superado la hora límite (13:30) para esta fecha.';
            alert('No se pueden guardar cambios: se ha superado la hora límite (13:30) para esta fecha.');
            return;
        }

        const filas = Array.from(this.tbody.querySelectorAll('tr'));
        const entradas = [];

        filas.forEach(tr => {
            const idPersona = tr.dataset.idPersona;
            if (!idPersona) return;

            const checkbox = tr.querySelector('.tupper-checkbox');
            const textarea = tr.querySelector('.incidencia-text');
            const tupper = checkbox && checkbox.checked ? 1 : 0;
            const incidencia = textarea ? textarea.value.trim() : '';

            // Recuperar valores originales guardados al cargar la tabla
            const origTupper = tr.dataset.origTupper ? Number(tr.dataset.origTupper) : 0;
            const origIncidencia = tr.dataset.origIncidencia ? tr.dataset.origIncidencia : '';

            // Si no hay cambios respecto al estado original, omitir
            if (tupper === origTupper && incidencia === origIncidencia) return;

            entradas.push({
                dia: fecha,
                idPersona: Number(idPersona),
                idPadre: tr.dataset.idPadre ? Number(tr.dataset.idPadre) : null,
                tupper,
                incidencia
            });
        });

        if (entradas.length === 0) {
            alert('No hay cambios para guardar.');
            return;
        }

        // Llamar al controlador para procesar los cambios
        this.controlador.procesarGestionDiaria(entradas)
            .then(() => {
                if (mensajeDiv) mensajeDiv.textContent = '';
                alert('Guardado correctamente.');
            })
            .catch(e => {
                console.error('Error guardando datos de gestión diaria:', e);
                // mostrar mensaje si viene del servidor
                const msg = (e && e.message) ? e.message : 'Error al guardar. Revisa la consola.';
                if (mensajeDiv) mensajeDiv.textContent = msg;
                alert(msg);
            });
    }

    /**
     * Carga las incidencias recibidas desde el controlador.
     * Normaliza distintos formatos para garantizar que this.incidencias sea siempre un Array.
     * @param {Array|Object|string} incidencias
     */
    cargarIncidencias(incidencias) {
        let lista = [];
        try {
            if (Array.isArray(incidencias)) {
                lista = incidencias;
            } else if (incidencias && Array.isArray(incidencias.dias)) {
                lista = incidencias.dias;
            } else if (incidencias && Array.isArray(incidencias.result)) {
                lista = incidencias.result;
            } else if (typeof incidencias === 'string' && incidencias.trim().length) {
                try {
                    const parsed = JSON.parse(incidencias);
                    if (Array.isArray(parsed)) lista = parsed;
                    else if (parsed && Array.isArray(parsed.dias)) lista = parsed.dias;
                } catch (e) {
                    lista = [];
                }
            } else {
                // Formato inesperado -> registrar para depuración
                console.warn('Padres.vista.cargarIncidencias: formato inesperado', incidencias);
                lista = [];
            }
        } catch (e) {
            console.error('Error normalizando incidencias (padres):', e, incidencias);
            lista = [];
        }

        this.incidencias = lista;
        this.iniciarTabla();
    }

    // Asegura que cualquier iteración use un array
    crearCuerpo() {
        const items = Array.isArray(this.incidencias) ? this.incidencias : [];
        let html = '';
        for (const inc of items) {
            html += `<tr>
                        <td>${inc.idPersona ?? ''}</td>
                        <td>${inc.incidencia ?? ''}</td>
                        <td>${inc.tupper ? 'Sí' : 'No'}</td>
                     </tr>`;
        }
        return html;
    }
}

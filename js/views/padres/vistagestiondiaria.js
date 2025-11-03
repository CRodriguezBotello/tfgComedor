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
<<<<<<< HEAD
                </div>
=======
                    <button class="btn btn-success btn-confirmar ml-2">Confirmar</button>
                </div>
                <div id="mensajeFecha" class="text-center text-danger mt-2"></div>
>>>>>>> hugo
            </div>

            <table id="tablaDiario" class="table table-striped text-center align-middle">
                <thead>
                    <tr class="datos bg-info text-white">
                        <th colspan="4">Pedidos totales: <span id="totalPedidos">0</span></th>
                    </tr>
                    <tr>
                        <th>Nombre</th>
                        <th>ID Curso</th>
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
<<<<<<< HEAD
=======
        this.div.querySelector('.btn-confirmar').addEventListener('click', () => this.confirmar());
>>>>>>> hugo
    }

    mostrar(ver) {
        this.div.classList.toggle('d-none', !ver);
    }

<<<<<<< HEAD
    

=======
>>>>>>> hugo
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

        // Volver a referenciar los elementos por si algo los ha reemplazado
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

<<<<<<< HEAD

    cargarListado(hijos, cursosMap = new Map()) {
=======
    cargarListado(hijos, cursosMap = new Map(), idPadre = null) {
>>>>>>> hugo
        // Asegurar referencias
        this.tbody = this.div.querySelector('tbody');
        this.totalPedidos = this.div.querySelector('#totalPedidos');

        if (!this.tbody) {
            console.error('VistaGestionDiaria: tbody no encontrado en el contenedor.');
            return;
        }

<<<<<<< HEAD
        
=======
>>>>>>> hugo
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

<<<<<<< HEAD
=======
            // Guardar ids en data-attributes para su posterior uso
            tr.dataset.idPersona = hijo.id;
            if (idPadre != null) tr.dataset.idPadre = idPadre;

>>>>>>> hugo
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
<<<<<<< HEAD
            textarea.className = 'form-control';
=======
            textarea.className = 'form-control incidencia-text';
>>>>>>> hugo
            textarea.rows = 1;
            tdIncidencia.appendChild(textarea);
            tr.appendChild(tdIncidencia);

            this.tbody.appendChild(tr);

<<<<<<< HEAD
            
=======
>>>>>>> hugo
            checkbox.addEventListener('change', () => {
                total = this.div.querySelectorAll('.tupper-checkbox:checked').length;
                if (this.totalPedidos) this.totalPedidos.textContent = total;
            });
        });
    }

<<<<<<< HEAD

    
=======
    confirmar() {
        const fecha = this.div.querySelector('#fechaDiaria').value;
        if (!fecha) {
            alert('Seleccione primero una fecha.');
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

            if (tupper === 0 && incidencia === '') return; // nada que enviar para este hijo

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
                alert('Guardado correctamente.');
            })
            .catch(e => {
                console.error('Error guardando datos de gestión diaria:', e);
                alert('Error al guardar. Revisa la consola.');
            });
    }
>>>>>>> hugo

    cambiarFecha(dias) {
        const input = this.div.querySelector('#fechaDiaria');
        const fecha = new Date(input.value || new Date());
        fecha.setDate(fecha.getDate() + dias);
        input.valueAsDate = fecha;
    }

    seleccionarFecha() {
<<<<<<< HEAD
        const fecha = this.div.querySelector('#fechaDiaria').value;
        console.log("Fecha seleccionada:", fecha);
=======
        const fechaStr = this.div.querySelector('#fechaDiaria').value;
        if (!fechaStr) {
            alert('Seleccione primero una fecha.');
            return;
        }
        console.log("Fecha seleccionada:", fechaStr);

        const mensajeDiv = this.div.querySelector('#mensajeFecha');
        const fechaObj = new Date(fechaStr);
        const diaSemana = fechaObj.getDay(); // 0 domingo, 6 sábado

        if (diaSemana === 0 || diaSemana === 6) {
            mensajeDiv.textContent = 'Aviso: los fines de semana no se pueden marcar.';
        } else {
            mensajeDiv.textContent = '';
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
                // r debe tener idPersona y tupper
                tmap.set(Number(r.idPersona), Number(r.tupper));
            });
            const imap = new Map();
            (incidencias || []).forEach(r => {
                // r debe tener idPersona y incidencia
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
                }
                if (textarea) {
                    textarea.value = imap.has(idPersona) ? imap.get(idPersona) : '';
                }
            });

            if (this.totalPedidos) this.totalPedidos.textContent = total;
        })
        .catch(e => {
            console.error('Error cargando datos del día:', e);
            alert('Error cargando datos del día. Revisa la consola.');
        });
>>>>>>> hugo
    }
}

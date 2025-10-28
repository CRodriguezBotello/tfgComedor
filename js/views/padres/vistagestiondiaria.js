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
                </div>
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


    cargarListado(hijos, cursosMap = new Map()) {
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
            textarea.className = 'form-control';
            textarea.rows = 1;
            tdIncidencia.appendChild(textarea);
            tr.appendChild(tdIncidencia);

            this.tbody.appendChild(tr);

            
            checkbox.addEventListener('change', () => {
                total = this.div.querySelectorAll('.tupper-checkbox:checked').length;
                if (this.totalPedidos) this.totalPedidos.textContent = total;
            });
        });
    }


    

    cambiarFecha(dias) {
        const input = this.div.querySelector('#fechaDiaria');
        const fecha = new Date(input.value || new Date());
        fecha.setDate(fecha.getDate() + dias);
        input.valueAsDate = fecha;
    }

    seleccionarFecha() {
        const fecha = this.div.querySelector('#fechaDiaria').value;
        console.log("Fecha seleccionada:", fecha);
    }
}

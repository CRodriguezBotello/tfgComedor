// vistagestioncertificados.js
import {Vista} from '../vista.js'; 

export class VistaGestionCertificados extends Vista {
    /**
     * @param {ControladorSecretaria} controlador
     * @param {HTMLElement} divContenedor
     */
    constructor(controlador, divContenedor) {
        // Llama al constructor de la clase base
        super(controlador, divContenedor); 

        this.controlador = controlador;
        this.div = divContenedor;
        // Busca el elemento de la tabla dentro del divContenedor
        this.tabla = divContenedor.querySelector('#tablaCertificados');
        this.thead = null; 
        this.tbody = null;
        
        if (this.tabla) {
            this.thead = this.tabla.querySelector('thead');
            this.tbody = this.tabla.querySelector('tbody');
            //console.log("DEBUG C: tbody encontrado:", !!this.tbody);
            this.inicializar();
        } else {
            console.error("Error: Elemento #tablaCertificados no encontrado en el contenedor.");
        }
    }

    /**
     * Muestra u oculta la vista en el DOM.
     * @param {boolean} visibilidad 
     */
    mostrar(visibilidad = true) {
        if (this.div) {
            if (visibilidad) this.div.classList.remove('d-none');
            else this.div.classList.add('d-none');
        }
    }

    /**
     * Prepara la estructura de la vista (encabezados).
     */
    async inicializar() {
        if (this.thead) {
            // Establecer encabezados de la tabla
            this.thead.innerHTML = `
                <tr>
                    <th>Nombre</th>
                    <th>Apellidos</th>
                    <th>Curso</th>
                    <th>Acciones</th> 
                </tr>
            `;
            
        }
    }

    /**
     * Muestra la lista de alumnos en el cuerpo de la tabla.
     * @param {Array<Object>} lista Lista de alumnos.
     */
    pintarListadoAnual(lista) { 
        console.log("DEBUG VISTA CERTIFICADOS: Empezando a pintar", lista.length, "ítems.");
        
        if (!this.tbody) {
            console.error("Error: Cuerpo de tabla (tbody) no encontrado. La tabla no se puede pintar.");
            return;
        }
        
        // Limpiar contenido anterior
        this.tbody.innerHTML = '';
        
        if (!lista || lista.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" class="text-center">No hay alumnos que cumplan el criterio.</td>`;
            this.tbody.appendChild(tr);
            return;
        }

        lista.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;
            
            tr.innerHTML = `
                <td>${item.nombre ?? '-'}</td>
                <td>${item.apellidos ?? '-'}</td>
                <td>${item.nombreCurso ?? '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-certificado" data-id="${item.id}">Generar Certificado</button>
                </td>
            `;
            this.tbody.appendChild(tr);
        });
        
        // Ejecutar listeners DESPUÉS de pintar, si es necesario (ej: para los botones)
        this.addListenersCertificados();
    }
    
    /**
     * Añade listeners a los botones de Generar Certificado después de pintar la tabla.
     */
    addListenersCertificados() {
        if (!this.tbody) return;
        
        // Buscamos todos los botones que acabamos de pintar
        const botonesCertificado = this.tbody.querySelectorAll('.btn-certificado');
        
        botonesCertificado.forEach(boton => {
            // Pasamos el ID del alumno al controlador
            boton.addEventListener('click', (e) => {
                const alumnoId = e.currentTarget.dataset.id;
                console.log(`DEBUG VISTA: Botón de certificado pulsado para ID: ${alumnoId}`);
                // Aquí deberías llamar al controlador para iniciar la descarga del PDF
                this.controlador.generarCertificado(alumnoId, new Date().getFullYear(), new Date().getFullYear() + 1); 
            });
        });
    }
}
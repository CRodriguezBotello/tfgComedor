import {Vista} from '../vista.js';

/**
 * Contiene la vista de gestión mensual de secretaría.
 */
export class VistaGestionMensual extends Vista {
    /**
	 *	Constructor de la clase.
	 *	@param {ControladorSecretaria} controlador Controlador de la vista.
	 *	@param {HTMLDivElement} div Div de HTML en el que se desplegará la vista.
	 */
    constructor(controlador, div) {
        super(controlador, div);

        this.usuarios = null;
        this.incidencias = null;

        this.btnMesAnterior = this.div.getElementsByClassName('btn-prev')[0];
        this.btnMesSiguiente = this.div.getElementsByClassName('btn-next')[0];
				this.btnQ19 = this.div.querySelectorAll('div>button')[2]

        this.tabla = this.div.querySelector('#tablaGestionMensual');
        this.thead = this.div.getElementsByTagName('thead')[0];
        this.tbody = this.div.getElementsByTagName('tbody')[0];

        this.mesActual = this.obtenerMes();
       
        this.btnMesAnterior.addEventListener('click', this.mesAnterior.bind(this));
        this.btnMesSiguiente.addEventListener('click', this.mesSiguiente.bind(this));
				this.btnQ19.onclick = this.verQ19.bind(this)
       
        this.mes = document.getElementById('mes');
    }

    /**
     * Refrescar/iniciar listado.
     */
    inicializar() {
        this.controlador.obtenerUsuariosMensual(this.mesActual);
        this.mes.textContent = this.obtenerMesActualEnLetras(this.mesActual)
    }

    /**
     * Devuelve el nombre del mes pasado.
     * @param {integer} mes Mes en forma numerica
     * @returns El mes en español correspondiente a la posicion
     */
    obtenerMesActualEnLetras(mes) {
        const meses = [
            "Enero", "Febrero", "Marzo",
            "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre",
            "Octubre", "Noviembre", "Diciembre"
        ];
        
        let mesIndex = mes - 1;
        let mesEnLetras = meses[mesIndex];
        
        return mesEnLetras;
    }

    /**
     * Obtener listado de usuarios que van al comedor, y cargar incidencias.
     * @param {Array} usuarios Array con los apuntados del día actual.
     */
    cargarIncidencias(usuarios) {
        this.usuarios = usuarios;
        if (this.usuarios) this.controlador.obtenerIncidenciasMensual(this.mesActual);
        else this.iniciarTabla();
    }

    /**
     * Obtener incidencias y empezar a generar la tabla.
     * @param {Array} incidencias Incidencias de los usuarios del mes actual.
     */
    cargarListado(incidencias) {
        this.incidencias = incidencias;
        this.iniciarTabla();
    }

    /**
     * Generar tabla por partes.
     */
    iniciarTabla() {
        this.crearEncabezado();
        this.crearCuerpo();
    }

    /**
     * Crear cabecera tabla.
     */
    crearEncabezado() {
        this.thead.innerHTML = '';

        if (this.usuarios) {
            // Segundo tr
            let trInfo = document.createElement('tr');
            let thUsuarios = document.createElement('th');
            thUsuarios.textContent = 'Usuarios';

            let thTipo = document.createElement('th');
            thTipo.textContent = 'Tipo de usuario';

            let thNumeroMenus = document.createElement('th');
            thNumeroMenus.textContent = 'Nº de menús';
            
						let thDias = document.createElement('th');
            thDias.textContent = 'Días';

            let thIncidencias = document.createElement('th');
            thIncidencias.textContent = 'Incidencias';

            trInfo.appendChild(thUsuarios);
            trInfo.appendChild(thTipo);
            trInfo.appendChild(thNumeroMenus)
            trInfo.appendChild(thDias)
            trInfo.appendChild(thIncidencias);

            this.thead.appendChild(trInfo);
        }
    }

    /**
     * Generar cuerpo de la tabla.
     */
    crearCuerpo() {
        this.tbody.innerHTML = '';

        if (this.usuarios){

            for (const usuario of this.usuarios) {
                let tr = document.createElement('tr');
    
                let tdNombre = document.createElement('td');
                tdNombre.textContent = usuario.nombre + " " + usuario.apellidos;
                
                if(tdNombre.textContent.length > 40){
                    tdNombre.textContent = usuario.nombre + "(...)";
                    tdNombre.setAttribute('title', usuario.nombre + " " + usuario.apellidos)
                }
    
                let tdCurso = document.createElement('td');
                tdCurso.textContent = this.obtenerTipo(usuario.correo);
    
                let tdNumeroMenus = document.createElement('td');
                tdNumeroMenus.textContent = usuario.numeroMenus
    
                let tdDias = document.createElement('td');
                tdDias.textContent = usuario.dias
    
                let tdIncidencia = document.createElement('td');
                tdIncidencia.classList.add('small-cell');
    
                let textarea = document.createElement('textarea');
                textarea.setAttribute('rows', '1');
                textarea.disabled = true;

                if (this.incidencias) {
                    for (const incidencia of this.incidencias) {
                        if (incidencia.idPersona == usuario.id && incidencia.incidencias)
                            textarea.value = incidencia.incidencias;
                    }
                }
                tdIncidencia.appendChild(textarea);
    
                tr.appendChild(tdNombre);
                tr.appendChild(tdCurso);
                tr.appendChild(tdNumeroMenus)
                tr.appendChild(tdDias)
                tr.appendChild(tdIncidencia);
    
                this.tbody.appendChild(tr);
            }
        }
        else {
            let tr = document.createElement('tr');
            let tdSinUsuarios = document.createElement('td');

            tdSinUsuarios.setAttribute('colspan', '4')
            tdSinUsuarios.textContent = "No existen registros";

            tr.appendChild(tdSinUsuarios);
            this.tbody.appendChild(tr)
        }
    }

    /**
     * Devuelve el tipo de cuenta que tiene el usuario.
     * @param {String} correo Correo del usuario.
     * @returns {String} Tipo de cuenta.
     */
    obtenerTipo(correo) {
        if (!correo) {
            return 'Hijo';
        }

        if (correo.includes('@alumnado.fundacionloyola.net')) {
            return 'Alumnado';
        }

        if (correo.includes('@fundacionloyola.es')) {
            return 'Personal';
        }
    }

    /**
     * Devuelve el mes en texto.
     * @returns {String} String del mes.
     */
    obtenerMes() {
        let fecha = new Date();
        let mes = fecha.getMonth() + 1; 
        return mes;
    }

    /**
     * Retroceder un mes.
     */
    mesAnterior() {
        this.mesActual = this.mesActual - 1 ;

        if (this.mesActual < 1) {
            this.mesActual = 12
        }

        this.inicializar();
    }

    /**
     * Avanzar un mes.
     */
    mesSiguiente() {
        this.mesActual = this.mesActual + 1;

        if (this.mesActual > 12) {
            this.mesActual = 1
        }

        this.inicializar();
    }

    mostrar(ver) {
        super.mostrar(ver);
        if (ver) this.inicializar();    // Al volver a mostrar la vista, refrescar listado.
    }

		verQ19(){
			this.controlador.verQ19(this.mesActual)
		}
}

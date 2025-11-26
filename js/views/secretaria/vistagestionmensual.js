import {Vista} from '../vista.js';
/**
 * Contiene la vista de gestión mensual de secretaría.
 */
export class VistaGestionMensual extends Vista {
    /**
     *  Constructor de la clase.
     *  @param {ControladorSecretaria} controlador Controlador de la vista.
     *  @param {HTMLDivElement} div Div de HTML en el que se desplegará la vista.
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

        // NUEVO: propiedades para precios (se rellenan desde el controlador)
        this.precioMenu = null;     // número o array [normal, profesor/reducido]
        this.precioTupper = null;   // número
    }
    /**
     * Refrescar/iniciar listado.
     */
    inicializar() {
        // Pedir constantes de precios al controlador si está disponible
        const promPrecios = (this.controlador && typeof this.controlador.obtenerConstantesPrecios === 'function')
            ? this.controlador.obtenerConstantesPrecios()
            : (this.controlador && typeof this.controlador.constanteMenu === 'function' && typeof this.controlador.constanteTupper === 'function')
                ? Promise.resolve({ precioMenu: this.controlador.constanteMenu(), precioTupper: this.controlador.constanteTupper() })
                : Promise.resolve(null);

        promPrecios
            .then(precios => {
                if (precios) {
                    if (precios.precioMenu !== undefined) this.precioMenu = precios.precioMenu;
                    if (precios.precioTupper !== undefined) this.precioTupper = precios.precioTupper;
                }
            })
            .catch(err => console.warn('No se pudieron obtener precios:', err))
            .finally(() => {
                this.controlador.obtenerUsuariosMensual(this.mesActual);
                this.mes.textContent = this.obtenerMesActualEnLetras(this.mesActual);
            });
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
            let thNumeroTuppers = document.createElement('th');
            thNumeroTuppers.textContent = 'Nº de Tuppers';
            let thDias = document.createElement('th');
            thDias.textContent = 'Días';
            let thIncidencias = document.createElement('th');
            thIncidencias.textContent = 'Incidencias';
            let thtotal = document.createElement('th');
            thtotal.textContent = 'Importe total';
            trInfo.appendChild(thUsuarios);
            trInfo.appendChild(thTipo);
            trInfo.appendChild(thNumeroMenus);
            trInfo.appendChild(thNumeroTuppers);
            trInfo.appendChild(thDias);
            trInfo.appendChild(thIncidencias);
            trInfo.appendChild(thtotal);
            this.thead.appendChild(trInfo);
        }
    }
    /**
     * Generar cuerpo de la tabla.
     */
    crearCuerpo() {
        this.tbody.innerHTML = '';
        if (this.usuarios){
            console.log(this.usuarios);
            for (const usuario of this.usuarios) {
                console.log(usuario);
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
                let tdNumeroTuppers = document.createElement('td');
                tdNumeroTuppers.textContent = usuario.tupper;
                let tdDias = document.createElement("td");
                // Convertimos usuario.dias a array de números
                const dias = usuario.dias
                ? usuario.dias.split(", ").map(Number)
                : [];
                // Convertimos usuario.diasTupper a array de números (si existe)
                const diasTupper = usuario.diasTupper
                ? usuario.diasTupper.split(", ").map(Number)
                : [];
                // Construimos el contenido coloreado
                tdDias.innerHTML = dias
                .map(dia => {
                    if (diasTupper.includes(dia)) {
                    return `<span style="color:red">${dia}</span>`;
                    }
                    return `<span style="color:black">${dia}</span>`;
                })
                .join(", ");
                let tdIncidencia = document.createElement('td');
                tdIncidencia.classList.add('small-cell');
                let textarea = document.createElement('textarea');
                textarea.setAttribute('rows', '1');
                textarea.disabled = true;
                let tdtotal = document.createElement('td');
                // Preferir importe calculado en BBDD/Q19 (varias claves posibles)
                let importeServidor = null;
                if (usuario.importe !== undefined && usuario.importe !== null && usuario.importe !== '') importeServidor = parseFloat(usuario.importe);
                else if (usuario.total !== undefined && usuario.total !== null && usuario.total !== '') importeServidor = parseFloat(usuario.total);
                else if (usuario.total_q19 !== undefined && usuario.total_q19 !== null && usuario.total_q19 !== '') importeServidor = parseFloat(usuario.total_q19);


                if (Number.isFinite(importeServidor)) {
                    tdtotal.textContent = importeServidor.toFixed(2) + ' €';
                } else {
                    // Fallback: replicar cálculo del Q19 (usar constantes del controlador si existen)
                    // Obtener precios prefiriendo los traídos desde la BBDD (this.precioMenu / this.precioTupper).
                    // Si no están, intentar obtener desde funciones del controlador; si no hay nada, usar 0.
                    const precioMenuCtrl = (this.controlador && typeof this.controlador.constanteMenu === 'function') ? this.controlador.constanteMenu() : null;
                    const precioTupperCtrl = (this.controlador && typeof this.controlador.constanteTupper === 'function') ? this.controlador.constanteTupper() : null;


                    // precioTupper: prioridad -> this.precioTupper -> precioTupperCtrl -> 0
                    const precioTupper = (this.precioTupper !== null && Number.isFinite(Number(this.precioTupper)))
                        ? Number(this.precioTupper)
                        : (Number.isFinite(Number(precioTupperCtrl)) ? Number(precioTupperCtrl) : 0);

                    // precioMenu: prioridad -> this.precioMenu -> precioMenuCtrl -> 0
                    let precioMenu = 0;
                    let precioMenuProfesor = null;
                    if (this.precioMenu !== null) {
                        if (Array.isArray(this.precioMenu) && this.precioMenu.length) {
                            precioMenu = Number(this.precioMenu[0]) || 0;
                            if (this.precioMenu.length > 1) precioMenuProfesor = Number(this.precioMenu[1]) || null;
                        } else {
                            precioMenu = Number(this.precioMenu) || 0;
                        }
                    } else if (Array.isArray(precioMenuCtrl) && precioMenuCtrl.length) {
                        precioMenu = Number(precioMenuCtrl[0]) || 0;
                        if (precioMenuCtrl.length > 1) precioMenuProfesor = Number(precioMenuCtrl[1]) || null;
                    } else if (Number.isFinite(Number(precioMenuCtrl))) {
                        precioMenu = Number(precioMenuCtrl) || 0;
                    }


                    // Si hay precio específico para personal (profesor), usarlo
                    if (usuario.correo && /@fundacionloyola\.es$/.test(usuario.correo) && Number.isFinite(precioMenuProfesor)) {
                        precioMenu = precioMenuProfesor;
                    }

                    const diasCount = Array.isArray(dias) ? dias.length : 0;
                    const diasTupperCount = Array.isArray(diasTupper) ? diasTupper.length : 0;
                    const importeCalc = diasCount * precioMenu + diasTupperCount * precioTupper;
                    tdtotal.textContent = importeCalc.toFixed(2) + ' €';
                }
                if (this.incidencias) {
                    for (const incidencia of this.incidencias) {
                        if (incidencia.idPersona == usuario.id && incidencia.incidencias)
                            textarea.value = incidencia.incidencias;
                    }
                }
                tdIncidencia.appendChild(textarea);
                tr.appendChild(tdNombre);
                tr.appendChild(tdCurso);
                tr.appendChild(tdNumeroMenus);
                tr.appendChild(tdNumeroTuppers);
                tr.appendChild(tdDias);
                tr.appendChild(tdIncidencia);
                tr.appendChild(tdtotal);
                this.tbody.appendChild(tr);
            }
        }
        else {
            let tr = document.createElement('tr');
            let tdSinUsuarios = document.createElement('td');
            tdSinUsuarios.setAttribute('colspan', '7')
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
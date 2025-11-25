import {Vista} from '../vista.js';
/**
 * Contiene la vista de gestión mensual de secretaría.
 */
export class VistaResumenMensual extends Vista {
    /**
     *  Constructor de la clase.
     *  @param {ControladorPadres} controlador Controlador de la vista.
     *  @param {HTMLDivElement} div Div de HTML en el que se desplegará la vista.
     */
    constructor(controlador, div) {
        super(controlador, div);
        this.usuarios = null;
        this.incidencias = null;
        this.btnMesAnterior = this.div.getElementsByClassName('btn-prev')[0];
        this.btnMesSiguiente = this.div.getElementsByClassName('btn-next')[0];
        this.tabla = this.div.querySelector('#tablaResumenMensual');
        this.thead = this.div.getElementsByTagName('thead')[0];
        this.tbody = this.div.getElementsByTagName('tbody')[0];
        this.mesActual = this.obtenerMes();
        this.btnMesAnterior.addEventListener('click', this.mesAnterior.bind(this));
        this.btnMesSiguiente.addEventListener('click', this.mesSiguiente.bind(this));
        this.mes = document.getElementById('mes');

        // nuevos: precios usados para cálculo
        this.precioMenu = null;   // número o array [normal, profesor]
        this.precioTupper = null; // número
    }
    /**
     * Refrescar/iniciar listado.
     */
    inicializar() {
        this.controlador.obtenerUsuariosMensual(this.mesActual);
        this.mes.textContent = this.obtenerMesActualEnLetras(this.mesActual);
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
    async iniciarTabla() {
        await this.obtenerPrecios();
        this.crearEncabezado();
        await this.crearCuerpo();
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
    async crearCuerpo() {
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
                tdNumeroMenus.textContent = usuario.numeroMenus || 0;
                let tdNumeroTuppers = document.createElement('td');
                tdNumeroTuppers.textContent = usuario.tupper || 0;
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

                // td para importe calculado
                let tdtotal = document.createElement('td');

                // calcular importe: prioridad al total devuelto por servidor si existe
                let importe = null;
                if (usuario.total !== undefined && usuario.total !== null && usuario.total !== '') {
                    const v = Number(usuario.total);
                    if (!isNaN(v)) importe = v;
                }

                // si no hay importe, calcularlo localmente
                if (importe === null) {
                    const numeroMenus = Number(usuario.numeroMenus) || dias.length || 0;
                    const numeroTuppers = Number(usuario.tupper) || diasTupper.length || 0;
                    const calc = this._calcularImporte(numeroMenus, numeroTuppers, usuario);
                    if (calc !== null) importe = calc;
                }

                tdtotal.textContent = (importe !== null && !isNaN(importe)) ? `${importe.toFixed(2)} €` : '—';

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

    /**
     * Obtiene precios desde el controlador (si existe) o desde el endpoint y los guarda en this.precioMenu/this.precioTupper
     */
    async obtenerPrecios() {
        if (this.precioMenu !== null || this.precioTupper !== null) return;
        // pedir al controlador si soporta obtenerConstantesPrecios
        try {
            if (this.controlador && typeof this.controlador.obtenerConstantesPrecios === 'function') {
                const p = await this.controlador.obtenerConstantesPrecios();
                if (p) {
                    this.precioMenu = p.precioMenu ?? this.precioMenu;
                    this.precioTupper = p.precioTupper ?? this.precioTupper;
                }
            }
        } catch (e) {
            console.warn('Error al pedir precios al controlador', e);
        }
        // fallback: intentar endpoint directo
        if (this.precioMenu === null || this.precioTupper === null) {
            try {
                const r = await fetch('php/api/controllers/precios.php');
                if (r.ok) {
                    const data = await r.json();
                    // aceptar varias formas de respuesta
                    if (Array.isArray(data)) {
                        // buscar por claves conocidas
                        const find = (key) => {
                            const it = data.find(d => d.clave === key || d.idPrecio === key || d.codigo === key);
                            return it ? Number(it.cantidad || it.valor || it.precio) : null;
                        };
                        this.precioTupper = this.precioTupper ?? find('precioTupper') ?? find('tupper') ?? this.precioTupper;
                        const pm = find('precioDiario') ?? find('precio_menu') ?? find('precioMenu') ?? null;
                        if (pm !== null) this.precioMenu = this.precioMenu ?? pm;
                    } else if (data && typeof data === 'object') {
                        this.precioMenu = this.precioMenu ?? (data.precioMenu ?? data.precio_menu ?? data.precio_diario ?? null);
                        this.precioTupper = this.precioTupper ?? (data.precioTupper ?? data.precio_tupper ?? null);
                    }
                }
            } catch (err) {
                console.warn('No se pudieron obtener precios desde endpoint', err);
            }
        }
        // valores por defecto si aún no definidos
        if (this.precioMenu === null) this.precioMenu = 7.5;
        if (this.precioTupper === null) this.precioTupper = 0.6;
    }

    /**
     * Calcula importe con los precios ya cargados.
     */
    _calcularImporte(numeroMenus, numeroTuppers, usuario) {
        // precioMenu puede ser número o array [normal, profesor]
        let precioMenu = 7.5;
        let precioMenuProfesor = null;
        if (this.precioMenu !== null) {
            if (Array.isArray(this.precioMenu)) {
                precioMenu = Number(this.precioMenu[0]) || precioMenu;
                precioMenuProfesor = this.precioMenu.length > 1 ? Number(this.precioMenu[1]) : null;
            } else {
                precioMenu = Number(this.precioMenu) || precioMenu;
            }
        }
        // usar precio profesor si el correo indica personal y existe precioProfesor
        if (usuario && usuario.correo && /@fundacionloyola\.es$/.test(usuario.correo) && Number.isFinite(precioMenuProfesor)) {
            precioMenu = precioMenuProfesor;
        }
        const precioTupper = Number(this.precioTupper) || 0;
        return numeroMenus * precioMenu + numeroTuppers * precioTupper;
    }
}
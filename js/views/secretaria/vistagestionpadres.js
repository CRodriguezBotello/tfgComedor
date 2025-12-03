import {Vista} from '../vista.js';
/**
 * Contiene la vista de gestión de padres de secretaría
 */
export class VistaGestionPadres extends Vista {
    /**
	 *	Constructor de la clase.
	 *	@param {ControladorSecretaria} controlador Controlador de la vista.
	 *	@param {HTMLDivElement} div Div de HTML en el que se desplegará la vista.
	 */
    constructor(controlador, div) {
        super(controlador, div);

        this.idUsuario = 0;
        this.padres = null;
        this.busqueda = null;

        // Secciones de la vista
        this.divListadoPadres = this.div.querySelector('#divListadoPadres');
        this.divModificacionPadres = this.div.querySelector('#divModificacionPadres');

        //Elementos vista listado padres
        this.tabla = this.div.querySelector('#tablaGestionPadres');
        this.thead = this.div.getElementsByTagName('thead')[0];
        this.tbody = this.div.getElementsByTagName('tbody')[0];
        this.txtBusqueda = this.div.getElementsByTagName('input')[0];
        this.btnBuscar = this.div.getElementsByTagName('button')[0];

        this.btnBuscar.addEventListener('click', this.buscar.bind(this))

        //Elementos vista modificar padres
        this.formModificar = this.div.querySelector('#formModificacionPadres');
        this.btnCancelarMod = this.div.getElementsByTagName('button')[1];
        this.btnActualizar = this.div.getElementsByTagName('button')[2];
        this.divExitoModificar = this.div.querySelector('#divExitoModificacion');
        this.divErrorModificar = this.div.querySelector('#divErrorModificacion');
        this.divCargandoModificar = this.div.querySelector('#loadingImgModificacion');
        this.inputsModificar = this.formModificar.getElementsByTagName('input');

        this.btnActualizar.addEventListener('click', this.validarFormulario.bind(this));
        this.btnCancelarMod.addEventListener('click', this.cancelarModificacion.bind(this));

        //Inicio de las vistas
        this.mostrarOcultarCrud(true, false);
    }

    /**
     * Realizar búsqueda de padres.
     */
    buscar() {
        this.busqueda = this.txtBusqueda.value;
        this.inicializar();
    }

    /**
     * Mostrar/Ocultar crud padres.
     * @param {Boolean} listado Mostrar o no listado de padres.
     * @param {Boolean} modificacion Mostrar o no modificación de padres.
     */
    mostrarOcultarCrud(listado, modificacion) {
        this.divListadoPadres.style.display = listado ? 'block' : 'none';
        this.divModificacionPadres.style.display = modificacion ? 'block' : 'none';
    }

    /**
     * Refrescar/iniciar listado.
     */
    inicializar() {
        this.controlador.obtenerListadoPadres(this.busqueda);
    }

    /**
     * Generar tabla por partes.
     */
    iniciarTabla(padres) {
        this.padres = padres;
        this.crearEncabezado();
        this.crearCuerpo();
    }

    /**
     * Crear cabecera tabla.
     */
    crearEncabezado() {
        this.thead.innerHTML = '';

        if (this.padres) {
            let trInfo = document.createElement('tr');

            let thPadres = document.createElement('th');
            thPadres.textContent = 'Padres';
            trInfo.appendChild(thPadres);

            let thCorreo = document.createElement('th');
            thCorreo.textContent = 'Email'
            trInfo.appendChild(thCorreo)
            
						let thTelefono = document.createElement('th');
            thTelefono.textContent = 'Teléfono'
            trInfo.appendChild(thTelefono)

						let thHijos = document.createElement('th');
            thHijos.textContent = 'Hijos'
            trInfo.appendChild(thHijos)

            this.thead.appendChild(trInfo);
        }
    }

    /**
     * Generar cuerpo de la tabla.
    */
    crearCuerpo() {
        this.tbody.innerHTML = '';
        
        if (this.padres) {
            for (const padre of this.padres) {
                let tr = document.createElement('tr');
    
                let tdNombre = document.createElement('td');
                tdNombre.classList.add('nombrePadre');
                tdNombre.textContent = padre.nombre + " " + padre.apellidos;
                
                if (tdNombre.textContent.length > 40) {
                    tdNombre.textContent = padre.nombre + "(...)";
                    tdNombre.setAttribute('title', padre.nombre + " " + padre.apellidos)
                }

                tdNombre.onclick = this.editar.bind(this, padre)
            
                let tdEmail = document.createElement('td');
                tdEmail.textContent = padre.correo

                //Esto hace un control para que si el correo es muy largo pues lo recorte a 40 caracteres
                if (tdEmail.textContent.length > 40) {
                    while (tdEmail.textContent.length > 40) {
                        tdEmail.textContent = tdEmail.textContent.substring(0, tdEmail.textContent.length - 1);
                    }

                    tdEmail.textContent = tdEmail.textContent + "(...)";
                    tdEmail.setAttribute('title', padre.correo)
                }

                let tdTelefono = document.createElement('td');
                tdTelefono.textContent = padre.telefono

                let tdHijos = document.createElement('td');
                tdHijos.textContent = padre.hijos

                tr.appendChild(tdNombre);
                tr.appendChild(tdEmail);
                tr.appendChild(tdTelefono);
                tr.appendChild(tdHijos);
                this.tbody.appendChild(tr);
            }
        }
        else {
            let tr = document.createElement('tr');
            let tdSinUsuarios = document.createElement('td');

            //tdSinUsuarios.setAttribute('colspan', '4')
            tdSinUsuarios.textContent = "No existen registros";

            tr.appendChild(tdSinUsuarios);
            this.tbody.appendChild(tr)
        }
    }

    /**
     * Poner datos actuales en los campos del formulario de modificación.
     * @param {Object} padre Objeto con los datos.
     */
    editar(padre) {
        this.mostrarOcultarCrud(false, true);
        console.log('Padre seleccionado:', padre);
        this.idUsuario = padre.id;

        const nombreEl = document.getElementById('nombre');
        if (nombreEl) nombreEl.value = padre.nombre || '';

        const apellidosEl = document.getElementById('apellidos');
        if (apellidosEl) apellidosEl.value = padre.apellidos || '';

        const correoEl = document.getElementById('correo');
        if (correoEl) correoEl.value = padre.correo || '';

        const telefonoEl = document.getElementById('telefono');
        if (telefonoEl) telefonoEl.value = padre.telefono || '';

        const dniEl = document.getElementById('dniModificacionPadres');
        if (dniEl) dniEl.value = padre.dni || '';

        const ibanEl = document.getElementById('iban');
        if (ibanEl) ibanEl.value = padre.iban || '';

        const titularEl = document.getElementById('titular');
        if (titularEl) titularEl.value = padre.titular || '';

        const fechaMandatoEl = document.getElementById('fechaMandato');
        if (fechaMandatoEl) fechaMandatoEl.value = padre.fechaFirmaMandato || '';


        // asignar id en hidden y en el controlador
        const idHidden = document.getElementById('idPadre');
        if (idHidden) idHidden.value = padre.id ?? padre.ID ?? '';

        // Cuando se selecciona un padre para editar:
        window.controladorSecretaria.padreActual = padre; // Guarda el objeto completo
    }

    /**
     * Limpia los campos del formulario modificación.
     */
    cancelarModificacion() {
        for (let input of this.inputsModificar)
            input.value = '';

        if (this.divErrorModificar.style.display == 'block')
            this.divErrorModificar.style.display = 'none';

        this.mostrarOcultarCrud(true, false);
    }

    /**
     * Informar al usuario de la modificación exitosa.
     */
    exitoModificacion() {
        this.bloquearBotones(false);
        this.formModificar.classList.remove('was-validated');
        this.divCargandoModificar.style.display = 'none';

        this.mostrarOcultarCrud(true, false);
        this.divExitoModificar.style.display = 'block';
        this.temporizadorAviso();
    }

    /**
     * Ocultar aviso de éxito a los 5 segundos.
     */
    temporizadorAviso() {
        setTimeout(() => {
            if (this.divExitoModificar.style.display != 'none') {
                this.divExitoModificar.style.display = 'none';
            } 
        }, 5000);
    }

    /**
     * Aviso de error de modificación de datos al usuario.
     * @param {Object} e Error.
     */
    errorModificacion(e) {
        this.formModificar.classList.remove('was-validated');
        this.divCargandoModificar.style.display = 'none';
        this.bloquearBotones(false);

        if (e != null) {
            if (e == 'Error: 500 - Internal Server Error 1') {
                this.divErrorModificar.innerHTML = '<p>Ya existe una cuenta con esa dirección de correo.</p>';
            }
            else {
                this.divErrorModificar.innerHTML = '<p>' + e + '</p>';
            }

            this.divErrorModificar.style.display = 'block';
            window.scrollTo(0, document.body.scrollHeight);
        }
        else {
            this.divErrorModificar.style.display = 'none';
        }
    }

    /**
     * Bloquear/desbloquear botones.
     * @param {Boolean} bloquear Bloquear o no.
     */
    bloquearBotones(bloquear) {
        this.btnActualizar.disabled = bloquear;
        this.btnCancelarMod.disabled = bloquear;
    }

    /**
     * Valida los campos del formulario y realiza el proceso de modificar.
     */
    validarFormulario() {
        let cont;
        let total = this.inputsModificar.length;

        for (cont=0; cont<total; cont++) {
            if (!this.inputsModificar[cont].checkValidity()) break;
        }

        this.formModificar.classList.add('was-validated');

        if (cont == total) {
            // Envío sólo los campos básicos para evitar que el backend intente actualizar
            // una columna que no existe (referenciaUnicaMandato).
            const datos = {
                'id': this.idUsuario,
                'nombre': getInputValue(this.formModificar, 'nombre'),
                'apellidos': getInputValue(this.formModificar, 'apellidos'),
                'correo': getInputValue(this.formModificar, 'correo'),
                'telefono': getInputValue(this.formModificar, 'telefono'),
                'dni': getInputValue(this.formModificar, 'dni'),
                'iban': getInputValue(this.formModificar, 'iban'),
                'titular': getInputValue(this.formModificar, 'titular'),
                'fechaFirmaMandato': getInputValue(this.formModificar, 'fechaFirmaMandato')
                

                // NOTA: omito 'fechaMandato' y 'mandatoUnico' / 'referenciaUnicaMandato'
            };

            if (this.divErrorModificar.style.display == 'block')
                this.divErrorModificar.style.display = 'none';

            this.bloquearBotones(true);
            this.divCargandoModificar.style.display = 'block';
            this.controlador.modificarPadre(datos);
        }
    }

    mostrar(ver) {
        super.mostrar(ver);

        if (ver) {
            this.mostrarOcultarCrud(true, false);
            this.inicializar();    // Al volver a mostrar la vista, refrescar listado.
        }

        if (this.divExitoModificar.style.display == 'block')
            this.divExitoModificar.style.display = 'none';

        if (this.divErrorModificar.style.display == 'block')
            this.divErrorModificar.style.display = 'none';
    }

    // Añadir función utilitaria para formatear la fecha que viene de la BBDD
    _formatearFechaBD(fecha) {
        if (!fecha) return '';
        // Si es número (timestamp unix)
        if (typeof fecha === 'number') return new Date(fecha * 1000).toLocaleDateString('es-ES');
        // Aceptar formatos "YYYY-MM-DD HH:MM:SS" y "YYYY-MM-DDTHH:MM:SS..."
        let f = String(fecha).trim();
        // si contiene espacio (mysql DATETIME) reemplazamos por T para parseo ISO
        if (f.includes(' ') && !f.includes('T')) f = f.replace(' ', 'T');
        const d = new Date(f);
        if (!isNaN(d)) return d.toLocaleDateString('es-ES');
        // fallback: si no se puede parsear devolver la parte fecha antes de espacio
        if (String(fecha).includes(' ')) return String(fecha).split(' ')[0];
        return String(fecha);
    }

    /**
     * Crear fila de usuario en la tabla.
     * @param {Object} usuario Objeto con los datos del usuario.
     */
    crearFilaUsuario(usuario) {
        let tr = document.createElement('tr');
        
        // campo Nombre
        let tdNombre = document.createElement('td');
        tdNombre.classList.add('nombrePadre');
        tdNombre.textContent = usuario.nombre + " " + usuario.apellidos;
        
        if (tdNombre.textContent.length > 40) {
            tdNombre.textContent = usuario.nombre + "(...)";
            tdNombre.setAttribute('title', usuario.nombre + " " + usuario.apellidos)
        }

        tdNombre.onclick = this.editar.bind(this, usuario)
        tr.appendChild(tdNombre);
        
        // campo Email
        let tdEmail = document.createElement('td');
        tdEmail.textContent = usuario.correo;
        // recortar email largo
        if (tdEmail.textContent.length > 40) {
            tdEmail.textContent = tdEmail.textContent.substring(0, 40) + "...";
            tdEmail.setAttribute('title', usuario.correo);
        }
        tr.appendChild(tdEmail);
        
        // campo Teléfono
        let tdTelefono = document.createElement('td');
        tdTelefono.textContent = usuario.telefono;
        tr.appendChild(tdTelefono);
        
        // campo hijos (nombres)
        let tdHijos = document.createElement('td');
        tdHijos.textContent = usuario.hijos;
        tr.appendChild(tdHijos);
        
        // campo Fecha Mandato: usar la fecha que venga de la BBDD (soporta fecha con hora)
        const tdFechaMandato = document.createElement('td');
        // probar varias claves posibles que devuelva el servidor
        const fechaBD = usuario.fechaMandato ?? usuario.fecha_mandato ?? usuario.fechaFirmaMandato ?? usuario.fecha_mandato_db;
        tdFechaMandato.textContent = this._formatearFechaBD(fechaBD);
        tr.appendChild(tdFechaMandato);
        
        this.tbody.appendChild(tr);
    }
}

/**
 * Devuelve el valor de un campo buscando por id, por name o en el form.
 * Evita el error al leer .value cuando el elemento no existe.
 */
function getInputValue(form, name) {
    const byId = document.getElementById(name);
    if (byId) return byId.value;
    const byName = document.querySelector(`input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`);
    if (byName) return byName.value;
    if (form && form.elements && form.elements[name]) return form.elements[name].value;
    return null;
}

VistaGestionPadres.prototype.validarFormulario = function(form){
    let cont;
    let total = this.inputsModificar.length;

    for (cont=0; cont<total; cont++) {
        if (!this.inputsModificar[cont].checkValidity()) break;
    }

    this.formModificar.classList.add('was-validated');

    if (cont == total) {
        // Envío sólo los campos básicos para evitar que el backend intente actualizar
        // una columna que no existe (referenciaUnicaMandato).
        const datos = {
            'id': this.idUsuario,
            'nombre': getInputValue(form, 'nombre'),
            'apellidos': getInputValue(form, 'apellidos'),
            'correo': getInputValue(form, 'correo'),
            'telefono': getInputValue(form, 'telefono'),
            'dni': getInputValue(form, 'dni'),
            'iban': getInputValue(form, 'iban'),
            'titular': getInputValue(form, 'titular'),
            'fechaFirmaMandato': getInputValue(form, 'fechaFirmaMandato') // ← AÑADIR AQUÍ TAMBIÉN
            // NOTA: omito 'fechaMandato' y 'mandatoUnico' / 'referenciaUnicaMandato'
        };

        if (this.divErrorModificar.style.display == 'block')
            this.divErrorModificar.style.display = 'none';

        this.bloquearBotones(true);
        this.divCargandoModificar.style.display = 'block';
        this.controlador.modificarPadre(datos);
    }
}

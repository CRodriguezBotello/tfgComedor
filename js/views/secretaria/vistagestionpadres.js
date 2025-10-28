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
        this.idUsuario = padre.id;
        this.inputsModificar[0].value = padre.nombre;
        this.inputsModificar[1].value = padre.apellidos;
        this.inputsModificar[2].value = padre.correo;
        this.inputsModificar[3].value = padre.telefono;
        this.inputsModificar[4].value = padre.dni;
        this.inputsModificar[5].value = padre.iban;
        this.inputsModificar[6].value = padre.titular;
        this.inputsModificar[7].value = padre.fechaFirmaMandato;
        this.inputsModificar[8].value = padre.referenciaUnicaMandato;
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
            const datos = {
                'id': this.idUsuario,
                'nombre': this.inputsModificar[0].value,
                'apellidos': this.inputsModificar[1].value,
                'correo': this.inputsModificar[2].value,
                'telefono': this.inputsModificar[3].value,
                'dni': this.inputsModificar[4].value,
                'iban': this.inputsModificar[5].value,
                'titular': this.inputsModificar[6].value,
                'fechaMandato': this.inputsModificar[7].value,
                'mandatoUnico': this.inputsModificar[8].value

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
}

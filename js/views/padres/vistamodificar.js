import {Vista} from '../vista.js';

/**
 * Contiene la vista de modificación de datos de padres
 */
export class VistaModificarPadres extends Vista {
    /**
	 *	Constructor de la clase.
	 *	@param {Controlador} controlador Controlador de la vista.
	 *	@param {HTMLDivElement} div Div de HTML en el que se desplegará la vista.
	 */
    constructor(controlador, div) {
        super(controlador, div);

        this.form = this.div.getElementsByTagName('form')[0];
        this.inputs = this.div.getElementsByTagName('input');
        this.btnActualizar = this.div.getElementsByTagName('button')[0];
        this.btnBorrarCuenta = this.div.getElementsByTagName('button')[1];
        this.divExito = this.div.querySelector('#divExitoModificacion');
        this.divError = this.div.querySelector('#divErrorModificacion');
        this.divErrorBorrado = this.div.querySelector('#divErrorBorrado');
        this.idUsuario = 0;
        this.divCargando = this.div.querySelector('#loadingImg');

        this.btnActualizar.addEventListener('click', this.validarFormulario.bind(this));
        this.btnBorrarCuenta.addEventListener('click', this.confirmacionBorrado.bind(this));
    }

    /**
     * Actualiza los campos con los datos del usuario actual.
     * @param {Object} datos Datos del usuario.
     */
    actualizarCampos(datos) {
        this.inputs[0].value = datos.nombre;
        this.inputs[1].value = datos.apellidos;
        this.inputs[2].value = datos.telefono;
        this.inputs[3].value = datos.correo;
        this.inputs[4].value = datos.iban;
        this.idUsuario = datos.id;
    }

    /**
     * Confirmar borrado cuenta padre.
     */
    confirmacionBorrado() {
        if (confirm("¿Estas seguro de que desea eliminar su cuenta? Esta operación es irreversible.")) {
            this.controlador.eliminarCuentaPadre(this.idUsuario);
            this.btnBorrarCuenta.disabled = true;
        }
    }

    /**
     * Aviso de error de borrado de cuenta al usuario.
     * @param {Object} e Error.
     */
    errorBorrado(e) {
        this.btnBorrarCuenta.disabled = false;
        
        if (e != null) {
            if (e == 'Error: 400 - Bad Request 1') {
                this.divErrorBorrado.innerHTML = '<p>No puedes eliminar tu cuenta si tienes hijos asociados.</p>';
            }
            else {
                this.divErrorBorrado.innerHTML = '<p>' + e + '</p>';
            }

            this.divErrorBorrado.style.display = 'block';
            window.scrollTo(0, document.body.scrollHeight);
        }
        else {
            this.divErrorBorrado.style.display = 'none';
        }
    }

    /**
     * Aviso de error de modificación de datos al usuario.
     * @param {Object} e Error.
     */
    errorModificacion(e) {
        this.divCargando.style.display = 'none';
        this.btnActualizar.disabled = false;
        
        if (e != null) {
            if (e == 'Error: 500 - Internal Server Error 1') {
                this.divError.innerHTML = '<p>Ya existe una cuenta con esa dirección de correo.</p>';
            }
            else {
                this.divError.innerHTML = '<p>' + e + '</p>';
            }

            this.divError.style.display = 'block';
            window.scrollTo(0, document.body.scrollHeight);
        }
        else {
            this.divError.style.display = 'none';
        }
    }

    /**
     * Valida los campos del formulario y realiza el proceso de modificar.
     */
    validarFormulario() {
        let cont;
        let total = this.inputs.length;

        for (cont=0; cont<total; cont++) {
            if (!this.inputs[cont].checkValidity()) break;
        }

        this.form.classList.add('was-validated');

        if (this.divExito.style.display == 'block') 
            this.exito(false);
            
        if (this.divError.style.display == 'block') 
            this.divError.style.display = 'none'

        if (cont == total) {
            const datos = {
                'id': this.idUsuario,
                'nombre': this.inputs[0].value,
                'apellidos': this.inputs[1].value,
                'telefono': this.inputs[2].value,
                'correo': this.inputs[3].value,
                'iban': this.inputs[4].value
            };

            this.btnActualizar.disabled = true;
            this.divCargando.style.display = 'block';
            this.controlador.modificarPadre(datos);
        }
    }

    /**
     * Informar al usuario de la modificación exitosa.
     * @param {Boolean} activar Activar o no mensaje de éxito.
     */
    exito(activar) {
        this.form.classList.remove('was-validated');
        this.divCargando.style.display = 'none';
        this.btnActualizar.disabled = false;
        this.divExito.style.display = activar ? 'block' : 'none';
    }

	mostrar(ver) {
		super.mostrar(ver);
		
        if (this.divExito.style.display == 'block')
            this.exito(false);

        if (this.divError.style.display == 'block')
            this.divError.style.display = 'none'

        if (this.divErrorBorrado.style.display == 'block')
            this.divErrorBorrado.style = 'none';
	}
}
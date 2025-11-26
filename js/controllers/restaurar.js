import { Rest } from "../services/rest.js";

/**
 * Se encarga de gestionar que se pueda dar de alta una nueva contraseña.
 * Y de darla de alta de ser así. 
 */
class Restaurar {
    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
    }

    /**
     * Inicia al cargar la página.
     */
    iniciar() {
        this.idUsuario = null;

        this.form = document.getElementsByTagName('form')[0];
        this.campo1 = document.getElementsByTagName('input')[0];
        this.campo2 = document.getElementsByTagName('input')[1];
        this.btnCancelar = document.getElementsByTagName('button')[0];
        this.btnAceptar = document.getElementsByTagName('button')[1];
        this.divExito = document.getElementById('divExito');
        this.divError = document.getElementById('divError');
        this.divCargando = document.getElementById('loadingImg');

        this.btnCancelar.addEventListener('click', this.redireccionar.bind(this));
        this.btnAceptar.addEventListener('click', this.validar.bind(this));
        this.validarCodigo();
    }

    /**
     * Comprobar si se puede restaurar la contraseña o no.
     */
    validarCodigo() {
        let path = window.location.search.substring(1, 7);  // Obtener el nombre solamente (codigo)
        let query = window.location.search.substring(8);   // Obtener el ID sin la parte de "?codigo="

        Rest.get('restaurar', [path], [query])
         .then(id => {
             this.idUsuario = id;
             this.btnAceptar.disabled = false;
         })
         .catch(e => {
             this.error(e, true);
         })
    }

    /**
     * Comprueba que las contraseñas sean correctas y comienza el proceso.
     */
    validar() {
        this.campo2.setCustomValidity('');
        this.form.classList.add('was-validated');

        if (this.campo1.checkValidity() && this.campo2.checkValidity()) {
            if (this.campo1.value == this.campo2.value) {
                
                this.divCargando.style.display = 'block';
                this.actualizarClave(this.idUsuario);
            }
            else {
                this.campo2.setCustomValidity('Las contraseñas no coindicen.');
                this.campo2.reportValidity();
            }
        }
    }

    /**
     * Realiza petición para actualiza la contraseña.
     * @param {Number} id ID del usuario.
     */
    actualizarClave(id) {
        const datos = {
            'id' : id,
            'clave' : this.campo1.value
        };

        Rest.put('restaurar', [], datos, false)
         .then(() => {
             this.exito();
         })
         .catch(e => {
             this.error(e, false);
         })
    }

    /**
     * Informa al usuario del éxito del proceso y redirige.
     */
    exito() {
        this.divCargando.style.display = 'none';
        this.divError.style.display = 'none';
        this.divExito.style.display = 'block';

        this.bloquearForm();

        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(this.redireccionar.bind(this), 3000);
    }

    /**
     * Redirecciona a página de login de padres.
     */
    redireccionar() {
        window.location.href = 'login.html'
    }

    /**
     * Informa al usuario del error que ha ocurrido.
     * @param {Object} e Error.
     * @param {Boolean} bloquear Si es true, bloqueará los campos y el botón de enviar.
     */
    error(e, bloquear) {
        this.divCargando.style.display = 'none';

        if (bloquear)
            this.bloquearForm();

        if (e != null) {
            if (e == 'Error: 400 - Bad Request 1') {
                this.divError.innerHTML = '<p>No has solicitado un cambio de contraseña.</p>';
            }
            else if (e == 'Error: 400 - Bad Request 2') {
                this.divError.innerHTML = '<p>No se encuentra su solicitud de cambio de contraseña. Solicite un nuevo <a href="recuperar.html" class="link-light">cambio de contraseña</a>.</p>';
            }
            else if (e == 'Error: 400 - Bad Request 3') {
                this.divError.innerHTML = '<p>Su solicitud de cambio de contraseña no es válida. Solicite un nuevo <a href="recuperar.html" class="link-light">cambio de contraseña</a>.</p>';
            }
            else if (e == 'Error: 400 - Bad Request 4') {
                this.divError.innerHTML = '<p>Su solicitud de cambio de contraseña ha expirado. Solicite un nuevo <a href="recuperar.html" class="link-light">cambio de contraseña</a>.</p>';
            }
            else {
                this.divError.innerHTML = '<p>' + e + '</p>';
            }

            this.divError.style.display = 'block';
            this.form.classList.remove('was-validated');
            window.scrollTo(0, document.body.scrollHeight);
        }
        else {
            this.divError.style.display = 'none';
        }
    }

    /**
     * Desactiva los campos y botones del formulario.
     */
    bloquearForm() {
        this.campo1.disabled = true;
        this.campo2.disabled = true;
        this.btnAceptar.disabled = true;
    }
}

new Restaurar();
import { Rest } from "../services/rest.js";

/**
 * Controlador del proceso de generar solicitudes de recuperación de contraseñas de padres.
 */
class Recuperar {
    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
    }

    /**
     * Inicia al cargar la página.
     */
    iniciar() {
        this.form = document.getElementsByTagName('form')[0];
        this.correo = document.getElementsByTagName('input')[0];
        this.btnEnviar = document.getElementsByTagName('button')[0];
        this.divCargando = document.getElementById('loadingImg');
        this.divExito = document.getElementById('divExito');
        this.divError = document.getElementById('divError');

        this.btnEnviar.addEventListener('click', this.validar.bind(this));
    }

    /**
     * Validar que el correo esté relleno y exista alguien con el en la BBDD.
     */
    validar() {
        this.form.classList.add('was-validated');

        if (this.correo.checkValidity()) {
            this.divCargando.style.display = 'block';

            if (this.divError.style.display == 'block')
                this.divError.style.display = 'none';
            
            const email = {
                'correo' : this.correo.value
            };
            
            this.btnEnviar.disabled = true;

            Rest.post('recuperar', [], email, false)
             .then(() => {
                 this.exito();
             })
             .catch(e => {
                 this.error(e);
             })
        }
    }

    /**
     * Informar al usuario del éxito del proceso.
     */
    exito() {
        this.divCargando.style.display = 'none';

        if (this.divError.style.display == 'block')
            this.divError.style.display = 'none';

        this.correo.disabled = true;
        this.btnEnviar.disabled = true;
        this.divExito.style.display = 'block';

        window.scrollTo(0, document.body.scrollHeight);
    }

    /**
     * Informa al usuario del error que ha ocurrido.
     * @param {Object} e Error.
     */
    error(e) {
        this.btnEnviar.disabled = false;
        this.divCargando.style.display = 'none';

        if (e != null) {
            if (e == 'Error: 400 - Bad Request 1') {
                this.divError.innerHTML = '<p>Tu cuenta no puede solicitar una recuperación de contraseña.</p>';
            }
            else if (e == 'Error: 403 - Forbidden') {
                this.divError.innerHTML = '<p>No se pudo realizar el proceso.</p>';
            }
            else if (e == 'Error: 404 - Not Found') {
                this.divError.innerHTML = '<p>No existe una cuenta con esa dirección de correo.</p>';
            }
            else if (e == 'Error: 500 - Internal Server Error 1') {
                this.divError.innerHTML = '<p>Ya solicitó una restauración de contraseña. Por favor, revise su correo electrónico.</p>';
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
}

new Recuperar();
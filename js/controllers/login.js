import { Rest } from "../services/rest.js";

/**
 * Controlador de login de padres
 */
class Login {
    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
    }

    /**
     * Inicia el login.
     * Se llama al cargar la página.
     */
    iniciar() {
        this.form = document.getElementsByTagName('form')[0];
        this.email = document.getElementsByTagName('input')[0];
        this.clave = document.getElementsByTagName('input')[1];
        this.verClave = document.querySelector('input[type="checkbox"]')
        this.btnAceptar = document.getElementsByTagName('button')[0];
        this.divCargando = document.getElementById('loadingImg');
        this.divError = document.getElementById('divError');

        this.btnAceptar.addEventListener('click', this.validarFormulario.bind(this));
        this.email.addEventListener('change', this.comprobarCorreo.bind(this));
        this.verClave.addEventListener('click', this.mostrarClave.bind(this))
    }
    
    /**
     * Verifica el dominio del correo y muestra un mensaje si coincide con criterios específicos.
     */
    comprobarCorreo() {
        const correo = this.email.value.trim().toLowerCase();
    
        // if (correo.endsWith('@fundacionloyola.es')) {
        //     this.btnAceptar.disabled = true;
        //     this.mostrarMensaje('El personal de la Escuela Virgen de Guadalupe debe acceder con su correo corporativo a través del login de Google', 'login_google.html');
        // } else 
        if (correo.endsWith('@alumnado.fundacionloyola.net')) {
            this.btnAceptar.disabled = true;
            this.mostrarMensaje('Los alumnos de la Escuela Virgen de Guadalupe deben acceder con su correo corporativo a través del login de Google', 'login_google.html');
        }
    }
    
    /**
        Cambia la visibilidad del campo de clave y alterna la imagen del ojo
    **/
    mostrarClave() {
        if (this.clave.type === 'password') {
            this.clave.type = 'text';
            this.verClave.src = 'img/icons/eye-closed.svg'; 
        } else {
            this.clave.type = 'password';
            this.verClave.src = 'img/icons/eye-open.svg'; 
        }
    }
    /**
     * Muestra un mensaje y un enlace en el div de error.
     * @param {string} mensaje - El mensaje a mostrar.
     * @param {string} enlace - El enlace a incluir en el mensaje.
     */
    mostrarMensaje(mensaje, enlace) {
        this.divError.innerHTML = `<p>${mensaje}</p><a href="${enlace}">Haz clic aquí</a>`;
        this.divError.style.display = 'block';
    }
    
    /**
     * Comprobar que el campo de correo y contraseña sean válidos.
     */
    validarFormulario() {
        this.form.classList.add('was-validated');

        if (this.email.checkValidity() && this.clave.checkValidity()) {
            this.btnAceptar.disabled = true;
            this.login();
        }
    }

    /**
     * Realiza el proceso de login.
     */
    login() {
        this.divCargando.style.display = 'block';

        if (this.divError.style.display == 'block')
            this.divError.style.display = 'none';

        const login = {
            usuario: this.email.value,
            clave: this.clave.value
        };

        Rest.post('login', [], login, true)
         .then(usuario => {
             this.btnAceptar.disabled = false;
             this.divCargando.style.display = 'none';
             sessionStorage.setItem('usuario', JSON.stringify(usuario));
             window.location.href = 'index.html';
         })
         .catch(e => {
             this.btnAceptar.disabled = false;
             this.divCargando.style.display = 'none';
             this.error(e);
         })
    }

    /**
     * Aviso de errores al usuario.
     * @param {Object} e Error.
     */
    error(e) {
        let mensaje = 'Error al iniciar sesión';
        try {
            const texto = (e && e.message) ? e.message : String(e);
            // texto: "403 - Forbidden: { ... }" => extraer cuerpo JSON tras ':'
            const idx = texto.indexOf(':');
            const cuerpo = idx >= 0 ? texto.slice(idx + 1).trim() : '';
            if (cuerpo) {
                try {
                    const json = JSON.parse(cuerpo);
                    if (json && json.error === 'usuario_desactivado') {
                        mensaje = 'Usuario desactivado o eliminado. Consulte con administración.';
                    } else if (json && json.mensaje) {
                        mensaje = json.mensaje;
                    }
                } catch (_) {
                    if (texto.includes('401')) mensaje = 'Usuario o contraseña incorrectos.';
                    else if (texto.includes('408')) mensaje = 'No hay conexión con la base de datos. Intente de nuevo más tarde.';
                }
            } else {
                if (texto.includes('401')) mensaje = 'Usuario o contraseña incorrectos.';
            }
        } catch (_) {}

        if (this.divError) {
            this.divError.innerHTML = `<p>${mensaje}</p>`;
            this.divError.style.display = 'block';
        } else {
            alert(mensaje);
        }
        this.form.classList.remove('was-validated');
        window.scrollTo(0, document.body.scrollHeight);
    }
}

new Login();

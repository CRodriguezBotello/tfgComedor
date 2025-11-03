import { Rest } from "../services/rest.js";

<<<<<<< HEAD
/**
 * Controlador del login de google.
 */
=======
>>>>>>> hugo
class LoginGoogle {
    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
    }

<<<<<<< HEAD
    /**
     * Inicia el login al cargar la página.
     */
=======
>>>>>>> hugo
    iniciar() {
        this.divCargando = document.getElementById('loadingImg');
        this.divError = document.getElementById('divError');

        google.accounts.id.initialize({
<<<<<<< HEAD
            client_id: '', //FALTA EL ID DE CLIENTE DE GOOGLE
            callback: this.login.bind(this)
        });
        
=======
            client_id: '601383626177-ka9ptjmgj5br4crhvidc3vh169lj9p2a.apps.googleusercontent.com',
            callback: this.login.bind(this)
        });

>>>>>>> hugo
        google.accounts.id.renderButton(
            document.getElementById('divGoogleLogin'),
            { theme: 'outline', size: 'medium', text: "signin_with", shape: 'rectangular' }
        );
<<<<<<< HEAD
    
		this.sTest = document.getElementsByTagName('select')[0]
    if (this.sTest)
      this.sTest.onchange = this.test.bind(this)
    }
  
		test () {
    	const token = {}
    	token.credential = this.sTest.value
    	this.login(token)
  	}

    /**
     * Recoge los datos y los envía al servidor para identificar al usuario.
     * Recibe el token del login con Google y lo envía al servidor para identificar al usuario.
     * @param {token} Object Token de identificación de usuario de Google.
     */
    login(token) {
        this.divCargando.style.display = 'block';
        this.divError.style.display = 'none';

        Rest.post('login_google', [], token.credential, true)
         .then(usuario => {
             sessionStorage.setItem('usuario', JSON.stringify(usuario));
             this.divCargando.style.display = 'none';
             this.redireccionar();
         })
         .catch(e => {
             this.divCargando.style.display = 'none';
             this.error(e);
         })
    }

    /**
     * Redirecciona dependiendo del tipo de usuario que sea.
     */
    redireccionar() {
        let usuario = JSON.parse(sessionStorage.getItem('usuario'));

        // Secretaría
        if (usuario.rol == 'S') {
            window.location.href = 'index_evg.html';        
        }
        // PAS o profesores
        else if (usuario.rol == 'G' || usuario.rol == 'P' ) {
            window.location.href = 'index.html';   
        }
    }

    /**
     * Informa al usuario del error que ha ocurrido.
     * @param {Object} e Error.
     */
    error(e) {
        this.divCargando.style.display = 'none';

        if (e != null) {
            if (e == 'Error: 408 - Request Timeout') {
                this.divError.innerHTML = '<p>No hay conexión con la base de datos. Intente de nuevo más tarde.</p>';
            }
            else {
                this.divError.innerHTML = '<p>' + e + '</p>';
            }
            if (e == 'Error: 401 - Unauthorized') {
                this.divError.innerHTML = '<p>No existe un usuario. <a href="registro.html">Regístrate aquí</a>.</p>';
            }
            this.divError.style.display = 'block';
            window.scrollTo(0, document.body.scrollHeight);
        }
        else {
            this.divError.style.display = 'none';
        }
=======

        this.sTest = document.getElementsByTagName('select')[0];
        if (this.sTest) this.sTest.onchange = this.test.bind(this);
    }

    test() {
        const token = { credential: this.sTest.value };
        this.login(token);
    }

    async login(token) {
        this.divCargando.style.display = 'block';
        this.divError.style.display = 'none';

        try {
            let usuario = await Rest.post('login_google', [], token.credential, true);

            if (typeof usuario === 'string') throw new Error(usuario);

            // Guardamos el usuario y el token para todas las llamadas futuras
            sessionStorage.setItem('usuario', JSON.stringify(usuario));
            Rest.setAutorizacion(usuario.autorizacion);

            this.divCargando.style.display = 'none';
            this.redireccionar();
        } catch (e) {
            this.divCargando.style.display = 'none';
            this.error(e);
        }
    }

    redireccionar() {
        let usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario) return;

        if (usuario.rol == 'S') window.location.href = 'index_evg.html';
        else if (usuario.rol == 'G' || usuario.rol == 'P') window.location.href = 'index.html';
    }

    error(e) {
        const msg = e.message || e;
        this.divError.style.display = 'block';
        this.divError.innerHTML = '';

        if (msg.includes('408')) {
            this.divError.innerHTML = '<p>No hay conexión con la base de datos. Intente de nuevo más tarde.</p>';
        } else if (msg.includes('401')) {
            this.divError.innerHTML = '<p>No existe un usuario o token inválido. <a href="registro.html">Regístrate aquí</a>.</p>';
        } else {
            this.divError.innerHTML = `<p>${msg}</p>`;
        }

        window.scrollTo(0, document.body.scrollHeight);
>>>>>>> hugo
    }
}

new LoginGoogle();

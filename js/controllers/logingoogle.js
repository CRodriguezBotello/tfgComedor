import { Rest } from "../services/rest.js";

class LoginGoogle {
    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
    }

    iniciar() {
        this.divCargando = document.getElementById('loadingImg');
        this.divError = document.getElementById('divError');

        google.accounts.id.initialize({
            client_id: '601383626177-ka9ptjmgj5br4crhvidc3vh169lj9p2a.apps.googleusercontent.com',
            callback: this.login.bind(this)
        });

        google.accounts.id.renderButton(
            document.getElementById('divGoogleLogin'),
            { theme: 'outline', size: 'medium', text: "signin_with", shape: 'rectangular' }
        );

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
    }
}

new LoginGoogle();

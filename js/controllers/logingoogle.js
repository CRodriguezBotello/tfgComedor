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

    async redireccionar() {
        let usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario) return;

        // Si el usuario es secretaria ('S') pero además tiene tipo 'A' (admin),
        // permitir a admins ('A') elegir a qué área ir (Secretaría o Padres) mediante modal.
        if (usuario.rol == 'S') {
            if (usuario.tipo === 'A') {
                const irSecretaria = await this.askAdminChoice();
                if (irSecretaria) {
                    window.location.href = 'index_evg.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                window.location.href = 'index_evg.html';
            }
        } else if (usuario.rol == 'G' || usuario.rol == 'P') {
            window.location.href = 'index.html';
        }
    }

    askAdminChoice() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.id = 'adminChoiceOverlay';
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
                background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
            });

            const box = document.createElement('div');
            Object.assign(box.style, {
                background: '#fff', padding: '18px', borderRadius: '8px', textAlign: 'center', minWidth: '300px', boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
            });

            const msg = document.createElement('p');
            msg.textContent = 'Has iniciado sesión como administrador. ¿A qué área quieres ir?';
            Object.assign(msg.style, { marginBottom: '14px' });

            const btnSec = document.createElement('button');
            btnSec.textContent = 'Secretaría';
            Object.assign(btnSec.style, { marginRight: '10px', padding: '8px 14px', cursor: 'pointer' });

            const btnPad = document.createElement('button');
            btnPad.textContent = 'Padres';
            Object.assign(btnPad.style, { padding: '8px 14px', cursor: 'pointer' });

            const cleanup = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };

            btnSec.addEventListener('click', () => { cleanup(); resolve(true); });
            btnPad.addEventListener('click', () => { cleanup(); resolve(false); });

            box.appendChild(msg);
            box.appendChild(btnSec);
            box.appendChild(btnPad);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
        });
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

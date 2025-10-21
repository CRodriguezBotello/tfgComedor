/**
 * Contiene la vista del menú de padres.
 */
export class VistaMenuPadres {
    constructor(controlador, nav) {
        this.controlador = controlador;
        this.nav = nav;

        this.liHamburger = this.nav.getElementsByTagName('li')[0];
        this.liInicio = this.nav.getElementsByTagName('li')[1];
        this.liGestionHijos = this.nav.getElementsByTagName('li')[2];
        this.liGestionCalendario = this.nav.getElementsByTagName('li')[3];
        this.liModificacion = this.nav.getElementsByTagName('li')[4];
        this.liCerrarSesion = this.nav.getElementsByTagName('li')[5];
        
        this.liHamburger.onclick = this.toggleMenu.bind(this);
        this.liInicio.onclick = this.inicio.bind(this);
        this.liGestionHijos.onclick = this.gestionHijos.bind(this);
        this.liModificacion.onclick = this.modificacion.bind(this);
        this.liGestionCalendario.onclick = this.gestionCalendario.bind(this);
        this.liCerrarSesion.onclick = this.cerrarSesion.bind(this);
    }

    /**
     * Atención al evento de mostrar vista inicio.
     */
    inicio() {
        this.controlador.verVistaInicio();

        this.liInicio.classList.add('active');
        this.liGestionHijos.classList.remove('active');
        this.liGestionCalendario.classList.remove('active');
        this.liModificacion.classList.remove('active');
    }

    /**
     * Muestra/oculta menú de navegación.
     */
    toggleMenu() {
        this.nav.classList.toggle('responsive');
    }

    /**
     * Atención al evento de mostrar vista gestión de hijos.
     */
    gestionHijos() {
        this.controlador.verVistaGestionHijos();

        this.liInicio.classList.remove('active');
        this.liGestionHijos.classList.add('active');
        this.liGestionCalendario.classList.remove('active');
        this.liModificacion.classList.remove('active');
    }

    /**
     * Atención al evento de mostrar vista modificación de datos.
     */
    modificacion() {
        this.controlador.verVistaModificacion();

        this.liInicio.classList.remove('active');
        this.liGestionHijos.classList.remove('active');
        this.liGestionCalendario.classList.remove('active');
        this.liModificacion.classList.add('active');
    }

    gestionCalendario() {
        this.controlador.verVistaCalendario();

        this.liInicio.classList.remove('active');
        this.liGestionHijos.classList.remove('active');
        this.liModificacion.classList.remove('active');
        this.liGestionCalendario.classList.add('active');
    }

    /**
     * Atención al evento de cerrar sesión.
     */
    cerrarSesion() {
        this.controlador.cerrarSesion();
    }
}
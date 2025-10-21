import { Modelo } from "../models/modelo.js";
import { VistaInicioPadres } from "../views/padres/vistainicio.js";
import { VistaMenuPadres } from "../views/padres/vistamenu.js";
import { VistaGestionHijos } from "../views/padres/vistagestionhijos.js";
import { VistaModificarPadres } from "../views/padres/vistamodificar.js";
import { VistaCalendario } from "../views/padres/vistacalendario.js";
import { Rest } from "../services/rest.js";

/**
 * Controlador del panel de padres.
 */
class ControladorPadres {
    #usuario = null; // Usuario logueado.

    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
    }

    /**
     * Inicia la aplicación.
     */
    iniciar() {
        this.#usuario = JSON.parse(sessionStorage.getItem('usuario'));

        // Comprobar login
        if (!this.#usuario)
            window.location.href = 'login.html';

        Rest.setAutorizacion(this.#usuario.autorizacion);

        this.modelo = new Modelo();
        this.vistaMenu = new VistaMenuPadres(this, document.getElementById('menuPadres'));
        this.vistaInicio = new VistaInicioPadres(this, document.getElementById('inicioPadres'));
        this.vistaGestionHijos = new VistaGestionHijos(this, document.getElementById('gestionHijosPadres'));
        this.vistaModificacion = new VistaModificarPadres(this, document.getElementById('modificacionPadres'));
        this.vistaCalendario = new VistaCalendario(this, document.getElementById('calendarioGestion'));
        
        this.vistaModificacion.actualizarCampos(this.#usuario);
        this.vistaGestionHijos.actualizar(this.#usuario);
        this.vistaInicio.obtenerPadre(this.#usuario);
        
        this.verVistaInicio();
    }

    /**
     * Devuelve array de días festivos a vista de gestión de hijos.
     */
    obtenerFestivos(inicioMes, finMes) {
        this.modelo.obtenerFestivos(inicioMes, finMes)
         .then(festivos => {
             this.vistaInicio.obtenerFestivos(festivos);
         })
         .catch(e => {
             console.error(e);
         })
    }
    
    /**
     * Devuelve array de cursos a vista de gestión de hijos.
     */
    obtenerCursos() {
        this.modelo.obtenerCursos()
         .then(cursos => {
             this.vistaGestionHijos.rellenarSelects(cursos);
         })
         .catch(e => {
             console.error(e);
         })
    }
    
    /**
     * Devuelve array de cursos a vista de gestión de hijos.
     * Modificar la función obtenerDatosCalendario para pasar el año y el mes actual
     */
    obtenerDatosCalendario(anio, mes) {
        this.modelo.obtenerDiasCalendario(this.#usuario.id, anio, mes)
        .then(cursos => {
            console.log(cursos)
            this.vistaCalendario.loadCalendarData(cursos);
        })
        .catch(e => {
            console.error(e);
        });
    }

    /**
     * Cambia a la vista de inicio.
     */
    verVistaInicio() {
        this.vistaInicio.mostrar(true);
        this.vistaGestionHijos.mostrar(false);
        this.vistaModificacion.mostrar(false);
        this.vistaCalendario.mostrar(false)
    }

    /**
     * Cambia a la vista de gestión de hijos.
     */
    verVistaGestionHijos() {
        this.vistaInicio.mostrar(false);
        this.vistaCalendario.mostrar(false)
        this.vistaGestionHijos.mostrar(true);
        this.vistaModificacion.mostrar(false);
    }

    /**
     * Cambia a la vista de modificación de datos personales.
     */
    verVistaModificacion() {
        this.vistaInicio.mostrar(false);
        this.vistaCalendario.mostrar(false)
        this.vistaGestionHijos.mostrar(false);
        this.vistaModificacion.mostrar(true);
    }
    
    /**
     * Cambia a la vista de gestión mensual.
     */
    verVistaCalendario() {
        this.vistaInicio.mostrar(false);
        this.vistaGestionHijos.mostrar(false);
        this.vistaModificacion.mostrar(false);   
        this.vistaCalendario.mostrar(true)
    }
    
    /**
     * Registra un hijo existente a un padre mediante un PIN.
     * @param {Object} datos Datos.
     */
    registrarHijoPin(datos) {
        this.modelo.registrarHijoPin(datos)
         .then(() => {
             this.vistaGestionHijos.bloquearBotonesAlta(false);
             this.vistaGestionHijos.exitoAltaPin(true);
             this.dameHijos(this.#usuario.id); // Actualizar listado hijos.
         })
         .catch(e => {
             this.vistaGestionHijos.bloquearBotonesAlta(false);
             this.vistaGestionHijos.errorAltaPin(e);
             console.error(e);
         })
    }

    /**
     * Realiza el proceso de dar de alta a un hijo.
     * @param {Object} datos Datos del hijo.
     */
    altaHijo(datos) {
        this.modelo.altaHijo(datos)
         .then(() => {
             this.vistaGestionHijos.bloquearBotonesAlta(false);
             this.vistaGestionHijos.exitoAlta(true);
             this.dameHijos(this.#usuario.id); // Actualizar listado hijos.
         })
         .catch(e => {
             this.vistaGestionHijos.bloquearBotonesAlta(false);
             console.error(e);
         })
    }

    /**
     * Modificar datos de un hijo.
     * @param {Object} datos 
     */
    modificarHijo(datos){
        this.modelo.modificarHijo(datos)
         .then(() => {
             this.vistaGestionHijos.btnActualizar.disabled = false;
             this.vistaGestionHijos.btnCancelarMod.disabled = false;
             this.vistaGestionHijos.exitoModificacion(true);
             this.vistaGestionHijos.actualizar(this.#usuario); // Actualizar listado hijos.
         })
         .catch(e => {
             this.vistaGestionHijos.btnActualizar.disabled = false;
             this.vistaGestionHijos.btnCancelarMod.disabled = false;
             console.error(e);
         }) 
    }

    /**
     * Elimina relación padre-hijo.
     * @param {Number} id ID del hijo.
     */
    eliminarRelacionHijo(id) {
        this.modelo.eliminarRelacionHijo(id, this.#usuario.id)
         .then(() => {
             this.dameHijos(this.#usuario.id); // Actualizar listado hijos.
         })
         .catch(e => {
             console.error(e);
         })
    }

    /**
     * Realizar la eliminación de un hijo.
     * @param {Number} id ID del hijo.
     */
    eliminarHijo(id){
        this.modelo.eliminarHijo(id)
         .then(() => {
             this.dameHijos(this.#usuario.id); // Actualizar listado hijos.
         })
         .catch(e => {
             console.error(e);
         })
    }

    /**
     * Marca día del comedor.
     * @param {Object} datos Datos del día a marcar.
       @param {HTMLElement} pConfirmacion párrafo para el texto de confirmación.
     */
    marcarDiaComedor(datos) {
        this.modelo.marcarDiaComedor(datos)
    }

    /**
     * Obtiene los días de comedor de los hijos.
     * @param {Array} idHijos Array con los IDs de los hijos.
     */
    obtenerDiasComedor(idHijos) {
        this.modelo.obtenerDiasComedor(idHijos)
         .then(dias => {
            this.vistaInicio.montarCalendario(dias);
         })
         .catch(e => {
             console.error(e);
         })
    }
    
    /**
     * Desmarcar día del comedor.
     * @param {Object} datos Datos del día.
     */
    desmarcarDiaComedor(datos) {
        this.modelo.desmarcarDiaComedor(datos)
    }

    /**
     * Cierra la sesión del usuario.
     */
    cerrarSesion() {
        this.#usuario = null;
        sessionStorage.removeItem('usuario');
        Rest.setAutorizacion(null);
        window.location.href = 'login.html';
    }

    /**
     * Realiza la modificación de los datos del padre.
     * @param {Object} datos Nuevos datos del padre.
     */
    modificarPadre(datos) {
        this.modelo.modificarPadre(datos)
         .then(() => {
             this.vistaModificacion.exito(true);
             sessionStorage.setItem('usuario', JSON.stringify(datos));
         })
         .catch(e => {
             this.vistaModificacion.errorModificacion(e);
             console.error(e);
         }) 
    }

    /**
     * Devuelve los hijos de un padre a la vista de inicio.
     * @param {Number} id ID del padre. 
     */
    dameHijosCalendario(id) {
        this.modelo.dameHijos(id)
         .then(hijos => {
             this.vistaInicio.inicializar(hijos);
         })
         .catch(e => {
             console.error(e)
             this.vistaCalendario.calendarContainer.innerHTML = '<p>Error al cargar los datos.</p>';
         })
    }

    /**
     * Devuelve los hijos de un padre a la vista de gestión de hijos.
     * @param {Number} id ID del padre. 
     */
    dameHijos(id) {
        this.modelo.dameHijos(id)
         .then(hijos => {
             this.vistaGestionHijos.cargarListado(hijos);
         })
         .catch(e => {
             console.error(e)
         })
    }

    /**
     * Elimina cuenta de un padre.
     * @param {Number} id ID padre.
     */
    eliminarCuentaPadre(id) {
        this.modelo.borrarCuentaPadre(id)
         .then(() => {
             this.cerrarSesion();
         })
         .catch(e => {
             console.error(e);
             this.vistaModificacion.errorBorrado(e);
         })
    }
}

new ControladorPadres();

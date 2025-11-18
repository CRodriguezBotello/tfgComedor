import { Modelo } from "../models/modelo.js";
import { VistaInicioPadres } from "../views/padres/vistainicio.js";
import { VistaMenuPadres } from "../views/padres/vistamenu.js";
import { VistaGestionHijos } from "../views/padres/vistagestionhijos.js";
import { VistaModificarPadres } from "../views/padres/vistamodificar.js";
import { VistaCalendario } from "../views/padres/vistacalendario.js";
import { VistaGestionDiaria } from "../views/padres/vistagestiondiaria.js";
import { VistaResumenMensual } from "../views/padres/vistaresumenmensual.js";
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
        this.vistaGestionDiaria = new VistaGestionDiaria(this, document.getElementById('gestionDiariaPadres'));
        this.resumenMensual = new VistaResumenMensual(this, document.getElementById('resumenMensual'));


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
        this.vistaCalendario.mostrar(false);
        this.vistaGestionDiaria.mostrar(false);
        this.resumenMensual.mostrar(false);
    }

    /**
     * Cambia a la vista de gestión de hijos.
     */
    verVistaGestionHijos() {
        this.vistaInicio.mostrar(false);
        this.vistaCalendario.mostrar(false)
        this.vistaGestionHijos.mostrar(true);
        this.vistaModificacion.mostrar(false);
        this.vistaGestionDiaria.mostrar(false);
        this.resumenMensual.mostrar(false);
    }



    /**
     * Devuelve los hijos del padre para la vista de Gestión Diaria.
     * @param {Number} idPadre ID del padre.
     * @returns {Promise<Array>} Array con los hijos y su curso.
     */
    dameHijosDiaria(idPadre) {
        return this.modelo.dameHijosDiaria(idPadre);
    }


    verVistaGestionDiaria() {
        this.vistaInicio.mostrar(false);
        this.vistaGestionHijos.mostrar(false);
        this.vistaModificacion.mostrar(false);
        this.vistaCalendario.mostrar(false);

        this.vistaGestionDiaria.mostrar(true);
        this.resumenMensual.mostrar(false);

        // Cargar hijos y cursos y pasar mapa de id->nombre a la vista
        Promise.all([
            this.modelo.dameHijos(this.#usuario.id),
            this.modelo.obtenerCursos()
        ])
        .then(([hijos, cursos]) => {
            const cursosMap = new Map((cursos || []).map(c => [c.id, c.nombre]));
            // se pasa también el id del padre para que la vista pueda usarlo al confirmar
            this.vistaGestionDiaria.cargarListado(hijos || [], cursosMap, this.#usuario.id);
        })
        .catch(e => {
            console.error('Error cargando hijos para gestión diaria:', e);
            this.vistaGestionDiaria.cargarListado([], new Map());
        });
    }

    verVistaResumenMensual() {
        this.vistaInicio.mostrar(false);
        this.vistaGestionHijos.mostrar(false);
        this.vistaModificacion.mostrar(false);
        this.vistaCalendario.mostrar(false);

        this.vistaGestionDiaria.mostrar(false);
        this.resumenMensual.mostrar(true);
        
    }

    obtenerUsuariosMensual(mes) {
        console.log(this.#usuario.id);
        this.modelo.obtenerHijosPadreApuntadosMensual(mes, this.#usuario.id)
        .then(usuarios => {
            this.resumenMensual.cargarIncidencias(usuarios);
        })
        .catch(e => {
            console.error(e);
        })
    }

    obtenerIncidenciasMensual(mes) {
        this.modelo.obtenerIncidenciasHijoMensual(mes, this.#usuario.id)
         .then(incidencias => {
             this.resumenMensual.cargarListado(incidencias);
         })
         .catch(e => {
             console.error(e);
         })
    }


    /**
     * Cambia a la vista de modificación de datos personales.
     */
    verVistaModificacion() {
        this.vistaInicio.mostrar(false);
        this.vistaCalendario.mostrar(false)
        this.vistaGestionHijos.mostrar(false);
        this.vistaModificacion.mostrar(true);
        this.vistaGestionDiaria.mostrar(false);
        this.resumenMensual.mostrar(false);
    }
    
    /**
     * Cambia a la vista de gestión mensual.
     */
    verVistaCalendario() {
        this.vistaInicio.mostrar(false);
        this.vistaGestionHijos.mostrar(false);
        this.vistaModificacion.mostrar(false);   
        this.vistaCalendario.mostrar(true);
        this.vistaGestionDiaria.mostrar(false);
        this.resumenMensual.mostrar(false);
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

    /**
     * Procesa los registros de gestión diaria:
     * - crea la fila en Dias si es necesario (POST altaDia)
     * - actualiza tupper (PUT secretaria/tupper) y/o incidencia (PUT secretaria/incidencia)
     * @param {Array} entradas Array de objetos {dia, idPersona, idPadre, tupper, incidencia}
     * @returns {Promise}
     */
    procesarGestionDiaria(entradas) {
        const promesas = entradas.map(ent => {
            return this.modelo.marcarDiaComedor({
                dia: ent.dia,
                idPersona: ent.idPersona,
                idPadre: ent.idPadre
            })
            .then(resAlta => {
                console.log('Respuesta altaDia:', resAlta);
                const ops = [];
                if (typeof ent.tupper !== 'undefined') {
                    ops.push(
                        this.modelo.insertarTupper({
                            dia: ent.dia,
                            idPersona: ent.idPersona,
                            tupper: ent.tupper
                        }).then(res => { console.log('tupper OK', res); return res; })
                          .catch(e => { console.error('tupper ERROR', e); throw e; })
                    );
                }
                if (ent.incidencia && ent.incidencia !== '') {
                    ops.push(
                        this.modelo.insertarIncidencia({
                            dia: ent.dia,
                            idPersona: ent.idPersona,
                            incidencia: ent.incidencia
                        }).then(res => { console.log('incidencia OK', res); return res; })
                          .catch(e => { console.error('incidencia ERROR', e); throw e; })
                    );
                }
                return Promise.all(ops);
            })
            .catch(e => {
                // si falla la alta, registrar y reintentar o fallar según política
                console.warn('altaDia falló para', ent, e);
                // Intentar al menos aplicar tupper/incidencia (si la fila existe)
                const ops = [];
                if (typeof ent.tupper !== 'undefined') {
                    ops.push(this.modelo.insertarTupper({ dia: ent.dia, idPersona: ent.idPersona, tupper: ent.tupper }));
                }
                if (ent.incidencia && ent.incidencia !== '') {
                    ops.push(this.modelo.insertarIncidencia({ dia: ent.dia, idPersona: ent.idPersona, incidencia: ent.incidencia }));
                }
                return Promise.all(ops);
            });
        });

        // Devolver promesa global y propagar cualquier error para que la vista lo muestre
        return Promise.all(promesas);
    }

    /**
     * Devuelve los registros de tupper para una fecha.
     * @param {Date} fecha Date objeto.
     * @returns {Promise<Array>} Array con { idPersona, tupper }.
     */
    obtenerTupper(fecha) {
        return this.modelo.obtenerTupper(fecha);
    }

    /**
     * Devuelve las incidencias para una fecha.
     * @param {Date} fecha Date objeto.
     * @returns {Promise<Array>} Array con { idPersona, incidencia }.
     */
    obtenerIncidencias(fecha) {
        return this.modelo.obtenerIncidencias(fecha);
    }
}

new ControladorPadres();

{ 
    // función añadida: borrar un hijo definitivamente
    async function borrarHijo(idHijo) {
        try {
            // Ajusta la URL si tu router añade "api/index.php" de otra forma
            const url = `/php/api/index.php/hijos/eliminarHijo/${idHijo}`;
            await Rest.delete(url);
            // Actualiza la vista que muestra los hijos (ajusta según tu implementación)
            // por ejemplo: this.verVistaGestionHijos(); o recarga la lista
            if (typeof controladorPadres !== 'undefined' && controladorPadres.obtenerHijos) {
                controladorPadres.obtenerHijos(); // o la función que refresca la lista
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error('Error borrando hijo:', err);
            // mostrar mensaje al usuario (ajusta según tu UI)
            const divError = document.getElementById('divError');
            if (divError) divError.textContent = `Error al eliminar: ${err.message || err}`;
        }
    }

    // Ejemplo: exportar o exponer la función para usar en handlers de botones
    window.borrarHijo = borrarHijo;
}

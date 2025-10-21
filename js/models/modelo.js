import { Rest } from "../services/rest.js";

/**
 * Modelo de la aplicación.
 * Se responsabiliza del mantenimiento y gestión de los datos.
 * Utiliza el Servicio de Rest.
 */
export class Modelo {
    /**
     * Realiza el proceso de modificación de un padre.
     * @param {Object} datos Datos del padre.
     * @return {Promise} Devuelve la promesa asociada a la petición.
     */
    modificarPadre(datos) {
        return Rest.put('persona', [], datos, false);
    }

    /**
     * Realiza el proceso de dar de alta a un hijo.
     * @param {Object} datos Datos del hijo.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    altaHijo(datos) {
        return Rest.post('hijos', ['altaHijo'], datos, false);
    }

    /**
     * Realiza el proceso de dar de alta un hijo a un padre mediante PIN.
     * @param {Object} datos Datos.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    registrarHijoPin(datos) {
        return Rest.post('hijos', ['registrarHijo'], datos, false);
    }

    /**
     * Realiza el proceso de obtener todas las filas de la tabla curso.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerCursos() {
        return Rest.get('cursos', [], []);
    }

    /**
     * Realiza el proceso de obtener filas de la tabla festivos.
     * @param {Date} inicioMes Primer día del mes.
     * @param {Date} finMes Último día del mes.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerFestivos(inicioMes, finMes) {
        const queryParams = new Map();
        queryParams.set('inicio', inicioMes.getDate() + '-' + (inicioMes.getMonth()+1) + '-' + inicioMes.getFullYear());
        queryParams.set('final', finMes.getDate() + '-' + (finMes.getMonth()+1) + '-' + finMes.getFullYear());
        return Rest.get('festivos', [], queryParams);
    }

    /**
     * Obtener hijos de un padre.
     * @param {Array} id ID del padre.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    dameHijos(id) {
        const queryParams = new Map();
        queryParams.set('id', id);
        return Rest.get('hijos', [], queryParams);
    }

    /**
     * Eliminar fila de las tablas: Persona, Hijo e Hijo_Padre.
     * @param {Number} id ID del hijo.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    eliminarHijo(id) {
        let datos = ['eliminarHijo', id];
        return Rest.delete('hijos', datos);
    }

    /**
     * Eliminar fila de la tabla Hijo_Padre.
     * @param {Number} id ID del hijo.
     * @param {Number} idPadre ID del padre.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    eliminarRelacionHijo(id, idPadre) {
        let datos = ['eliminarRelacion', id, idPadre];
        return Rest.delete('hijos', datos);
    }

    /**
     * Llamada para modificar fila de la tabla persona.
     * @param {Array} datos Datos a enviar.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    modificarHijo(datos) {
        return Rest.put('hijos', [], datos, false);
    }

    /**
     * Llamada para obtener filas de la tabla dias.
     * @param {Array} ids Array de IDs a enviar.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerDiasComedor(ids) {
        return Rest.get('dias', [], ids);
    }

    /**
     * Llamada para insertar fila a la tabla dias.
     * @param {Object} datos Datos a enviar.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    marcarDiaComedor(datos) {
        return Rest.post('dias', [], datos, false);
    }

    /**
     * Llamada para borrar fila de la tabla dias.
     * @param {Object} datos Datos a enviar.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    desmarcarDiaComedor(datos) {
        return Rest.delete('dias', [datos.dia, datos.idPersona, datos.idPadre]);
    }

    /**
     * Llamada para obtener usuarios apuntados al comedor en la fecha.
     * @param {String} fecha String de la fecha. 
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerUsuariosApuntados(fecha) {
        const queryParams = new Map();
        queryParams.set('proceso', 'usuarios');
        queryParams.set('fecha', fecha.getDate() + '-' + (fecha.getMonth()+1) + '-' + fecha.getFullYear());
        return Rest.get('secretaria', [], queryParams);
    }

    /**
     * Llamada para obtener las incidencias de los usuarios del comedor de una fecha.
     * @param {String} fecha String de la fecha. 
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerIncidencias(fecha) {
        const queryParams = new Map();
        queryParams.set('proceso', 'incidencias');
        queryParams.set('fecha', fecha.getDate() + '-' + (fecha.getMonth()+1) + '-' + fecha.getFullYear());
        return Rest.get('secretaria', [], queryParams);
    }

    /**
     * Obtiene los registros de tupperware para una fecha específica.
     * @param {Date} fecha La fecha para la cual se desean obtener los registros de tupperware.
     * @returns {Promise} Una promesa que se resolverá con los registros de tupperware para la fecha especificada.
     */
    obtenerTupper(fecha) {
        const queryParams = new Map();
        queryParams.set('proceso', 'tupper');
        queryParams.set('fecha', fecha.getDate() + '-' + (fecha.getMonth() + 1) + '-' + fecha.getFullYear());
        return Rest.get('secretaria', [], queryParams);
    }
    
    /**
     * Llamada para obtener a los usuarios apuntados al comedor en un mes.
     * @param {Number} mes Nº del mes.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerUsuariosApuntadosMensual(mes) {
        const queryParams = new Map();
        queryParams.set('proceso', 'usuariosMes');
        queryParams.set('mes', mes);
        return Rest.get('secretaria', [], queryParams);
    }

    /**
     * Llamada para obtener las incidencias de los usuarios del comedor de un mes.
     * @param {Number} mes Nº del mes.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerIncidenciasMensual(mes) {
        const queryParams = new Map();
        queryParams.set('proceso', 'incidenciasMes');
        queryParams.set('mes', mes);
        return Rest.get('secretaria', [], queryParams);
    }

    /**
     * Llamada para insertar o modificar incidencia.
     * @param {String} fecha String de la fecha. 
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    insertarIncidencia(datos) {
        return Rest.put('secretaria', ['incidencia'], datos, false);
    }

    /**
    * Inserta un registro de tupperware en la base de datos.
    * @param {Object} datos Los datos del registro de tupperware a insertar.
    * @returns {Promise} Una promesa que se resolverá después de que se haya completado la inserción.
    */
    insertarTupper(datos) {
        return Rest.put('secretaria', ['tupper'], datos, false);
    }
    
    obtenerListadoPadres(busqueda){
        const queryParams = new Map();

        queryParams.set('proceso', 'padres');
        queryParams.set('busqueda', busqueda);

        return Rest.get('secretaria', [], queryParams);
    }

    modificarPadreSecretaria(datos) {
        return Rest.put('secretaria', ['modificarPadre'], datos);
    }

    /**
     * Eliminar padre.
     * @param {Number} id ID del padre.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    borrarCuentaPadre(id) {
        return Rest.delete('padres', [id]);
    }
    
	/**
     * Llamada para obtener los registros del Q19 de un mes.
     * @param {Number} mes Nº del mes.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerQ19(mes) {
        const queryParams = new Map();
        queryParams.set('proceso', 'q19');
        queryParams.set('mes', mes);
        return Rest.get('secretaria', [], queryParams);
    }

    /**
    * Obtiene la constante relacionada con los registros de tupperware.
    * @returns {Promise} Una promesa que se resolverá con la constante relacionada con los registros de tupperware.
    */
    obtenerConstanteTupper() {
        const queryParams = new Map();
        queryParams.set('proceso', 'tupper');
        return Rest.get('constantes', [], queryParams);
    }

    /**
     * Obtiene la constante relacionada con el menú.
     * @returns {Promise} Una promesa que se resolverá con la constante relacionada con el menú.
    */
    obtenerConstanteMenu() {
        const queryParams = new Map();
        queryParams.set('proceso', 'menu');
        return Rest.get('constantes', [], queryParams);
    }
    
    /**
     * Obtiene los datos de la gestión mensual.
     * @returns {Promise} Una promesa que se resolverá con la constante relacionada con el calendario.
     */
    obtenerDiasCalendario(idPadre,anio,mes) {
        const queryParams = new Map();
        queryParams.set('idPadre', idPadre);
        queryParams.set('anio', anio);
        queryParams.set('mes', mes);
        return Rest.get('calendario', [], queryParams);       
    }
}

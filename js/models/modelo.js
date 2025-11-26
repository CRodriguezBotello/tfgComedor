import { Rest } from "../services/rest.js";

/**
 * Modelo de la aplicación.
 * Se responsabiliza del mantenimiento y gestión de los datos.
 * Utiliza el Servicio de Rest.
 */
export class Modelo {
    constructor() {
        // ...existing code...
    }

    /**
     * 
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

    async desactivarPadreSecretaria(padre) {
        const body = { id: padre.id }; // ¡Ojo! solo el id
        const respuesta = await Rest.put('secretaria/desactivarPadre', [], body);
        console.log("Padre desactivado:", respuesta);
        return respuesta;
    }

    async reactivarPadreSecretaria(padre) {
        const body = { id: padre.id }; // ¡Ojo! solo el id
        const respuesta = await Rest.put('secretaria/reactivarPadre', [], body);
        console.log("Padre desactivado:", respuesta);
        return respuesta;
    }

    async eliminarPadreSecretaria(padre) {
        const body = { id: padre.id }; // ¡Ojo! solo el id
        const respuesta = await Rest.put('secretaria/eliminarPadre', [], body);
        console.log("Padre eliminado definitivamente:", respuesta);
        return respuesta;
    }

    /**
     * Realiza el proceso de obtener filas de la tabla festivos.
     * @param {Date} inicioMes Primer día del mes.
     * @param {Date} finMes Último día del mes.
     * @returns {Promise} Devuelve la promesa asociada a la petición.
     */
    obtenerFestivos(inicioMes, finMes) {
        const pad = (n) => String(n).padStart(2, '0');
        const queryParams = new Map();
        queryParams.set('inicio', `${inicioMes.getFullYear()}-${pad(inicioMes.getMonth()+1)}-${pad(inicioMes.getDate())}`);
        queryParams.set('final', `${finMes.getFullYear()}-${pad(finMes.getMonth()+1)}-${pad(finMes.getDate())}`);
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
     * Devuelve los hijos del padre para la vista de Gestión Diaria.
     * Ajusta la URL al endpoint real de tu API.
     */
    async dameHijosDiaria(idPadre) {
        // Cambia esta URL al endpoint real (por ejemplo: `/api/hijos?padre=${idPadre}`)
        const url = `/api/hijos/porPadre/${encodeURIComponent(idPadre)}`;

        // intenta obtener token/autorization si lo guardas en sessionStorage
        const usuario = sessionStorage.getItem('usuario') ? JSON.parse(sessionStorage.getItem('usuario')) : null;
        const headers = { 'Accept': 'application/json' };
        if (usuario && usuario.autorizacion) headers['Authorization'] = usuario.autorizacion;

        try {
            const res = await fetch(url, { method: 'GET', headers });
            const text = await res.text();

            if (!res.ok) {
                console.error('dameHijosDiaria - HTTP error', res.status, text);
                throw new Error(`HTTP ${res.status}`);
            }

            try {
                const json = JSON.parse(text);
                return json;
            } catch (e) {
                // respuesta no JSON (probable HTML de error/redirect)
                console.error('dameHijosDiaria - respuesta no JSON:', text);
                throw new Error('Respuesta del servidor no es JSON. Revisa la URL / autorización / backend.');
            }
        } catch (e) {
            console.error('Error obteniendo hijos diaria:', e);
            throw e;
        }
    }

    async reactivarPadreSecretaria(padre) {
        const body = { id: padre.id }; // ¡Ojo! solo el id
        const respuesta = await Rest.put('secretaria/reactivarPadre', [], body);
        console.log("Padre desactivado:", respuesta);
        return respuesta;
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
     */
    marcarDiaComedor(datos) {
        // NO pasar 'false' para asegurar que Rest incluya Authorization header
        return Rest.post('dias', [], datos);
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
     */
    insertarIncidencia(datos) {
        return Rest.put('secretaria', ['incidencia'], datos);
    }

    /**
     * Inserta un registro de tupperware en la base de datos.
     */
    insertarTupper(datos) {
        return Rest.put('secretaria', ['tupper'], datos);
    }

    obtenerListadoPadres(busqueda){
        const queryParams = new Map();
        queryParams.set('proceso', 'padres');
        queryParams.set('busqueda', busqueda);
        return Rest.get('secretaria', [], queryParams);
    }

    obtenerListadoPadresDesactivados(){
        const queryParams = new Map();
        queryParams.set('proceso', 'padresDesactivados');
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

    obtenerQ19PorPersona(mes, idPersona) {
        const queryParams = new Map();
        queryParams.set('proceso', 'q19');
        queryParams.set('mes', mes);
        queryParams.set('idPersona', idPersona);
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
     * :calendario_de_sobremesa: Obtiene los datos del calendario (días de los hijos con tupper)
     * @param {Number} idPadre
     * @param {Number} anio
     * @param {Number} mes
     * @returns {Promise<Array>} Array con hijos, sus nombres y los días/tupper
     */
    obtenerDiasCalendario(idPadre, anio, mes) {
        const queryParams = new Map();
        queryParams.set('idPadre', idPadre);
        queryParams.set('anio', anio);
        queryParams.set('mes', mes);
        return Rest.get('calendario', [], queryParams);
    }

    /**
     * Obtiene los precios desde la API y devuelve un objeto:
     * { precioMensual: 150, precioDiario: 8.5, ... }
     */
    obtenerPrecios() {
        // Usar el enrutador interno del servicio Rest (controlador 'precios')
        const queryParams = new Map();
        return Rest.get('precios', [], queryParams)
            .then(res => {
                // Si el backend devuelve un array de filas [{nombreP,cantidad}, ...] — convertir a objeto
                if (Array.isArray(res)) {
                    const out = {};
                    res.forEach(row => {
                        if (row && row.nombreP) out[row.nombreP] = parseFloat(row.cantidad);
                    });
                    return out;
                }
                // Si ya viene como objeto mapeado, devolver tal cual
                return res;
            })
            .catch(err => {
                console.error('Modelo.obtenerPrecios error:', err);
                throw err;
            });
    }

    async obtenerUsuariosAnual(anio) {
        const queryParams = new Map();
        queryParams.set('anio', anio);
        queryParams.set('proceso', 'usuariosAnual'); 
    
        return Rest.get('secretaria', [], queryParams)
            .then(data => {
                // 🚨 LOG CLAVE 1: Confirma que el Modelo recibe datos del servidor.
                //console.log('DEBUG 1: MODELO Certificados, datos recibidos. Longitud:', data ? data.length : 0); 
                return data;
            })
            .catch(err => {
                console.error('DEBUG ERROR MODELO Certificados:', err); 
                return []; 
            });
    }

    /**
     * Llama a la API para generar el certificado PDF.
     * @param {string|number} alumnoId 
     * @param {number} anio 
     * @returns {Promise<string>} Promesa que resuelve con la URL del PDF.
     */
    generarCertificadoPDF(alumnoId, anio, anioSig) {
        const datos = {
            id: alumnoId,
            anio: anio,
            anioSig: anioSig
        };
        
        // Configuración del endpoint REST:
        const queryParams = 'secretaria';
        const pathParams = ['generarCertificado']; 

        // Llamada al servicio Rest.post() con manejo de promesas
        return Rest.post(queryParams, pathParams, datos) 
            .then(response => {
                //CLAVE 1: Confirma que el Modelo recibe datos del servidor.
                //console.log('DEBUG 1: MODELO Certificado, respuesta recibida:', response); 

                // Asumiendo que la respuesta es un objeto con la URL del archivo
                if (response && response.url) {
                    return response.url;
                }
                // Si el servidor no devolvió una URL, lanzamos un error que será capturado por el .catch()
                throw new Error("Respuesta del servidor incompleta (falta URL o estructura incorrecta).");
            })
            .catch(err => {
                // DEBUG ERROR MODELO: Captura cualquier error de red, parsing o el throw anterior.
                console.error('DEBUG ERROR MODELO Certificado:', err); 
                // Vuelve a lanzar el error para que sea capturado por el Controlador (secretaria.js)
                throw err; 
            });
    }
}
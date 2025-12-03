import { Modelo } from "../models/modelo.js";
import { VistaMenuSecretaria } from "../views/secretaria/vistamenusecretaria.js";
import { VistaGestionDiaria } from "../views/secretaria/vistagestiondiaria.js";
import { VistaGestionMensual } from "../views/secretaria/vistagestionmensual.js";
import { VistaGestionPadres } from "../views/secretaria/vistagestionpadres.js";
import { VistaQ19 } from "../views/secretaria/vistaq19.js";
import { Vista } from "../views/vista.js";
import { Rest } from "../services/rest.js";
import { VistaGestionCertificados } from "../views/secretaria/vistagestioncertificados.js";

/**
 * Controlador del panel de secretaría.
 */
class ControladorSecretaria {
    #usuario = null; // Usuario logueado.

    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
        // Control para peticiones de incidencias
        this._incidenciasRequestId = 0;
        this._incidenciasAbortController = null;
    }

    /**
     * Inicia la aplicación.
     */
    iniciar() {
        this.#usuario = JSON.parse(sessionStorage.getItem('usuario'));
        
        // Comprobar login
        if (!this.#usuario)
            window.location.href = 'login_google.html';

        // Comprobar rol de usuario secretaría (permitir admins con tipo 'A')
        if (this.#usuario.rol != 'S' && this.#usuario.tipo !== 'A')
            window.location.href = 'login_google.html';

        Rest.setAutorizacion(this.#usuario.autorizacion);

        this.modelo = new Modelo();
        this.vistaMenu = new VistaMenuSecretaria(this, document.getElementById('menuSecretaria'));
        this.vistaGestionDiaria = new VistaGestionDiaria(this, document.getElementById('gestionDiaria'));
        this.vistaGestionMensual = new VistaGestionMensual(this, document.getElementById('gestionMensual'));
        this.vistaGestionPadres = new VistaGestionPadres(this, document.getElementById('gestionPadres'));
        this.vistaGestionCertificados = new VistaGestionCertificados(this, document.getElementById('gestionCertificados'));
        this.vistaQ19 = new VistaQ19(this, document.getElementById('divQ19'));
        this.acerca = new Vista(this, document.getElementById('acercade'));
   
        this.verVistaGestionDiaria();

        // --- NUEVO: Listener checkbox "Desactivados" solo cuando está activado ---
        const checkboxDesactivados = document.getElementById('checkDesactivados');
        if (checkboxDesactivados) {
            
            checkboxDesactivados.addEventListener('change', () => {

                // ---- Lo que ya hacía tu función ----
                if (checkboxDesactivados.checked) {
                    this.mostrarPadresDesactivados();
                } else {
                    this.verVistaGestionPadres(); 
                }

                // ---- NUEVO: mostrar/ocultar según el checkbox ----
                const form = document.getElementById("formModificacionPadres");
                const desactivar = document.getElementById("desactivarPadre");
                const reactivar = document.getElementById("reactivarPadre");

                if (checkboxDesactivados.checked) {
                    // Checkbox activado → ocultar form y desactivarPadre, mostrar reactivarPadre
                    if (form) form.style.display = "none";
                    if (desactivar) desactivar.style.display = "none";
                    if (reactivar) reactivar.style.display = "block";

                } else {
                    // Checkbox desactivado → mostrar form y desactivarPadre, ocultar reactivarPadre
                    if (form) form.style.display = "block";
                    if (desactivar) desactivar.style.display = "block";
                    if (reactivar) reactivar.style.display = "none";
                }
            });
        }

        // Selecciona el LI de "Gestión de usuarios"
        const liGestionPadres = document.querySelector('li[data-view="gestionPadres"]');
        if (liGestionPadres) {
            liGestionPadres.addEventListener('click', () => {
                const checkboxDesactivados = document.getElementById("checkDesactivados");
                if (checkboxDesactivados) {
                    checkboxDesactivados.checked = false;
                    // Disparar el evento para actualizar la UI
                    checkboxDesactivados.dispatchEvent(new Event('change'));
                }
            });
        }
    }

    async mostrarPadresDesactivados() {
        try {
            // Llama al modelo
            const padres = await this.modelo.obtenerListadoPadresDesactivados();
            // Actualiza la vista
            this.vistaGestionPadres.iniciarTabla(padres);
        } catch (e) {
            console.error('Error mostrando padres desactivados:', e);
        }
    }

    async reactivarPadre(padreSeleccionado) {
        if (!padreSeleccionado || !padreSeleccionado.id) {
            console.error("No hay padre seleccionado o no tiene ID");
            return;
        }
        // Solo enviamos el ID
        const datos = { id: padreSeleccionado.id };
        console.log("Enviando a reactivar:", datos);
        try {
            // Llamada al modelo que hace el PUT
            const respuesta = await this.modelo.reactivarPadreSecretaria(datos);
            console.log("Padre reactivado:", respuesta);
            alert(`Padre ${padreSeleccionado.nombre} reactivado correctamente`);
        } catch (error) {
            console.error("Fallo al reactivar padre:", error);
            alert("Error al reactivar padre, revisa la consola");
        }
    }

    async eliminarPadre(padreSeleccionado) {
        if (!padreSeleccionado || !padreSeleccionado.id) {
            console.error("No hay padre seleccionado o no tiene ID");
            return;
        }
        // Solo enviamos el ID
        const datos = { id: padreSeleccionado.id };
        console.log("Enviando a eliminar definitivamente:", datos);
        try {
            // Llamada al modelo que hace el PUT
            const respuesta = await this.modelo.eliminarPadreSecretaria(datos);
            console.log("Padre eliminado definitivamente:", respuesta);
            alert(`Padre ${padreSeleccionado.nombre} eliminado definitivamente`);
        } catch (error) {
            console.error("Fallo al eliminar definitivamente al  padre:", error);
            alert("Error al eliminar definitivamente al padre, revisa la consola");
        }
    }
    cancelar() {
        this.verVistaGestionPadres();
    }

    /**
     * Realizar proceso de modificación de padre desde secretaría.
     * @param {Object} padre Datos del padre.
     */
    modificarPadre(padre) {
        this.modelo.modificarPadreSecretaria(padre)
         .then(() => {
             this.vistaGestionPadres.exitoModificacion(); 
         })
         .catch(e => {
             this.vistaGestionPadres.errorModificacion(e);
             console.error(e);
         }) 
    }

    /**
     * Obtiene las incidencias de una fecha.
     * @param {String} fecha String de la fecha.
     */
    async obtenerIncidencias(fecha) {
        const reqId = ++this._incidenciasRequestId;

        // Abort previous request if running
        if (this._incidenciasAbortController) {
            try { this._incidenciasAbortController.abort(); } catch(e) {}
        }
        this._incidenciasAbortController = new AbortController();
        const signal = this._incidenciasAbortController.signal;

        // Mostrar spinner si la vista lo soporta
        try { this.vistaGestionDiaria?.mostrarSpinner?.(true); } catch(e){ }

        try {
            const resp = await this.modelo.obtenerIncidencias(fecha, signal);

            // Ignorar si ya hay una petición posterior
            if (reqId !== this._incidenciasRequestId) return;

            // Normalizar la respuesta: puede venir como array o como {ok:true, dias: [...]}
            let lista = [];
            if (Array.isArray(resp)) lista = resp;
            else if (resp && Array.isArray(resp.dias)) lista = resp.dias;
            else if (resp && Array.isArray(resp.result)) lista = resp.result; // por si otro formato

            this.vistaGestionDiaria?.cargarListado(lista);
        } catch (e) {
            if (e && (e.name === 'AbortError' || e.message === 'Aborted')) {
                // petición cancelada, no hacer nada
                return;
            }
            console.error('Error al obtener incidencias:', e);
            this.vistaGestionDiaria?.mostrarError?.('No se pudieron cargar las incidencias.');
        } finally {
            // Quitar spinner solo si es la petición actual
            if (reqId === this._incidenciasRequestId) {
                try { this.vistaGestionDiaria?.mostrarSpinner?.(false); } catch(e){ }
            }
        }
    }
    
    obtenerTuppers(fecha) {
        return this.modelo.obtenerTupper(fecha)
         .then(tuppers => {
             this.vistaGestionDiaria.cargarTuppers(tuppers);
         })
         .catch(e => {
             console.error(e);
         })
    }
    
    /**
     * Obtiene las incidencias de un mes.
     * @param {Number} mes Mes.
     */
    obtenerIncidenciasMensual(mes) {
        this.modelo.obtenerIncidenciasMensual(mes)
         .then(incidencias => {
             this.vistaGestionMensual.cargarListado(incidencias);
         })
         .catch(e => {
             console.error(e);
         })
    }

    /**
     * Insertar incidencia del usuario indicado en el día indicado.
     * @param {Object} datos Datos de la incidencia.
     * @param {HTMLTextAreaElement} textarea Elemento dónde se introdujo la incidencia.
     */
    insertarIncidencia(datos, textarea) {
        this.modelo.insertarIncidencia(datos)
         .then(() => {
             if (textarea) this.vistaGestionDiaria.insercionExito(textarea);
         })
         .catch(e => {
             console.error(e);
             if (textarea) this.vistaGestionDiaria.insercionError(textarea);
         })
    }
    
    insertarTupper(datos) {
        this.modelo.insertarTupper(datos)
         .catch(e => {
             console.error(e);
         })
    }

    /**
     * Obtiene los usuarios que van al comedor de una fecha.
     * @param {String} fecha String de la fecha.
     */
    obtenerUsuarios(fecha) {
        return this.modelo.obtenerUsuariosApuntados(fecha)
         .then(usuarios => {
             this.vistaGestionDiaria.cargarIncidencias(usuarios);
         })
         .catch(e => {
             console.error(e);
         })
    }

    /**
     * Obtener usuarios de comedor de un mes.
     * @param {Number} mes Mes.
     */
    obtenerUsuariosMensual(mes) {
        this.modelo.obtenerUsuariosApuntadosMensual(mes)
        .then(usuarios => {
            this.vistaGestionMensual.cargarIncidencias(usuarios);
        })
        .catch(e => {
            console.error(e);
        })
    }

    /**
     * Oculta las vistas.
    */
	ocultarVistas(){
        this.vistaGestionDiaria.mostrar(false);
        this.vistaGestionMensual.mostrar(false);
        this.vistaGestionPadres.mostrar(false);
        this.acerca.mostrar(false);
        this.vistaGestionCertificados.mostrar(false);
        this.vistaQ19.mostrar(false);
		}

    /**
     * Muestra la vista de gestión diaria.
     */
    verVistaGestionDiaria() {
				this.ocultarVistas()
        this.vistaGestionDiaria.mostrar(true);
    }

    verVistaGestionCertificados() {
        this.ocultarVistas(); 
        
        if (this.vistaGestionCertificados) {
            this.vistaGestionCertificados.mostrar(true);
            console.log("DEBUG A: verVistaGestionCertificados ha iniciado la carga."); 
            
            // ACTIVAMOS LA CARGA DE DATOS AL MOSTRAR LA VISTA
            this.cargarListadoAnual(new Date().getFullYear()); 
        } else {
            console.error('La vista de gestión de certificados no fue inicializada correctamente en iniciar().');
        }
    }

    /**
     * Muestra la vista de gestión mensual.
     */
    verVistaGestionMensual() {
        this.ocultarVistas();
        this.vistaGestionMensual.mostrar(true);

        // Cargar usuarios y calcular importes
        const mesActual = new Date().getMonth() + 1;
        this.obtenerUsuariosMensual(mesActual);



        // Obtener constantes de precios y pasarlas a la vista mensual y Q19
        this.obtenerConstantesPrecios()
          .then(({ precioMenu, precioTupper }) => {
              try {
                  if (this.vistaGestionMensual && typeof this.vistaGestionMensual.inicializarPrecios === 'function') {
                      this.vistaGestionMensual.inicializarPrecios(precioMenu, precioTupper);
                  }
                  // Asegurar que Q19 reciba los mismos precios
                  if (this.vistaQ19) {
                      if (typeof this.vistaQ19.inicializarPrecios === 'function') {
                          this.vistaQ19.inicializarPrecios(precioMenu, precioTupper);
                      } else {
                          // soportar API antigua si tiene métodos separados
                          if (typeof this.vistaQ19.inicializarMenu === 'function') this.vistaQ19.inicializarMenu(precioMenu);
                          if (typeof this.vistaQ19.inicializarTupper === 'function') this.vistaQ19.inicializarTupper(precioTupper);
                      }
                  }
              } catch(e) { console.error('Error inicializando precios en vistas', e); }
          })
          .catch(e => {
              console.warn('No se pudieron obtener precios. Las vistas usarán fallback.', e);
          });
    }

    /**
     * Muestra la vista de gestión mensual.
     */
    verVistaGestionPadres() {
				this.ocultarVistas()
        this.vistaGestionPadres.mostrar(true);
    }

    // Función exacta que debes poner en tu secretaria.js
    async desactivarPadre(padreSeleccionado) {
        console.log('desactivarPadre llamado con:', padreSeleccionado, 'this.padreActual:', this.padreActual);
        // Si nos pasan un id en string/number o nada, intentar leer el hidden y this.padreActual
        if (!padreSeleccionado) {
            padreSeleccionado = this.padreActual ?? (document.getElementById('idPadre')?.value || null);
        }

        // Normalizar a id
        let id = null;
        if (typeof padreSeleccionado === 'string' && padreSeleccionado.trim() !== '') id = padreSeleccionado;
        else if (typeof padreSeleccionado === 'number') id = padreSeleccionado;
        else if (typeof padreSeleccionado === 'object') id = padreSeleccionado.id ?? padreSeleccionado.ID ?? padreSeleccionado.idPadre ?? null;

        if (!id) {
            console.error('No hay padre seleccionado o no tiene ID');
            return;
        }

        // Guardar referencia mínima
        try { this.padreActual = { id }; } catch(e){}

        const datos = { id: id };
        console.log('Enviando a desactivar:', datos);
        try {
            const respuesta = await this.modelo.desactivarPadreSecretaria(datos);
            console.log('Padre desactivado:', respuesta);
            if (typeof window.__recargarFilaPadre === 'function') window.__recargarFilaPadre(id);
            // Actualizar hidden/imprimir notificación
            const hid = document.getElementById('idPadre');
            if (hid) hid.value = '';
            alert('Padre desactivado correctamente.');
            return respuesta;
        } catch (error) {
            console.error('Fallo al desactivar padre:', error);
            alert('Error al desactivar padre. Consulta la consola.');
            throw error;
        }
    }

    // Mantener solo UNA implementación de verQ19 (la que fusiona importes)
    verQ19(mes){
        // Obtener datos Q19 + listado gestión mensual + constantes de precios en paralelo.
        Promise.all([
            this.modelo.obtenerQ19(mes),
            this.modelo.obtenerUsuariosApuntadosMensual(mes).catch(() => []),
            this.obtenerConstantesPrecios().catch(() => ({ precioMenu: null, precioTupper: null }))
        ])
        .then(([q19, gestionMensual, precios]) => {
            const listaQ19 = Array.isArray(q19) ? q19 : (q19 && q19.result) ? q19.result : [];

            if (this.vistaQ19 && precios) {
                try {
                    if (typeof this.vistaQ19.inicializarPrecios === 'function') {
                        this.vistaQ19.inicializarPrecios(precios.precioMenu, precios.precioTupper);
                    } else {
                        if (typeof this.vistaQ19.inicializarMenu === 'function') this.vistaQ19.inicializarMenu(precios.precioMenu);
                        if (typeof this.vistaQ19.inicializarTupper === 'function') this.vistaQ19.inicializarTupper(precios.precioTupper);
                    }
                } catch(e) { console.error('Error aplicando precios a vistaQ19', e); }
            }

            const map = new Map();
            if (Array.isArray(gestionMensual)) {
                gestionMensual.forEach(g => {
                    try {
                        if (g.correo) map.set(String(g.correo).toLowerCase(), g);
                        if (g.iban) map.set(String(g.iban).toLowerCase(), g);
                        if (g.titular) map.set(String(g.titular).toLowerCase(), g);
                    } catch (e) {}
                });
            }

            listaQ19.forEach(item => {
                if (!item) return;
                let matched = null;
                if (item.correo && map.has(String(item.correo).toLowerCase())) matched = map.get(String(item.correo).toLowerCase());
                else if (item.iban && map.has(String(item.iban).toLowerCase())) matched = map.get(String(item.iban).toLowerCase());
                else if (item.titular && map.has(String(item.titular).toLowerCase())) matched = map.get(String(item.titular).toLowerCase());

                if (matched) {
                    const prefer = ['importe', 'importeTotal', 'importe_total', 'total', 'total_q19', 'totalq19'];
                    for (const p of prefer) {
                        if (matched[p] !== undefined && matched[p] !== null && matched[p] !== '') {
                            item.importe = Number(matched[p]);
                            break;
                        }
                    }
                }

                if (item.importe !== undefined && item.importe !== null) item.importe = Number(item.importe);

                // --- Enriquecer campos para Q19: concepto, referencia (DNI) y fecha_mandato ---
                try {
                    const year = (new Date()).getFullYear();
                    const mesNum = (typeof mes === 'number' && mes >= 1 && mes <= 12) ? mes : (new Date().getMonth() + 1);

                    // Nombre del hijo/alumno: priorizar campos del hijo (no usar titular)
                    const firstNonEmpty = (...vals) => {
                        for (const v of vals) {
                            if (v === undefined || v === null) continue;
                            const s = String(v).trim();
                            if (s !== '') return s;
                        }
                        return '';
                    };

                    let nombreHijo = '';
                    // Si viene una cadena concatenada de hijos (separadores posibles: ',' o ';')
                    if (item.hijos) {
                        const raw = String(item.hijos);
                        const parts = raw.split(/\s*[,;]\s*/).filter(p => p && p.trim() !== '');
                        if (parts.length) nombreHijo = parts[0].trim();
                    }
                    if (!nombreHijo) {
                        // campos esperados que contienen el nombre del hijo/en alumno
                        nombreHijo = firstNonEmpty(
                            item.hijoNombre,   // alias usado en la consulta Q19
                            item.nombreHijo,
                            item.nombreAlumno,
                            item.alumno,
                            item.nombre,       // Solo como último recurso (puede ser padre en algunos formatos)
                            item.nombre_alumno
                        );
                    }
 
                    // Construir concepto: COMEDOR/mes/año/NOMBRE ALUMNO (mayúsculas)
                    const safeNombre = nombreHijo ? String(nombreHijo).trim().toUpperCase() : '';
                    item.concepto = `COMEDOR/${mesNum}/${year}/${safeNombre}`;
 
                    // Obtener DNI/ref. soportando distintos nombres de campo
                    const dniKeys = ['dni', 'nif', 'dni_padre', 'dniTitular', 'dniPadre', 'dniTitular'];
                    let dni = null;
                    for (const k of dniKeys) {
                        if (item[k]) { dni = item[k]; break; }
                        if (matched && matched[k]) { dni = matched[k]; break; }
                    }
                    if (dni) {
                        const s = String(dni).trim();
                        item.referencia = s;
                        // también rellenar referenciaUnicaMandato para que la vista la muestre como ref. mandato
                        item.referenciaUnicaMandato = s;
                    }

                    // Fecha del mandato: buscar en varios campos y normalizar a YYYY-MM-DD
                    const fechaKeys = ['fechaFirmaMandato', 'fecha_mandato', 'fechaMandato', 'fecha'];
                    let fecha = null;
                    for (const k of fechaKeys) {
                        if (item[k]) { fecha = item[k]; break; }
                        if (matched && matched[k]) { fecha = matched[k]; break; }
                    }
                    if (fecha) {
                        // normalizar: aceptar DD/MM/YYYY o YYYY-MM-DD
                        const f = String(fecha).trim();
                        const ddmmyyyy = /^([0-3]?\d)\/(0?[1-9]|1[0-2])\/(\d{4})$/; // 01/11/2025
                        const iso = /^(\d{4})-(\d{2})-(\d{2})/; // 2025-11-01
                        let normalized = f;
                        if (ddmmyyyy.test(f)) {
                            const m = f.match(ddmmyyyy);
                            normalized = `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
                        } else if (iso.test(f)) {
                            normalized = f.match(iso)[0];
                        }
                        item.fecha_mandato = normalized;
                    }
                } catch (e) {
                    // no bloquear la generación si hay problemas con nombres
                }
            });

            this.verVistaQ19();
            this.vistaQ19.iniciar(listaQ19, mes);
        })
        .catch(err => {
            console.warn('Error obteniendo Q19/gestión mensual/precios en paralelo:', err);
            this.modelo.obtenerQ19(mes)
                .then(q19 => {
                    this.verVistaQ19();
                    this.vistaQ19.iniciar(q19, mes);
                })
                .catch(e => console.error('Error obteniendo Q19:', e));
        });
    }

    /**
     * Generar Q19 individual para un hijo (muestra en la vista Q19 un solo recibo preparado).
     * @param {Number} idPersona ID del hijo
     * @param {Number} mes Mes (1-12)
     */
    verQ19Individual(idPersona, mes){
        // Pedir al modelo la remesa para ese hijo
        this.modelo.obtenerQ19PorPersona(mes, idPersona)
        .then(resp => {
            const lista = Array.isArray(resp) ? resp : (resp && resp.result) ? resp.result : [];
            // Tomar el primer elemento (si existe) y construir un recibo centrado en el PADRE
            if (!Array.isArray(lista) || lista.length === 0) {
                alert('No hay datos para este hijo en el mes seleccionado.');
                return;
            }
            const item = lista[0];
            try {
                const year = (new Date()).getFullYear();
                const mesNum = (typeof mes === 'number' && mes >= 1 && mes <= 12) ? mes : (new Date().getMonth() + 1);
                // Priorizar nombre del hijo
                const nombreHijo = (item.hijoNombre || item.nombreHijo || item.nombreAlumno || item.alumno || item.nombre || '').trim();
 
                // Construir recibo: mostrar datos del PADRE pero importe del hijo
                const recibo = {
                    titular: item.titularPadre || item.titular || '',
                    iban: item.ibanPadre || item.iban || '',
                    referenciaUnicaMandato: item.dniPadre || item.dni || '',
                    referencia: item.dniPadre || item.dni || '',
                    fechaFirmaMandato: item.fechaFirmaMandato || item.fecha_mandato || '',
                    dias: Number(item.dias || 0),
                    dias_tupper: Number(item.dias_tupper || 0),
                    importe: Number(item.importe || 0),
                    concepto: `COMEDOR/${mesNum}/${year}/${String(nombreHijo).trim().toUpperCase()}`
                };

                this.verVistaQ19();
                this.vistaQ19.iniciar([recibo], mes);
            } catch (e) {
                console.error('Error procesando Q19 individual:', e);
                alert('Error procesando Q19 individual. Revisa la consola.');
            }
        })
        .catch(e => {
            console.error('Error obteniendo Q19 individual:', e);
            alert('No se pudo obtener Q19 individual. Revisa la consola.');
        });
    }

    cancelar() {
        this.verVistaGestionPadres();
    }

    /**
     * Muestra la vista del Q19.
     */
	verVistaQ19() {
		this.ocultarVistas()
        this.vistaQ19.mostrar(true);
    }
    
     acercade() {
        this.ocultarVistas()
        this.acerca.mostrar(true)
    }

    /**
     * Cierra la sesión del usuario.
     */
    cerrarSesion() {
        this.#usuario = null;
        sessionStorage.removeItem('usuario');
        Rest.setAutorizacion(null);
        window.location.href = 'login_google.html';
    }

    /**
     * Buscar padres.
     * @param {String} busqueda String búsqueda.
     */
    obtenerListadoPadres(busqueda){
        this.modelo.obtenerListadoPadres(busqueda)
         .then(padres => {
             this.vistaGestionPadres.iniciarTabla(padres);
         })
         .catch(e => {
             console.error(e);
         })
    }

	/**
		Muestra la vista del Q19.
		@param mes {Number} Número del mes (1 es enero).
	**/
    /* Duplicate simplified verQ19 removed — using the richer implementation defined earlier. */
	
	/**
    * Obtiene la constante de tupperware desde el modelo y la inicializa en la vista.
    */
    constanteTupper(){
        this.modelo.obtenerConstanteTupper()
        .then ( c => {  
			this.vistaQ19.inicializarTupper(c)
		} )
        .catch(e => {
            console.error(e);
        })
    }
    
    /**
    * Obtiene la constante de menú desde el modelo y la inicializa en la vista.
    */
    constanteMenu(){
        this.modelo.obtenerConstanteMenu()
        .then ( c => {  
			this.vistaQ19.inicializarMenu(c)
		} )
        .catch(e => {
            console.error(e);
        })
    }

    generarCertificado(alumnoId, anio) {
        // Aquí puedes añadir lógica de carga (spinner) si lo deseas.
        // Mostrar spinner/overlay mínimo
        const showSpinner = () => {
            if (document.getElementById('cert-spinner')) return;
            const o = document.createElement('div');
            o.id = 'cert-spinner';
            Object.assign(o.style, {
                position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 99999
            });
            const box = document.createElement('div');
            Object.assign(box.style, {
                background: '#fff', padding: '18px 24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                fontSize: '16px', color: '#333'
            });
            box.textContent = 'Generando certificado...';
            o.appendChild(box);
            document.body.appendChild(o);
        };
        const hideSpinner = () => { const e = document.getElementById('cert-spinner'); if (e) e.remove(); };

        showSpinner();
        // Asegurar anioSig y obtener precios; pasarlos al modelo
        const anioSig = (typeof anio === 'number') ? (anio + 1) : (new Date().getFullYear() + 1);
        // Obtener precios (si falla, continuamos sin precios)
        this.obtenerConstantesPrecios()
          .then(precios => {
              return this.modelo.generarCertificadoPDF(alumnoId, anio, anioSig, precios);
          })
          .catch(() => {
              // intentar sin precios
              return this.modelo.generarCertificadoPDF(alumnoId, anio, anioSig, {});
          })
          .then(url => {
                 hideSpinner();
                 console.log("Certificado generado. URL:", url);
                 if (!url) {
                     alert('La API no devolvió una URL válida para el PDF. Revisa la consola.');
                     return;
                 }
                 // Abrir el PDF en una nueva pestaña
                 try {
                     window.open(url, '_blank');
                 } catch (e) {
                     console.error('No se pudo abrir la URL del PDF:', e);
                     alert('Se generó el PDF pero no se pudo abrir en una nueva pestaña. Copia la URL desde la consola.');
                 }
             })
             .catch(e => {
                 hideSpinner();
                 console.error("Error al generar el certificado:", e);
                 const msg = (e && e.message) ? e.message : (e && e.error) ? e.error : 'Hubo un error al generar el certificado.';
                 alert(msg);
             });
    }

    /**
     * Carga el listado de alumnos con menús anuales (para gestión de certificados).
     * @param {Number} anio Año a consultar.
     */
    cargarListadoAnual(anio) {
        this.modelo.obtenerUsuariosAnual(anio)
            .then(data => { 
                console.log('DEBUG 2: CONTROLADOR Certificados, llamando a la vista con', data.length, 'ítems.'); 
                
                if (this.vistaGestionCertificados) {
                    this.vistaGestionCertificados.pintarListadoAnual(data); 
                }
            })
            .catch(e => {
                console.error("Error al cargar listado anual:", e);
                // Opcional: mostrar un error en la vista
                this.vistaGestionCertificados?.pintarListadoAnual([]);
            });
    }

    /**
     * Obtiene los precios desde el modelo y devuelve
     * Promise<{ precioMenu, precioTupper }>.
     * precioMenu puede ser número o array [precioDiario, precioDiaProfesor].
     */
    obtenerConstantesPrecios() {
        if (this._preciosCache) return Promise.resolve(this._preciosCache);

        const findValue = (obj, terms) => {
            if (!obj || typeof obj !== 'object') return undefined;
            for (const k of Object.keys(obj)) {
                const key = k.toLowerCase();
                for (const t of terms) if (key.includes(t)) return obj[k];
            }
            return undefined;
        };

        const toNumber = v => {
            if (v === null || v === undefined) return NaN;
            if (typeof v === 'number') return v;
            const s = String(v).replace(',', '.').trim();
            const n = Number(s);
            return Number.isFinite(n) ? n : NaN;
        };

        // 1) Intentar obtener todo el objeto de precios
        return this.modelo.obtenerPrecios()
        .then(res => {
            console.log('modelo.obtenerPrecios ->', res);
            const rec = Array.isArray(res) ? (res[0] || {}) : (res || {});
            // buscar por claves aproximadas
            const diarioRaw = findValue(rec, ['preciodiario', 'precio_diario', 'precio diario', 'precio_diario', 'precioDiario'.toLowerCase()]);
            const profRaw = findValue(rec, ['preciodiaprofesor', 'precio_dia_profesor', 'precio dia profesor', 'precioprofesor', 'precioDiaProfesor'.toLowerCase()]);
            const tupperRaw = findValue(rec, ['preciotupper', 'precio_tupper', 'tupper', 'precioTupper'.toLowerCase()]);
            const diario = toNumber(diarioRaw);
            const prof = toNumber(profRaw);
            const tupper = toNumber(tupperRaw);

            let precioMenu = null;
            if (Number.isFinite(prof)) precioMenu = [ Number.isFinite(diario) ? diario : 0, prof ];
            else if (Number.isFinite(diario)) precioMenu = diario;

            const precioTupper = Number.isFinite(tupper) ? tupper : null;

            // Si no tenemos nada concreto, hacemos fallback a constantes individuales
            if ((precioMenu === null || precioMenu === undefined) && (precioTupper === null || precioTupper === null)) {
                throw new Error('no-precios-en-obtenerPrecios');
            }

            this._preciosCache = { precioMenu, precioTupper };
            console.log('Precios obtenidos (modelo.obtenerPrecios):', this._preciosCache);
            return this._preciosCache;
        })
        .catch(err => {
            // fallback: pedir constantes por separado
            console.warn('obtenerPrecios fallo, intentando obtenerConstanteMenu/ConstanteTupper ->', err);
            return Promise.allSettled([
                this.modelo.obtenerConstanteMenu().catch(e => { throw e; }),
                this.modelo.obtenerConstanteTupper().catch(e => { throw e; })
            ])
            .then(results => {
                let precioMenu = null;
                let precioTupper = null;

                const rMenu = results[0];
                const rTupper = results[1];

                if (rMenu && rMenu.status === 'fulfilled' && rMenu.value !== undefined && rMenu.value !== null) {
                    const val = rMenu.value;
                    // puede devolver número, objeto o array
                    if (typeof val === 'object' && !Array.isArray(val)) {
                        const diarioRaw = findValue(val, ['preciodiario','precio_diario','precio diario','precio']);
                        const profRaw = findValue(val, ['preciodiaProfesor'.toLowerCase(),'preciodia','profesor','dia_profesor']);
                        const diario = toNumber(diarioRaw);
                        const prof = toNumber(profRaw);
                        if (Number.isFinite(prof)) precioMenu = [ Number.isFinite(diario) ? diario : 0, prof ];
                        else if (Number.isFinite(diario)) precioMenu = diario;
                    } else {
                        const n = toNumber(val);
                        if (Number.isFinite(n)) precioMenu = n;
                    }
                }

                if (rTupper && rTupper.status === 'fulfilled' && rTupper.value !== undefined && rTupper.value !== null) {
                    const val = rTupper.value;
                    if (typeof val === 'object' && !Array.isArray(val)) {
                        const tRaw = findValue(val, ['preciotupper','precio_tupper','tupper','precio']);
                        const n = toNumber(tRaw);
                        if (Number.isFinite(n)) precioTupper = n;
                    } else {
                        const n = toNumber(val);
                        if (Number.isFinite(n)) precioTupper = n;
                    }
                }

                this._preciosCache = { precioMenu, precioTupper };
                console.log('Precios obtenidos (fallback constantes):', this._preciosCache);
                return this._preciosCache;
            });
        });
    }
}

window.controladorSecretaria = new ControladorSecretaria();

(function(){

    
    function initEditarPadreDesdeServidor() {
        const tabla = document.querySelector('#tablaGestionPadres') || document.querySelector('#tablaPadres');
        if (!tabla) return;

        tabla.addEventListener('click', async (ev) => {
            const btn = ev.target.closest('.btnEditarPadre, .editar-padre, .btn-edit');
            if (!btn) return;

            // Buscamos id en data-id del botón o en la fila
            const id = btn.dataset.id || btn.getAttribute('data-id') || btn.closest('tr')?.dataset.id;
            if (!id) {
                console.warn('Editar: id no encontrado en el botón/fila.');
                return;
            }

            try {
                
                const url = `/php/api/index.php?controller=padres&action=get&id=${encodeURIComponent(id)}`;
                const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
                if (!res.ok) throw new Error('Respuesta no OK: ' + res.status);
                const data = await res.json();

                // Formulario destino (ajusta selector al que uses)
                const form = document.querySelector('#formModificarPadre') || document.querySelector('#modificarPadreForm') || document.querySelector('#modificacionPadres form');
                if (!form) {
                    console.warn('Formulario de modificación no encontrado.');
                    return;
                }

                // Rellenar inputs/selects/textarea por name con los datos devueltos
                Object.keys(data).forEach(key => {
                    try {
                        const field = form.elements.namedItem(key);
                        if (!field) return;
                        if (field.type === 'checkbox') {
                            field.checked = !!data[key];
                        } else if (field.tagName === 'SELECT') {
                            field.value = data[key] ?? '';
                        } else {
                            field.value = data[key] ?? '';
                        }
                    } catch (e) {
                        
                    }
                });

                
                if (!form.elements.namedItem('id')) {
                    const hid = document.createElement('input');
                    hid.type = 'hidden';
                    hid.name = 'id';
                    hid.value = id;
                    form.appendChild(hid);
                } else {
                    form.elements.namedItem('id').value = id;
                }

                
                const modal = document.querySelector('#modalModificarPadre');
                if (modal) {
                    if (typeof bootstrap !== 'undefined') {
                        const bs = new bootstrap.Modal(modal);
                        bs.show();
                    } else {
                        modal.style.display = 'block';
                    }
                } else {
                    
                    form.scrollIntoView({ behavior: 'smooth' });
                }

            } catch (err) {
                console.error('Error cargando datos del padre:', err);
                alert('No se pudieron cargar los datos. Revisa la consola.');
            }
        });
    }

    

    
    async function recargarFilaPadre(id) {
        if (!id) return;
        try {
            const url = `/php/api/index.php?controller=padres&action=get&id=${encodeURIComponent(id)}`;
            const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Respuesta no OK: ' + res.status);
            const data = await res.json();

            const row = document.querySelector(`#tablaGestionPadres tbody tr[data-id="${id}"]`) || document.querySelector(`#tablaPadres tbody tr[data-id="${id}"]`);
            if (!row) return;

            // Actualiza celdas visibles: adapta índices según tu tabla
            const cols = row.querySelectorAll('td');
            if (cols.length) {
                if (cols[0]) cols[0].textContent = data.nombre ?? cols[0].textContent;
                if (cols[1]) cols[1].textContent = data.apellidos ?? cols[1].textContent;
                if (cols[2]) cols[2].textContent = data.email ?? cols[2].textContent;
            }

            
            Object.keys(data).forEach(k => {
                row.dataset[k] = data[k];
            });
        } catch (err) {
            console.error('Error recargando fila:', err);
        }
    }

    // iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initEditarPadreDesdeServidor();
            window.__recargarFilaPadre = recargarFilaPadre;
        });
    } else {
        initEditarPadreDesdeServidor();
        window.__recargarFilaPadre = recargarFilaPadre;
    }

})();

{
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formModificacionPadres');
  if (!form) return;

  const dniInput = document.getElementById('dniModificacionPadres');
  const btnActualizar = form.querySelector('button.btn-success');

  const dniRegex = /^[0-9]{8}[A-Za-z]$/;

  const marcarError = (msg) => {
    dniInput.classList.add('is-invalid');
    const fb = dniInput.closest('label')?.querySelector('.invalid-feedback');
    if (fb) fb.textContent = msg;
  };

  const limpiarError = () => {
    dniInput.classList.remove('is-invalid');
  };

  if (btnActualizar) {
    btnActualizar.addEventListener('click', (e) => {
      const val = (dniInput?.value || '').trim();
      if (!dniRegex.test(val)) {
        e.preventDefault();
        // evita que otros manejadores procesen la acción si el DNI es inválido
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        marcarError('Introduzca un DNI válido (8 dígitos y una letra final).');
        return;
      }
      limpiarError();
      // si es válido, continuar (otros manejadores pueden procesar la actualización)
    });
  }
});
}

(function() {
    // Handler de búsqueda para Gestión de Usuarios (padres)
    const listadoPadres = document.getElementById('divListadoPadres');
    if (!listadoPadres) return;

    // Buscar input de buscador dentro del contenedor (flexible)
    const inputBusqueda = listadoPadres.querySelector('input[type="search"], input[name="busqueda"], #buscador input') || listadoPadres.querySelector('input');
    const btnBuscar = listadoPadres.querySelector('#buscador button, #buscador .btn') || null;

    function normalizar(s) {
        // Normaliza: quita acentos, pasa a minúsculas y recorta espacios
        return (s || '').toString()
            .normalize('NFD')                 // separa diacríticos
            .replace(/[\u0300-\u036f]/g, '')  // elimina diacríticos (acentos)
            .replace(/\s+/g, ' ')             // normaliza espacios
            .trim()
            .toLowerCase();
    }

    function filtrarTablaGestionPadres(query) {
        const q = normalizar(query);
        // Intenta varias ids posibles para la tabla de padres
        const tabla = document.getElementById('tablaGestionPadres') || document.querySelector('#divListadoPadres table') || document.querySelector('table.dinamica');
        if (!tabla) return;
        const cuerpo = tabla.tBodies[0] || tabla;
        const filas = Array.from(cuerpo.rows || []);
        if (!q) {
            filas.forEach(r => r.style.display = '');
            return;
        }
        filas.forEach(fila => {
            const textoFila = Array.from(fila.cells || []).map(c => normalizar(c.textContent || c.innerText)).join(' ');
            fila.style.display = textoFila.indexOf(q) !== -1 ? '' : 'none';
        });
    }

    if (btnBuscar) {
        btnBuscar.addEventListener('click', (e) => {
            e.preventDefault();
            filtrarTablaGestionPadres(inputBusqueda ? inputBusqueda.value : '');
        });
    }

    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', (e) => {
            // Buscar al pulsar Enter
            if (e.key === 'Enter') {
                e.preventDefault();
                filtrarTablaGestionPadres(inputBusqueda.value);
            } else {
                // Búsqueda en tiempo real sin necesidad de Enter (descomentar si se desea)
                filtrarTablaGestionPadres(inputBusqueda.value);
            }
        });
    }

    // Si la tabla se carga dinámicamente, observar cambios y reaplicar filtro actual
    const tablaPadres = document.getElementById('tablaGestionPadres') || document.querySelector('#divListadoPadres table');
    if (tablaPadres && window.MutationObserver) {
        const observer = new MutationObserver(() => {
            filtrarTablaGestionPadres(inputBusqueda ? inputBusqueda.value : '');
        });
        observer.observe(tablaPadres, { childList: true, subtree: true });
    }
})();

{
document.addEventListener('DOMContentLoaded', () => {
    // Inicialización segura de la gestión de menús: sólo si existen los elementos
    const selMes = document.getElementById('menusMes');
    const inputFile = document.getElementById('menusFile');
    const btnUpload = document.getElementById('btnUploadMenu');
    const lista = document.getElementById('listaMenus');
    const feedback = document.getElementById('menusFeedback');
    const API_BASE = 'php/api/index.php?controller=menus&action=';

    const mostrarFeedback = (msg, tipo = 'info') => {
        if (!feedback) return;
        feedback.innerHTML = `<div class="alert alert-${tipo}" role="alert">${msg}</div>`;
        setTimeout(() => { if (feedback) feedback.innerHTML = ''; }, 4000);
    };

    // Función pública para cargar la lista de menús (solo si existe contenedor)
    window.cargarListaMenus = async function cargarListaMenus() {
        if (!lista) return;
        try {
            const res = await fetch(API_BASE + 'list', { method: 'GET', headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Error al listar menús');
            const data = await res.json();
            lista.innerHTML = '';
            for (let m = 1; m <= 12; m++) {
                const item = document.createElement('div');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                const nombreMes = new Date(0, m - 1).toLocaleString('es-ES', { month: 'long' });
                const url = data[m] || null;
                const left = document.createElement('div');
                left.innerHTML = `<strong>${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</strong>`;
                if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    a.className = 'ml-3';
                    a.textContent = 'Ver PDF';
                    left.appendChild(a);
                } else {
                    const span = document.createElement('span');
                    span.className = 'ml-3 text-muted';
                    span.textContent = 'No hay menú';
                    left.appendChild(span);
                }
                const right = document.createElement('div');
                if (url) {
                    const btnDel = document.createElement('button');
                    btnDel.className = 'btn btn-sm btn-outline-danger';
                    btnDel.textContent = 'Borrar';
                    (function(month){
                      btnDel.addEventListener('click', async () => {
                        if (!confirm('¿Eliminar el menú de este mes?')) return;
                        try {
                          const res = await fetch(API_BASE + 'delete', {
                            method: 'POST',
                            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                            body: JSON.stringify({ month: month })
                          });
                          const json = await res.json();
                          if (json.ok) {
                            mostrarFeedback('Menú eliminado.', 'success');
                            window.cargarListaMenus();
                          } else {
                            mostrarFeedback(json.error || 'Error al borrar.', 'danger');
                          }
                        } catch (e) {
                          console.error(e);
                          mostrarFeedback('Error al borrar.', 'danger');
                        }
                      });
                    })(m);
                    right.appendChild(btnDel);
                } else {
                    right.innerHTML = '<span class="text-muted small">Sin archivo</span>';
                }
                item.appendChild(left);
                item.appendChild(right);
                lista.appendChild(item);
            }
        } catch (e) {
            console.error(e);
            mostrarFeedback('No se han podido cargar los menús.', 'danger');
        }
    };

    // Subir PDF (sólo si existe el botón)
    if (btnUpload) {
        btnUpload.addEventListener('click', async (ev) => {
            ev.preventDefault();
            console.log('Intentando subir menú...');
            const month = parseInt(selMes?.value || 0, 10);
            const file = inputFile?.files && inputFile.files[0];
            if (!month || !file) {
                mostrarFeedback('Selecciona mes y fichero PDF.', 'warning');
                return;
            }
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                mostrarFeedback('Solo se permiten archivos PDF.', 'warning');
                return;
            }
            try {
                const fd = new FormData();
                fd.append('month', month);
                fd.append('file', file);
                const res = await fetch(API_BASE + 'upload', { method: 'POST', body: fd });
                if (!res.ok) {
                    console.error('Respuesta no OK', res.status, await res.text());
                    mostrarFeedback('Error en la subida (ver consola).', 'danger');
                    return;
                }
                const data = await res.json();
                if (data.ok) {
                    mostrarFeedback('Menú subido correctamente.', 'success');
                    if (selMes) selMes.value = '';
                    if (inputFile) inputFile.value = '';
                    if (typeof window.cargarListaMenus === 'function') window.cargarListaMenus();
                } else {
                    console.error('Error API:', data);
                    mostrarFeedback(data.error || 'Error al subir.', 'danger');
                }
            } catch (e) {
                console.error(e);
                mostrarFeedback('Error al subir fichero (excepción).', 'danger');
            }
        });
    }

    // Si la vista ya estaba visible al cargar, cargar la lista
    if (document.getElementById('gestionMenus') && !document.getElementById('gestionMenus').classList.contains('d-none')) {
        window.cargarListaMenus();
    }
});
}

(function installMenuSecretariaHandler() {
  if (window.__menuSecretariaHandler) return;
  window.__menuSecretariaHandler = true;

  // Añadimos gestionFestivos (y gestionTarifas por si acaso) para que se oculten al cambiar pestaña
  const VIEW_IDS = ['gestionDiaria','gestionMensual','gestionPadres','divQ19','acercade','gestionMenus','gestionFestivos','gestionTarifas','gestionCertificados'];

  function hideAllViews() {
    VIEW_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('d-none');
    });
  }

  function setActiveLi(li) {
    const items = document.querySelectorAll('#menuSecretaria ul li');
    items.forEach(i => i.classList.remove('active'));
    if (li) li.classList.add('active');
  }

  document.addEventListener('click', (ev) => {
    const li = ev.target.closest('#menuSecretaria ul li');
    if (!li) return;

    // soporta li sin data-view (ej. iconos o acciones especiales)
    const view = li.getAttribute('data-view');
    if (!view) return;

    ev.preventDefault();
    hideAllViews();

    const target = document.getElementById(view);
    if (target) target.classList.remove('d-none');

    setActiveLi(li);

    // Si es la vista de menús, cargar la lista si la función existe
    if (view === 'gestionMenus' && typeof window.cargarListaMenus === 'function') {
      window.cargarListaMenus();
    }

    // Si quieres que la lógica del controlador se ejecute también, intenta llamar a métodos
    // convencionales si existen (opcional)
    try {
      const ctrl = window.controladorSecretaria || null;
      if (ctrl) {
        // Mapea view -> método del controlador cuando el menu solo muestra el DIV
        const map = {
          gestionDiaria: 'verVistaGestionDiaria',
          gestionMensual: 'verVistaGestionMensual',
          gestionPadres: 'verVistaGestionPadres',
          gestionCertificados: 'verVistaGestionCertificados',
          divQ19: 'verVistaQ19',
          acercade: 'acercade'
          // añade más si el controlador tiene métodos específicos
        };
        const method = map[view] || ('ver' + view.charAt(0).toUpperCase() + view.slice(1));
        if (typeof ctrl[method] === 'function') {
          try { ctrl[method](); } catch(e) { /* no bloquear la UI si falla */ }
        }
      }
    } catch(e) { /* no bloquear */ }
  }, false);
})();
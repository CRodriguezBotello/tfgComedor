import { Modelo } from "../models/modelo.js";
import { VistaMenuSecretaria } from "../views/secretaria/vistamenusecretaria.js";
import { VistaGestionDiaria } from "../views/secretaria/vistagestiondiaria.js";
import { VistaGestionMensual } from "../views/secretaria/vistagestionmensual.js";
import { VistaGestionPadres } from "../views/secretaria/vistagestionpadres.js";
import { VistaQ19 } from "../views/secretaria/vistaq19.js";
import { Vista } from "../views/vista.js";
import { Rest } from "../services/rest.js";

/**
 * Controlador del panel de secretaría.
 */
class ControladorSecretaria {
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
            window.location.href = 'login_google.html';

        // Comprobar rol de usuario secretaría
        if (this.#usuario.rol != 'S')
            window.location.href = 'login_google.html';

        Rest.setAutorizacion(this.#usuario.autorizacion);

        this.modelo = new Modelo();
        this.vistaMenu = new VistaMenuSecretaria(this, document.getElementById('menuSecretaria'));
        this.vistaGestionDiaria = new VistaGestionDiaria(this, document.getElementById('gestionDiaria'));
        this.vistaGestionMensual = new VistaGestionMensual(this, document.getElementById('gestionMensual'));
        this.vistaGestionPadres = new VistaGestionPadres(this, document.getElementById('gestionPadres'));
        this.vistaQ19 = new VistaQ19(this, document.getElementById('divQ19'));
        this.acerca = new Vista(this, document.getElementById('acercade'));
   
        this.verVistaGestionDiaria();
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
    obtenerIncidencias(fecha) {
        this.modelo.obtenerIncidencias(fecha)
         .then(incidencias => {
             this.vistaGestionDiaria.cargarListado(incidencias);
         })
         .catch(e => {
             console.error(e);
         })
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
        this.vistaQ19.mostrar(false);
		}

    /**
     * Muestra la vista de gestión diaria.
     */
    verVistaGestionDiaria() {
				this.ocultarVistas()
        this.vistaGestionDiaria.mostrar(true);
    }

    /**
     * Muestra la vista de gestión mensual.
     */
    verVistaGestionMensual() {
				this.ocultarVistas()
        this.vistaGestionMensual.mostrar(true);
    }

    /**
     * Muestra la vista de gestión mensual.
     */
    verVistaGestionPadres() {
				this.ocultarVistas()
        this.vistaGestionPadres.mostrar(true);
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
	verQ19(mes){
		this.modelo.obtenerQ19(mes)
		.then ( q19 => {
			this.verVistaQ19()
			this.vistaQ19.iniciar(q19, mes)
		} )
	}
	
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
}

new ControladorSecretaria();

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

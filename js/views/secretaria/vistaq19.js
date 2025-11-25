import {Vista} from '../vista.js';
import { Datatable } from '../components/datatable.js'

/**
 * Contiene la vista de gestión del Q19.
 */
export class VistaQ19 extends Vista {
	#mes = null
	#PRECIO_MENU = null
	#MESES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
	#PRECIO_TUPPER = null

    /**
	 *	Constructor de la clase.
	 *	@param {ControladorSecretaria} controlador Controlador de la vista.
	 *	@param {HTMLDivElement} div Div de HTML en el que se desplegará la vista.
	 */
    constructor(controlador, div) {
        super(controlador, div)

				// Cargar precios desde el endpoint (usa controller que llama al DAO)
				this.fetchPrecios()
					.then(({precio_tupper, precio_menu}) => {
							this.inicializarTupper(precio_tupper)
							this.inicializarMenu(precio_menu)
					})
					.catch(err => {
							console.warn('No se pudieron cargar precios desde la BBDD, usando valores por defecto:', err);
							this.inicializarTupper(0.6)
							this.inicializarMenu([7.5, 6.5])
					})

				// Cogemos referencias a los elementos del interfaz
				this.btnNuevoRegistro = this.div.querySelectorAll('img')[0]
				this.btnDescargar = this.div.querySelectorAll('img')[1]
				this.tabla = this.div.querySelectorAll('table')[0]
				this.datatable = new Datatable(this.tabla)
				this.establecerAnchoColumnas(this.tabla)
				this.tbody = this.div.querySelectorAll('tbody')[0]

				// Asociamos eventos
				this.btnNuevoRegistro.onclick = this.crearNuevoRegistro.bind(this)
				this.btnDescargar.onclick = this.descargar.bind(this)
    }
		
		establecerAnchoColumnas(tabla){
			let anchuras = ''
			anchuras += 'minmax(25px, 0.2fr) '	//Icono de borrado
			anchuras += 'minmax(100px, 1fr) '
			anchuras += 'minmax(100px, 1fr) '		
			anchuras += 'minmax(100px, 1fr) '		
			anchuras += 'minmax(100px, 1fr) '	
			anchuras += 'minmax(150px, 1fr) '		
			anchuras += 'minmax(150px, 1fr) '		
			anchuras += 'minmax(150px, 1fr) '		
			anchuras += 'minmax(150px, 1fr) '		
			tabla.style.gridTemplateColumns = anchuras
		}

    /**
     * Refrescar/iniciar listado.
		 @param q19 {Array} Datos de los recibos del Q19
		 @param mes {Number} Número del mes.
     */
    iniciar(q19, mes) {
		// Muestra el div al quitar la clase "d-none"
		const divQ19 = document.getElementById('divQ19');
		divQ19.classList.remove('d-none');

		console.log(q19, mes);  // Agregar este log para ver si los datos son los esperados
		this.#mes = mes;
		this.limpiar();
		q19.forEach((recibo, indice) => {
			this.tbody.append(this.crearFila(recibo, indice));
		});
	}

	




    inicializarTupper(c) {
			this.#PRECIO_TUPPER = c;
		}

		inicializarMenu(c) {
			this.#PRECIO_MENU = c;
		}


	/**
		Crea una fila de la tabla para un recibo.
		@param registro {Recibo} Datos del recino.
		@param indice {Number} Posición del recibo en el Q19.
		return {HTMLTrElement} Fila de la tabla.
	**/
	crearFila(recibo, indice){
		console.log("Creando fila para recibo:", recibo);
		const tr = document.createElement('tr')
		tr.entidad = recibo
		// añadir data-attributes útiles
		try {
			if (recibo.dni) tr.setAttribute('data-dni', String(recibo.dni));
			if (recibo.referencia) tr.setAttribute('data-referencia', String(recibo.referencia));
			if (recibo.fecha_mandato) tr.setAttribute('data-fecha-mandato', String(recibo.fecha_mandato));
			if (recibo.concepto) tr.setAttribute('data-concepto', String(recibo.concepto));
		} catch(e) {}

		//Celda de iconos de operación
		let td = document.createElement('td')
		tr.append(td)
		const img1 = document.createElement('img')
		td.append(img1)
		img1.src = './img/icons/delete.svg'
		img1.title = 'eliminar recibo'
		img1.onclick = (evento) => {
			if (confirm('¿Seguro que quiere eliminar este recibo?'))
				evento.target.closest('tr').remove()
		}

		td = document.createElement('td')
		tr.append(td)
		td.setAttribute('data-campo', 'titular')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)
		td.textContent = recibo.titular || ''

		td = document.createElement('td')
		tr.append(td)
		td.setAttribute('data-campo', 'iban')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)
		td.textContent = recibo.iban || ''

		td = document.createElement('td')
		tr.append(td)
		td.setAttribute('data-campo', 'referenciaUnicaMandato')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)
		td.textContent = recibo.referenciaUnicaMandato || recibo.referencia || ''

		td = document.createElement('td')
		tr.append(td)
		td.setAttribute('data-campo', 'fechaFirmaMandato')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)
		td.textContent = recibo.fechaFirmaMandato || recibo.fecha_mandato || ''

		td = document.createElement('td')
		tr.append(td)
		recibo.secuenciaAdeudo = 'RCUR'
		td.setAttribute('data-campo', 'secuenciaAdeudo')
		td.setAttribute('data-tipo', 'select')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), ['RCUR', 'OOFF', 'FRST', 'FNAL'])

		td = document.createElement('td')
		tr.append(td)
		//Generamos el valor
		let indice2 = indice ?? 'X'
		recibo.referenciaAdeudo = `${(new Date()).getFullYear()}-${this.#mes}-${indice2}`
		td.setAttribute('data-campo', 'referenciaAdeudo')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)
		td.textContent = recibo.referenciaAdeudo || ''

		td = document.createElement('td')
		tr.append(td)
		// Preferir importe proporcionado por el servidor (si existe). Solo si no existe, calculamos localmente.
		const dias = Number(recibo.dias) || 0
		const diasTupper = Number(recibo.dias_tupper) || 0
		if (recibo.importe === undefined || recibo.importe === null || recibo.importe === '') {
			const menu = Array.isArray(this.#PRECIO_MENU) ? this.#PRECIO_MENU : [7.5, 6.5]
			let precio = menu[0]
			if (recibo.correo && /@fundacionloyola.es$/.test(recibo.correo)) precio = menu[1]
			const tupper = Number(this.#PRECIO_TUPPER ?? 0.6)
			// cálculo fallback y redondeo a 2 decimales
			recibo.importe = Number((dias * precio + diasTupper * tupper).toFixed(2))
		} else {
			// asegurar tipo numérico
			recibo.importe = Number(recibo.importe)
		}
		td.setAttribute('data-campo', 'importe')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)
		td.textContent = (typeof recibo.importe === 'number') ? recibo.importe.toFixed(2) : (recibo.importe || '')

		td = document.createElement('td')
		tr.append(td)
		// Preferir concepto que venga del servidor/controlador
		if (!recibo.concepto) recibo.concepto = `Comedor EVG ${this.#MESES[this.#mes]}.`
		td.setAttribute('data-campo', 'concepto')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)
		td.textContent = recibo.concepto || ''

		return tr
	}

	/**
		Borra los registros.
	**/
	limpiar(){
		this.eliminarHijos(this.tbody)
	}

	/**
		Inserta una nueva fila.	
	**/
	crearNuevoRegistro(){
		let nuevoRecibo = {
			'titular': '',
			'iban': '',
			'referenciaUnicaMandato': '',
			'fechaFirmaMandato': '',
			'dias': 0
		}
		const fila = this.crearFila(nuevoRecibo)
		console.log('Añadiendo fila:', fila);
		this.tbody.appendChild(fila)
		fila.children.item(1).dispatchEvent(new Event('dblclick'))
	}

	/**
		Solicita al modelo la actualización de un campo.
		@param td {HTMLTableCellElement} Celda de la tabla que se quiere actualizar.
	**/
	actualizarCampo (td){
		const entidad = td.parentElement.entidad
		const campo = td.getAttribute('data-campo')
		return new Promise( (resolver, rechazar) => resolver())
		//this.modeloTabla.actualizar(entidad.id, campo, entidad[campo])
	}
	
	descargar(){
		const recibos = []
		let importeTotal = 0
    this.tbody.querySelectorAll('tr').forEach( tr => {
			recibos.push(this.verCSV(tr.entidad))
			importeTotal += tr.entidad.importe
		} )
		//TODO: Incluir datos de cabecera, incluyendo importe total
		const csv = recibos.join("\r\n")
		const aOculto = document.createElement('a')
  	aOculto.href = 'data:attachment/csv,' + encodeURI(csv)
  	aOculto.target = '_blank'
  	aOculto.download = `Q19_${this.#MESES[this.#mes]}_${(new Date()).getFullYear()}.csv`
  	aOculto.click()
	}

	verCSV(recibo){
		const comillas = '"'
		const csv = []
		for (const campo in recibo) {
			csv.push(`${comillas}${recibo[campo]}${comillas}`)
		}
		return csv.join()
	}

	async fetchPrecios() {
       const resp = await fetch('php/api/controllers/precios.php')
       const data = await resp.json().catch(()=>{ throw new Error(`HTTP ${resp.status}`) })
       if (!resp.ok) {
           const msg = (data && (data.message || data.error)) ? (data.message || data.error) : `HTTP ${resp.status}`
           throw new Error(msg)
       }
       // Si llega lista [{idPrecio,nombreP,cantidad},...]
       if (Array.isArray(data)) {
           const get = id => {
               const it = data.find(d => d.idPrecio === id)
               return it ? parseFloat(it.cantidad) : null
           }
           const precio_tupper = get('precioTupper') ?? 0.6
           const precio_diario = get('precioDiario') ?? get('precioMensual') ?? 7.5
           const precio_profesor = get('precioDiaProfesor') ?? get('precioDiaHijoProfe') ?? precio_diario
           return { precio_tupper, precio_menu: [precio_diario, precio_profesor] }
       }
       // Si el endpoint ya devuelve objeto {precio_tupper, precio_menu}
       return data
   }

}

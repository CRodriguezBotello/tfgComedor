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
    		this.controlador.constanteTupper();
				this.controlador.constanteMenu();
				
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
			this.#mes = mes
			this.limpiar()
			q19.forEach( (recibo, indice) => {
					this.tbody.append(this.crearFila(recibo, indice))
				})
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
		const tr = document.createElement('tr')
		tr.entidad = recibo

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

		td = document.createElement('td')
		tr.append(td)
		td.setAttribute('data-campo', 'iban')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)

		td = document.createElement('td')
		tr.append(td)
		td.setAttribute('data-campo', 'referenciaUnicaMandato')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)

		td = document.createElement('td')
		tr.append(td)
		td.setAttribute('data-campo', 'fechaFirmaMandato')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)

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

		td = document.createElement('td')
		tr.append(td)
		let precio = this.#PRECIO_MENU[0]
		if (/@fundacionloyola.es$/.test(recibo.correo))
			precio = this.#PRECIO_MENU[1]
		recibo.importe = recibo.dias * precio + this.#PRECIO_TUPPER * recibo.dias_tupper
		td.setAttribute('data-campo', 'importe')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)

		td = document.createElement('td')
		tr.append(td)
		recibo.concepto = `Comedor EVG ${this.#MESES[this.#mes]}.`
		td.setAttribute('data-campo', 'concepto')
		this.datatable.activarCelda(td, null, this.actualizarCampo.bind(this, td), null)

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

}


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
        // recalcular numeración secuencial tras poblar la tabla
        this.actualizarContadorRefAdeudo();
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
			if (confirm('¿Seguro que quiere eliminar este recibo?')) {
				evento.target.closest('tr').remove()
				// actualizar numeración REF.ADEUDO tras borrar
				this.actualizarContadorRefAdeudo()
			}
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
     * Actualiza la columna REF.ADEUDO para que sea un contador 1..N
     * y sincroniza entidad.referenciaAdeudo en cada fila.
     */
    actualizarContadorRefAdeudo() {
        if (!this.tbody) return;
        const filas = Array.from(this.tbody.querySelectorAll('tr'));
        filas.forEach((tr, i) => {
            const contador = String(i + 1);
            tr.entidad = tr.entidad || {};
            tr.entidad.referenciaAdeudo = contador;
            const td = tr.children[6]; // columna 6 = REF.ADEUDO según crearFila
            if (td) td.textContent = contador;
        });
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
		// recalcular contador cuando se añade una fila
		this.actualizarContadorRefAdeudo();
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
        // Recolectar filas y total
        const filas = []
        let importeTotal = 0
        this.tbody.querySelectorAll('tr').forEach(tr => {
            const e = tr.entidad || {}
            const importe = Number((typeof e.importe === 'number') ? e.importe : (e.importe || 0))
            filas.push({
                titular: this._safe(e.titular),
                iban: this._safe(e.iban),
                mandato: this._safe(e.referenciaUnicaMandato || e.referencia || ''),
                fechaMandato: this._formatDate(e.fechaFirmaMandato || e.fecha_mandato || ''),
                secuencia: this._safe(e.secuenciaAdeudo || 'RCUR'),
                refAdeudo: this._safe(e.referenciaAdeudo || ''),
                importe: importe,
                concepto: this._safe(e.concepto || '')
            })
            importeTotal += importe
        })

        // Estilos inline para que Excel los aprecie al abrir el HTML
        const style = `
            <style>
                table { border-collapse:collapse; font-family: Arial, Helvetica, sans-serif; font-size:11pt; }
                td, th { border:1px solid #999; padding:6px; vertical-align:middle; }
                .header-gray { background: #d3d3d3; font-weight:700; text-align:left; }
                .title { font-weight:700; background:#9aa0a6; color:#fff; padding:6px; }
                .right { text-align:right; }
            </style>
        `

        // Cabecera superior (Datos generales) y tabla de cobros
        let html = '<html><head><meta charset="utf-8" />' + style + '</head><body>'
        // Bloque "Datos generales"
        html += '<table><tr><td class="title" colspan="9">DATOS GENERALES</td></tr>'
        html += '<tr class="header-gray">'
        html += '<td>IDENTIFICADOR DEL PRESENTADOR</td>'
        html += '<td>NOMBRE DEL PRESENTADOR</td>'
        html += '<td>OFICINA BBVA RECEPTORA</td>'
        html += '<td>IDENTIFICADOR DEL ACREEDOR</td>'
        html += '<td>FECHA DE COBRO ORIGINAL (dd/mm/aaaa)</td>'
        html += '<td>NOMBRE DEL ACREEDOR</td>'
        html += '<td>CUENTA DEL ACREEDOR</td>'
        html += '<td>IMPORTE TOTAL ADEUDOS</td>'
        html += '<td>DIVISA</td>'
        html += '</tr>'
        // fila de valores (vacíos salvo total/divisa)
        html += '<tr>'
        html += '<td></td><td></td><td></td><td></td><td></td><td></td><td></td>'
        html += `<td class="right">${this._formatAmount(importeTotal)}</td><td>EUR</td>`
        html += '</tr></table><br/>'

        // Bloque "Datos del cobro"
        html += '<table>'
        html += '<tr><td class="title" colspan="8">DATOS DEL COBRO</td></tr>'
        html += '<tr class="header-gray">'
        html += '<td>NOMBRE DEL DEUDOR</td>'
        html += '<td>CUENTA DEL DEUDOR</td>'
        html += '<td>REFERENCIA ÚNICA DEL MANDATO</td>'
        html += '<td>FECHA FIRMA MANDATO (dd/mm/aaaa)</td>'
        html += '<td>SECUENCIA DEL ADEUDO</td>'
        html += '<td>REFERENCIA DEL ADEUDO</td>'
        html += '<td>IMPORTE DEL ADEUDO</td>'
        html += '<td>CONCEPTO</td>'
        html += '</tr>'

        // Filas de deudores
        for (const r of filas) {
            html += '<tr>'
            html += `<td>${r.titular}</td>`
            html += `<td>${r.iban}</td>`
            html += `<td>${r.mandato}</td>`
            html += `<td>${r.fechaMandato}</td>`
            html += `<td>${r.secuencia}</td>`
            html += `<td>${r.refAdeudo}</td>`
            html += `<td class="right">${this._formatAmount(r.importe)}</td>`
            html += `<td>${r.concepto}</td>`
            html += '</tr>'
        }

        // Total final
        html += '<tr><td colspan="5"></td><td class="header-gray">IMPORTE_TOTAL</td>'
        html += `<td class="right">${this._formatAmount(importeTotal)}</td><td></td></tr>`

        html += '</table></body></html>'

        // Añadir BOM para evitar problemas con acentos en Excel
        const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Q19_${this.#MESES[this.#mes] || 'mes'}_${(new Date()).getFullYear()}.xls`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    // Helper: convierte objeto recibo a CSV (puede ser usado por otras funciones)
    verCSV(recibo){
        // Mantener compatibilidad: devuelve array ordenado de campos (no usado directamente en descargar ahora)
        return [
            this._safe(recibo.titular),
            this._safe(recibo.iban),
            this._safe(recibo.referenciaUnicaMandato || recibo.referencia || ''),
            this._formatDate(recibo.fechaFirmaMandato || recibo.fecha_mandato || ''),
            this._safe(recibo.secuenciaAdeudo || 'RCUR'),
            this._safe(recibo.referenciaAdeudo || ''),
            this._formatAmount(recibo.importe),
            this._safe(recibo.concepto || '')
        ].join(';')
    }

    // Utilidades locales
    _safe(v){ return (v === null || v === undefined) ? '' : String(v).replace(/"/g,'""') }
    _formatDate(s){
        if(!s) return ''
        // Acepta YYYY-MM-DD o DD/MM/YYYY o variantes; devuelve DD/MM/YYYY
        const iso = /^(\d{4})-(\d{2})-(\d{2})/
        const dmy = /^(\d{2})\/(\d{2})\/(\d{4})/
        if(iso.test(s)){
            const m = s.match(iso)
            return `${m[3]}/${m[2]}/${m[1]}`
        } else if(dmy.test(s)){
            return s.match(dmy).slice(1).reverse().join('/') // no necesario, pero dejamos entrada valida
        } else {
            // intentar Date parse
            const dt = new Date(s)
            if(!isNaN(dt.getTime())){
                const dd = String(dt.getDate()).padStart(2,'0')
                const mm = String(dt.getMonth()+1).padStart(2,'0')
                const yy = dt.getFullYear()
                return `${dd}/${mm}/${yy}`
            }
            return s
        }
    }
    _formatAmount(v){
        const n = Number(v || 0)
        // formatear con 2 decimales y coma decimal
        return n.toFixed(2).replace('.',',')
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

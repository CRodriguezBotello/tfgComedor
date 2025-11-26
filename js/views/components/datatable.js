/**
	Datable. Tabla de datos.
**/

export class Datatable {
	// Datatables 
	#MIN = 50;
	// The max (fr) values for grid-template-columns
	#columnTypeToRatioMap = {
		numeric: 1,
		'text-short': 1.67,
		'text-long': 3.33,
	};
	/*
		The following will soon be filled with column objects containing
		the header element and their size value for grid-template-columns 
	*/
	#columns = [];
	#headerBeingResized;

	constructor(table){
		this.table = table

		// Let's populate that columns array and add listeners to the resize handles
		this.table.querySelectorAll('th').forEach((header) => {
			const max = this.#columnTypeToRatioMap[header.dataset.type] + 'fr';
			this.#columns.push({ 
				header, 
				// The initial size value for grid-template-columns:
				size: `minmax(${this.#MIN}px, ${max})`,
			});

			//Ponemos la barra para redimensionar
			const resizeHandle = document.createElement('span')
			header.appendChild(resizeHandle)
			resizeHandle.classList.add('resize-handle')
			//header.querySelector('.resize-handle').addEventListener('mousedown', this.initResize.bind(this));
			resizeHandle.addEventListener('mousedown', this.initResize.bind(this));
		});

		//Editables
		this.table.querySelectorAll('td.editable').forEach((td) => {
			td.addEventListener('dblclick', (evento) => {
				let td = evento.target
				let valor = td.getAttribute('data-valor')
				while (td.firstChild) 
					td.lastChild.remove()

				let input = document.createElement('input')
				td.appendChild(input)
				input.setAttribute('value', valor)
				input.focus()
				input.select()
			})
		})
	}

	// Where the magic happens. I.e. when they're actually resizing
	onMouseMove(evento){
		requestAnimationFrame(() => {
			if (!this.#headerBeingResized) return

			// Calculate the desired width
			const horizontalScrollOffset = document.documentElement.scrollLeft + this.table.scrollLeft
			const width = (horizontalScrollOffset + evento.clientX) - this.#headerBeingResized.offsetLeft;
			
			// Update the column object with the new size value
			const column = this.#columns.find(({ header }) => header === this.#headerBeingResized);
			column.size = Math.max(this.#MIN, width) + 'px'; // Enforce our minimum
			
			// For the other headers which don't have a set width, fix it to their computed width
			this.#columns.forEach((column) => {
				if(column.size.startsWith('minmax')){ // isn't fixed yet (it would be a pixel value otherwise)
					column.size = parseInt(column.header.clientWidth, 10) + 'px';
				}
			});
		
			/* 
				Update the column sizes
				Reminder: grid-template-columns sets the width for all columns in one value
			*/
			this.table.style.gridTemplateColumns = this.#columns
				.map(({ header, size }) => size)
				.join(' ');
		});
	}

	// Clean up event listeners, classes, etc.
	onMouseUp(){	
		if (!this.#headerBeingResized) return

		window.removeEventListener('mousemove', this.onMouseMove);
		window.removeEventListener('mouseup', this.onMouseUp);
		this.#headerBeingResized.classList.remove('header--being-resized');
		this.#headerBeingResized = null;
	}

	// Get ready, they're about to resize
	initResize(evento){	
		this.#headerBeingResized = evento.target.parentNode;
		window.addEventListener('mousemove', this.onMouseMove.bind(this));
		window.addEventListener('mouseup', this.onMouseUp.bind(this));
		this.#headerBeingResized.classList.add('header--being-resized');
	}

	/**
		Convierte una celda en un campo "activo" (directamente conectado con la Base de Datos).
		@param campo {HTMLTableCellElement} Celda de tabla.
		@param validador {Function} Función para validar el campo que se llamará al actualizarlo. Recibe el valor del campo y devuelve true si el campo es válido o un texto de error en caso contrario.
		@param actualizador {Function} Función que se llamará si la validación del campo es positiva.
	**/
	activarCelda(td, validador, actualizador, extras = null){
		const entidad = td.parentElement.entidad
		const campo = td.getAttribute('data-campo')
		const tipo = td.getAttribute('data-tipo')
  	const valor = entidad[campo]
		td.classList.add('editable')
		//Crear un span con el valor
		let span = document.createElement('span')
		td.appendChild(span)
		span.textContent = valor
		//Crear el input
		let input = document.createElement('input')
		switch (tipo){
			case 'textarea':
				input = document.createElement('textarea')
				break
			case 'select':
				input = document.createElement('select')
				extras?.forEach( valor => {
					let option = document.createElement('option')
					input.appendChild(option)
					option.appendChild(document.createTextNode(valor))
				})
				break
			default:
				input.setAttribute('type', tipo)
		}
		td.appendChild(input)
		input.value = valor
		td.setAttribute('title', valor)
		//Evento de edición
		td.addEventListener('dblclick', (evento) => {
				span.style.display = 'none'
				input.style.display = 'block' 
				setTimeout(() => {
					input.focus()
					if (tipo !== 'select')	//Los select no tienen función select()
						input.select()
					}, 300)
			})
		//Evento de validación
		input.onkeydown = (evento) => {
			switch(evento.key){
				case 'Tab':
					if (evento.shiftKey)
						input.parentElement.previousSibling?.dispatchEvent(new Event('dblclick'))
					else
						input.parentElement.nextSibling?.dispatchEvent(new Event('dblclick'))
				case 'Enter':
					if (validador){
						if (validador(input.value) !== true){
							td.classList.add('error')	
							throw validador(input.value)
						}
					}
        	actualizador()
          .then(() => {
            td.classList.add('actualizado')
            entidad[campo] = input.value
            span.textContent = input.value
            setTimeout(() => { td.classList.remove('actualizado') }, 3000)
            span.style.display = 'block'
            input.style.display = 'none'
          })
          .catch((e) => {
            td.classList.add('error_rest')
            throw e
          })
					break
					case 'Escape':
						span.style.display = 'block'
						input.style.display = 'none'
						break
					}
				}
	}
}

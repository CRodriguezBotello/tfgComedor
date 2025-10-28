import {Vista} from '../vista.js';

/**
 * Contiene la vista de gestión de hijos.
 */
export class VistaGestionHijos extends Vista {
    /**
	 *	Constructor de la clase.
	 *	@param {Controlador} controlador Controlador de la vista.
	 *	@param {HTMLDivElement} div Div de HTML en el que se desplegará la vista.
	 */
    constructor(controlador, div) {
        super(controlador, div);

        this.idUsuario = 0;

        // Secciones de la vista
        this.divListadoHijos = this.div.querySelector('#divListadoHijos');
        this.divAltaHijos = this.div.querySelector('#divAltaHijos');
        this.divModificacionHijos = this.div.querySelector('#divModificacionHijos');

        // Listado
        this.thead = this.div.getElementsByTagName('thead')[0];
        this.tbody = this.div.getElementsByTagName('tbody')[0];

        // Alta
        this.formAlta = this.div.querySelector('#formAltaHijos');
        this.inputsAlta = this.formAlta.getElementsByTagName('input');
        this.btnCancelarAlta = this.formAlta.getElementsByTagName('button')[0];
        this.btnRegistrar = this.formAlta.getElementsByTagName('button')[1];
        this.divExitoAlta = this.div.querySelector('#divExitoAlta');
        this.divCargandoAlta = this.div.querySelector('#loadingImgAlta');
        this.btnRegistrar.addEventListener('click', this.validarFormularioAlta.bind(this));
        this.btnCancelarAlta.addEventListener('click', this.cancelarAlta.bind(this));

        // Alta con PIN
        this.formAltaPin = this.div.querySelector('#formAltaHijosPin');
        this.inputPin = this.formAltaPin.getElementsByTagName('input')[0];
        this.btnCancelarAltaPin = this.formAltaPin.getElementsByTagName('button')[0];
        this.btnRegistrarPin = this.formAltaPin.getElementsByTagName('button')[1];
        this.divExitoAltaPin = this.div.querySelector('#divExitoAltaPin');
        this.divErrorAltaPin = this.div.querySelector('#divErrorAltaPin');
        this.divCargandoPin = this.div.querySelector('#loadingImgPin');
        this.btnRegistrarPin.addEventListener('click', this.validarFormularioAltaPin.bind(this));
        this.btnCancelarAltaPin.addEventListener('click', this.cancelarAltaPin.bind(this));

        // Modificar
        this.formModificar = this.div.querySelector('#formModificacionHijos');
        this.inputsModificar = this.formModificar.getElementsByTagName('input');
        this.btnCancelarMod = this.formModificar.getElementsByTagName('button')[0];
        this.btnActualizar = this.formModificar.getElementsByTagName('button')[1];
        this.divExitoModificar = this.div.querySelector('#divExitoModificacion');
        this.divCargandoModificar = this.div.querySelector('#loadingImgModificacion');
        this.btnActualizar.addEventListener('click', this.validarFormularioModificacion.bind(this));
        this.btnCancelarMod.addEventListener('click', this.cancelarModificacion.bind(this));

        this.selectAlta = this.div.getElementsByTagName('select')[0];
        this.selectModificacion = this.div.getElementsByTagName('select')[1];

        this.controlador.obtenerCursos();
        this.mostrarOcultarCrud(true, false, false);    // Iniciar mostrando el listado de hijos.
    }

    /**
     * Mostrar/Ocultar crud hijos.
     * @param {Boolean} listado Mostrar o no listado de hijos.
     * @param {Boolean} alta Mostrar o no alta de hijos.
     * @param {Boolean} modificacion Mostrar o no modificación de hijos.
     */
    mostrarOcultarCrud(listado, alta, modificacion) {
        this.divAltaHijos.style.display = alta ? 'block' : 'none';
        this.divListadoHijos.style.display = listado ? 'block' : 'none';
        this.divModificacionHijos.style.display = modificacion ? 'block' : 'none';
    }
   
    /**
     * Actualiza el listado.
     * @param {Object} datos Datos del padre.
     */
    actualizar(datos) {
        this.idUsuario = datos.id;
        this.controlador.dameHijos(this.idUsuario);
    }

    /**
     * Cargar thead tabla hijos.
     */
    cargarEncabezado() {
        this.thead.innerHTML = '';
        
        let trTitulo = document.createElement('tr');
        let tdTitulo = document.createElement('td');
        tdTitulo.textContent = 'Tus hijos';
        tdTitulo.setAttribute('colspan', '4');
        trTitulo.appendChild(tdTitulo);

        let trHeadInfo = document.createElement('tr');
        trHeadInfo.setAttribute('id', 'trInfo');

        let tdNombre = document.createElement('td');
        tdNombre.textContent = 'Nombre';
        trHeadInfo.appendChild(tdNombre);

        let tdPin = document.createElement('td');
        tdPin.textContent = 'PIN';
        trHeadInfo.appendChild(tdPin);

        let tdOpciones = document.createElement('td');
        tdOpciones.textContent = 'Opciones';
        tdOpciones.setAttribute('colspan', '2');
        trHeadInfo.appendChild(tdOpciones);

        this.thead.appendChild(trTitulo);
        this.thead.appendChild(trHeadInfo);
    }

    /**
     * Carga tabla con los hijos.
     * @param {Array} hijos Listado de hijos.
     */
    cargarListado(hijos) {
        this.cargarEncabezado();
        this.tbody.innerHTML = '';  // Limpiar tabla para sustituirla con nuevos datos.

        if (hijos != null) {
            for (const hijo of hijos) {
                let tr = document.createElement('tr');
                this.tbody.appendChild(tr);
                
                let td1 = document.createElement('td');
                tr.appendChild(td1);
                td1.textContent = hijo.nombre;

                let tdPin = document.createElement('td');
                let spanPin = document.createElement('span');
                spanPin.classList.add('spanPin');
                spanPin.textContent = hijo.pin;
                spanPin.addEventListener('click', this.copiarPin.bind(this, spanPin.innerText));
                tdPin.appendChild(spanPin);
                tr.appendChild(tdPin);

                let td2 = document.createElement('td');
                td2.classList.add('tdOperaciones');
                td2.setAttribute('colspan', '2');
                tr.appendChild(td2);
                
                let esPadreDeAlta = hijo.idPadreAlta == this.idUsuario;

                let iconoEditar = document.createElement('img');
                iconoEditar.setAttribute('src', esPadreDeAlta ? './img/icons/edit_children.svg' : './img/icons/edit_children_disabled.svg');
                iconoEditar.setAttribute('alt', 'Modificar hijo');
                iconoEditar.setAttribute('title', esPadreDeAlta ? 'Modificar hijo' : 'Solo el otro progenitor puede modificar los datos');

                if (esPadreDeAlta) {
                    iconoEditar.addEventListener('click', this.editar.bind(this, hijo));
                }

                td2.appendChild(iconoEditar);

                let iconoEliminar = document.createElement('img');
                iconoEliminar.setAttribute('src', './img/icons/person_remove.svg');
                iconoEliminar.setAttribute('alt', 'Eliminar hijo');
                iconoEliminar.setAttribute('title', 'Eliminar hijo');
                
                if (esPadreDeAlta) {
                    iconoEliminar.addEventListener('click', this.eliminar.bind(this, hijo.id));
                }
                else {
                    iconoEliminar.addEventListener('click', this.eliminarRelacion.bind(this, hijo.id));
                }
                
                td2.appendChild(iconoEliminar);
            }

            
            let trAnadir = document.createElement('tr');
            this.tbody.appendChild(trAnadir);

            let tdAnadir = document.createElement('td');
            tdAnadir.setAttribute('id', 'añadir');
            tdAnadir.setAttribute('colspan', '4');
            trAnadir.appendChild(tdAnadir);

            let iconoInsertar = document.createElement('img');
            iconoInsertar.setAttribute('id', 'btnAnadir');
            iconoInsertar.setAttribute('src', './img/icons/add.svg');
            iconoInsertar.setAttribute('title', 'Añadir nuevo hijo');
            iconoInsertar.setAttribute('alt', 'Añadir nuevo hijo');
            iconoInsertar.addEventListener('click', this.anadir.bind(this));

            tdAnadir.appendChild(iconoInsertar);
        } 
    }

    /**
     * Copiar PIN de hijo al clipboard.
     * @param {String} pin Código PIN del hijo.
     */
    copiarPin(pin) {
        navigator.clipboard.writeText(pin);
    }

    /**
     * Rellena los select con la lista de cursos recibida.
     * @param {Array} cursos Array de cursos.
     */
    rellenarSelects(cursos) {
        for (const curso of cursos) {
            let optionAlta = document.createElement('option');
            optionAlta.textContent = curso.nombre;
            optionAlta.value = curso.id;

            // Crear otro option igual para el select de modificar, porque no se puede usar el mismo para ambos :/
            let optionMod = document.createElement('option');   
            optionMod.textContent = curso.nombre;
            optionMod.value = curso.id;
            
            this.selectAlta.appendChild(optionAlta);
            this.selectModificacion.appendChild(optionMod);
        }
        
    }

    /**
     * Bloquear o no botones formularios de alta.
     * @param {Boolean} bloquear True bloquear, false desbloquear.
     */
    bloquearBotonesAlta(bloquear) {
        this.btnCancelarAlta.disabled = bloquear;
        this.btnRegistrar.disabled = bloquear;

        this.btnCancelarAltaPin.disabled = bloquear;
        this.btnRegistrarPin.disabled = bloquear;
    }

    /**
     * Valida formulario y realiza proceso en caso de que las validaciones se cumplan.
     */
    validarFormularioAlta() {
        this.formAlta.classList.add('was-validated');
        this.selectAlta.setCustomValidity('');

        if (this.selectAlta.value != -1) {
            if (this.inputsAlta[0].checkValidity() && this.inputsAlta[1].checkValidity()) {
                const datos = {
                    'id': this.idUsuario,
                    'nombre': this.inputsAlta[0].value,
                    'apellidos': this.inputsAlta[1].value,
                    'idCurso': parseInt(this.selectAlta.value)
                };
    
                this.bloquearBotonesAlta(true);
                this.divCargandoAlta.style.display = 'block';

                this.controlador.altaHijo(datos);
            }
        }
        else {
            this.selectAlta.setCustomValidity('Selecciona un curso.');
            this.selectAlta.reportValidity();
        }
    }

    /**
     * Valida formulario y realiza proceso en caso de que las validaciones se cumplan.
     */
    validarFormularioModificacion() {
        this.formModificar.classList.add('was-validated');
        this.selectModificacion.setCustomValidity('');

        if (this.selectModificacion.value != -1) {
            if (this.inputsModificar[0].checkValidity() && this.inputsModificar[1].checkValidity()) {
                const datos = {
                    'id': this.idUsuario,
                    'nombre': this.inputsModificar[0].value,
                    'apellidos': this.inputsModificar[1].value,
                    'idCurso': parseInt(this.selectModificacion.value)
                };
    
                this.btnActualizar.disabled = true;
                this.btnCancelarMod.disabled = true;
                this.divCargandoModificar.style.display = 'block';
                this.controlador.modificarHijo(datos);
            }
        }
        else {
            this.selectModificacion.setCustomValidity('Selecciona un curso.');
            this.selectModificacion.reportValidity();
        }
    }

    /**
     * Limpia los campos del formulario alta.
     */
    cancelarAlta() {
        for (let input of this.inputsAlta)
            input.value = '';

        this.mostrarOcultarCrud(true, false, false);
    }

    /**
     * Validar campo de PIN.
     */
    validarFormularioAltaPin() {
        this.formAltaPin.classList.add('was-validated');
        
        if (this.inputPin.checkValidity()) {
            const datos = {
                'id': this.idUsuario,
                'pin': this.inputPin.value
            };

            this.bloquearBotonesAlta(true);
            this.divCargandoPin.style.display = 'block';

            this.controlador.registrarHijoPin(datos);
        }
    }

    /**
     * Limpia el campo del formulario de alta con PIN.
     */
    cancelarAltaPin() {
        this.inputPin.value = '';
        this.mostrarOcultarCrud(true, false, false);
    }

    /**
     * Aviso de errores al usuario del alta con PIN.
     * @param {Object} e Error.
     */
    errorAltaPin(e) {
        this.divCargandoPin.style.display = 'none';

        if (e != null) {
            if (e == 'Error: 400 - Bad Request 1') {
                this.divErrorAltaPin.innerHTML = '<p>No existe un hijo con ese PIN.</p>';
            }
            else if (e == 'Error: 500 - Internal Server Error 1') {
                this.divErrorAltaPin.innerHTML = '<p>Ya tienes añadido un hijo con ese PIN asociado.</p>';
            }
            else {
                this.divErrorAltaPin.innerHTML = '<p>' + e + '</p>';
            }

            this.divErrorAltaPin.style.display = 'block';
            this.formAltaPin.classList.remove('was-validated');
            window.scrollTo(0, document.body.scrollHeight);
        }
        else {
            this.divErrorAltaPin.style.display = 'none';
        }
    }

    /**
     * Informar al usuario del alta mediante PIN exitosa.
     * @param {Boolean} activar Activa o no mensaje éxito.
     */
    exitoAltaPin(activar) {
        this.formAltaPin.classList.remove('was-validated');
        this.formAltaPin.reset();
        this.divCargandoPin.style.display = 'none';
        this.divExitoAltaPin.style.display = activar ? 'block' : 'none';
    }

    /**
     * Muestra el formulario de alta
     */
    anadir() {
        this.mostrarOcultarCrud(false, true, false);
    }

    /**
     * Elimina un hijo de la lista.
     */
    eliminar(id) {
        if (confirm("¿Estas seguro de que deseas eliminar a tu hijo/a?")) {
            this.controlador.eliminarHijo(id);
        }
    }

    /**
     * Limpia los campos del formulario modificación.
     */
    cancelarModificacion() {
        if (this.divExitoModificar.style.display == 'block')
            this.divExitoModificar.style.display = 'none';

        for (let input of this.inputsModificar)
            input.value = '';

        this.mostrarOcultarCrud(true, false, false);
    }

    /**
     * Mostrar formulario de edición de hijos.
     * @param {Object} hijo Datos hijo.
     */
    editar(hijo) {
        this.mostrarOcultarCrud(false, false, true);

        this.idUsuario = hijo.id;
        this.inputsModificar[0].value = hijo.nombre;
        this.inputsModificar[1].value = hijo.apellidos;
        this.selectModificacion.value = hijo.idCurso;
    }

    /**
     * Elimina un hijo de la lista.
     * @param {Number} id ID del hijo.
     */
    eliminar(id) {
        if (confirm("¿Está seguro de que desea eliminar a su hijo/a?\nSe eliminarán los menús futuros que tenga reservados.\nEsta acción es irreversible.")) {
            this.controlador.eliminarHijo(id);
        }
    }

    /**
     * Elimina relación con hijo.
     * @param {Number} id ID del hijo.
     */
    eliminarRelacion(id) {
        if (confirm("¿Estas seguro de que deseas eliminar a tu hijo/a? Podrás añadirlo/a de vuelta usando su PIN.")) {
            this.controlador.eliminarRelacionHijo(id);
        }
    }

    /**
     * Informar al usuario del alta exitosa.
     * @param {Boolean} activar Activa o no mensaje éxito.
     */
    exitoAlta(activar) {
        this.formAlta.classList.remove('was-validated');
        this.formAlta.reset();
        this.divCargandoAlta.style.display = 'none';
        this.divExitoAlta.style.display = activar ? 'block' : 'none';
    }

    /**
     * Informar al usuario de la modificación exitosa.
     * @param {Boolean} activar Activa o no mensaje éxito.
     */
    exitoModificacion(activar) {
        this.formModificar.classList.remove('was-validated');
        this.divCargandoModificar.style.display = 'none';
        this.divExitoModificar.style.display = activar ? 'block' : 'none';
    }
    
    mostrar(ver) {
        super.mostrar(ver);
        
        if (ver) this.mostrarOcultarCrud(true, false, false);

        if (this.divExitoAlta.style.display == 'block')
            this.exitoAlta(false);

        if (this.divExitoAltaPin.style.display == 'block')
            this.exitoAltaPin(false);

        if (this.divExitoModificar.style.display == 'block')
            this.exitoModificacion(false);
    }
}

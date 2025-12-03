/**
 * Se utiliza como clase base para las demás vistas de la aplicación.
 */
export class Vista {
    /**
     * Constructor de la clase.
     * @param {Object} controlador Controlador de la vista.
     * @param {HTMLDivElement} div Contenedor dónde se despliega la vista.
     */
    constructor(controlador, div) {
        this.controlador = controlador;
        this.div = div;
    }

    /**
	 *	Muestra u oculta el div principal de la vista.
	 *	@param {Boolean} ver True muestra la vista y false la oculta.
     */
    mostrar(ver) {
        if(ver) {
            this.div.style.display = 'block';
        }
        else {
            this.div.style.display = 'none';
        }
    }
    /**
    *	Elimina los nodos hijos de un nodo.
    *   @param {HTMLElement} nodo. El nodo del que se eliminarán los hijos.
    */
    eliminarHijos(nodo){
    	while (nodo.firstChild)
    		nodo.removeChild(nodo.lastChild)
    }
}

/**
  Servicio REST.
  Servicio para interfaz RESTful.
  Ref: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  Ref: https://restfulapi.net/
  Ref: https://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api
  O callback o devolvemos una promesa (mejor, así se puede controlar el error en local)
**/

export class Rest {
	static #URL = 'php/api/index.php'
	static #autorizacion = null
  
	/**
	  Establece la autorización para las llamadas al servidor.
	  La autorización se envía en la cabecera HTTP Authorization.
	**/
	static setAutorizacion (autorizacion) {
	  Rest.#autorizacion = autorizacion
	}
  
	/**
	  Realiza una llamada AJAX por GET
	  @param path {String} Path del recurso solicitado.
	  @param pathParams {Array} Parámetros de path que se añadirán a la llamada.
	  @param queryParams {Map} Mapa de parámetros que se añadirán después del path.
	  @return {Promise} Devuelve una promesa.
	**/
	static get (path, pathParams = [], queryParams) {
	  const opciones = {
		method: 'GET',
		headers: Rest._getHeaders()
	  }
  
	  return fetch(Rest._construirURL(path, pathParams, queryParams), opciones) // Hacemos la petición
		.then(respuesta => {
		  // Control de Errores
		  if (!respuesta.ok) throw Error(`${respuesta.status} - ${respuesta.statusText}`)
		  // Comprobamos si es JSON válido
		  const tipo = respuesta.headers.get('content-type')
		  if (tipo && tipo.indexOf('application/json') !== -1) { return respuesta.json() }
		  // No es json
		  return respuesta.text()
		})
	}
  
	/**
	  Realiza una llamada AJAX por POST
	  @param path {String} Path del recurso solicitado.
	  @param pathParams {Array} Parámetros de path que se añadirán a la llamada.
	  @param requestBody {Object} Objeto que se pasa como parámetro en el body de la llamada.
	  @param json {Boolean} Normalmente, la llamada POST devolverá un texto con la URL del nuevo recurso creado. Opcionalmente, especificando el parámetro json a true se obtiene el resultado en formato JSON.
	  @return {Promise} Devuelve una promesa.
	**/
	static post (path, pathParams = [], requestBody = null, json = false) {
	  const opciones = {
		method: 'POST',
		headers: Rest._getHeaders(),
		body: JSON.stringify(requestBody)
	  }

	  // Construimos la petición
	  return fetch(Rest._construirURL(path, pathParams), opciones) // Hacemos la petición
		.then(respuesta => {
		  // Control de Errores
		  if (!respuesta.ok) { throw Error(`${respuesta.status} - ${respuesta.statusText}`) }
  
		  if (json) return respuesta.json() // Si fuera json.
		  // La respuesta es un texto con la URL del recurso creado.
		  else return respuesta.text()
		})
	}
  
	/**
	  Realiza una llamada AJAX por DELETE
	  @param path {String} Path del recurso solicitado.
	  @param pathParams {Array} Parámetros de path que se añadirán a la llamada.
	  @return {Promise} Devuelve una promesa.
	**/
	static delete (path, pathParams) {
	  const opciones = {
		method: 'DELETE',
		headers: Rest._getHeaders()
	  }
	  // Construimos la petición
	  return fetch(Rest._construirURL(path, pathParams), opciones) // Hacemos la petición
		.then(respuesta => {
		  // Control de Errores
		  if (!respuesta.ok) throw Error(`${respuesta.status} - ${respuesta.statusText}`)
  
		  return true
		})
	}
  
	/**
	  Realiza una llamada AJAX por PUT
	  @param path {String} Nombre del recurso solicitado.
	  @param pathParams {Array} Parámetros de path que se añadirán a la llamada.
	  @param requestBody {Object} Objeto que se pasa como parámetro en la llamada.
	  @param json {Boolean} Normalmente, la llamada POST devolverá un texto con la URL del nuevo recurso creado. Opcionalmente, especificando el parámetro json a true se obtiene el resultado en formato JSON.
	  @return {Promise} Devuelve una promesa.
	**/
	static put (path, pathParams = [], requestBody = null, json = false) {
	  const opciones = {
		method: 'PUT',
		headers: Rest._getHeaders(),
		body: JSON.stringify(requestBody)
	  }
	  // Construimos la petición
	  return fetch(Rest._construirURL(path, pathParams), opciones) // Hacemos la petición
		.then(respuesta => {
		  // Control de Errores
		  if (!respuesta.ok) { throw Error(`${respuesta.status} - ${respuesta.statusText}`) }
  
		  if (json) return respuesta.json() // Si fuera json.
		  // La respuesta es un texto con la URL del recurso creado.
		  else return respuesta.text()
		})
	}
  
	// Métodos internos no documentado.
	static _getHeaders () {
	  return {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		Authorization2: Rest.#autorizacion
	  }
	}
  
	static _construirURL (path, pathParams = [], queryParams) {
	  let url = `${Rest.#URL}/${path}/${pathParams.join('/')}`
	  // TODO: Procesar el mapa de queryParams para generar el query string ?nombre1=valor1&nombre2=valor2...
	  if (queryParams) {
		url += '?'
		queryParams.forEach((valor, clave) => {
		  url += `${clave}=${valor}&`
		})
		url = url.substring(0, url.length - 1)
	  }
	  url = encodeURI(url.replace('//', '/null/')) // aseguramos los parámetros nulos.
	  return url
	}
}
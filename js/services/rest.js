export class Rest {
    static #URL = 'php/api/index.php';
    static #autorizacion = null;

    static setAutorizacion(token) {
        Rest.#autorizacion = token;
    }

    static _getHeaders() {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization2: Rest.#autorizacion ? Rest.#autorizacion : ''
        };
    }

    static _construirURL(path, pathParams = [], queryParams) {
        let url = `${Rest.#URL}/${path}/${pathParams.join('/')}`;
        if (queryParams) {
            url += '?';
            queryParams.forEach((valor, clave) => {
                url += `${clave}=${valor}&`;
            });
            url = url.slice(0, -1);
        }
        return encodeURI(url.replace('//', '/null/'));
    }

    static async get(path, pathParams = [], queryParams) {
        const url = Rest._construirURL(path, pathParams, queryParams);
        const opciones = { method: 'GET', headers: Rest._getHeaders() };
        const respuesta = await fetch(url, opciones);
        const cuerpo = await respuesta.text();

        if (!respuesta.ok) throw new Error(`${respuesta.status} - ${respuesta.statusText}: ${cuerpo}`);

        try { return JSON.parse(cuerpo); } catch { return cuerpo; }
    }

    static async post(path, pathParams = [], requestBody = null, json = true) {
        const url = Rest._construirURL(path, pathParams);
        const opciones = {
            method: 'POST',
            headers: Rest._getHeaders(),
            body: JSON.stringify(requestBody)
        };
        const respuesta = await fetch(url, opciones);
        const cuerpo = await respuesta.text();

        if (!respuesta.ok) throw new Error(`${respuesta.status} - ${respuesta.statusText}: ${cuerpo}`);

        if (json) {
            try { return JSON.parse(cuerpo); } catch { return cuerpo; }
        }
        return cuerpo;
    }

    static async put(path, pathParams = [], requestBody = null, json = true) {
        const url = Rest._construirURL(path, pathParams);
        const opciones = {
            method: 'PUT',
            headers: Rest._getHeaders(),
            body: JSON.stringify(requestBody)
        };
        const respuesta = await fetch(url, opciones);
        const cuerpo = await respuesta.text();

        if (!respuesta.ok) throw new Error(`${respuesta.status} - ${respuesta.statusText}: ${cuerpo}`);

        if (json) {
            try { return JSON.parse(cuerpo); } catch { return cuerpo; }
        }
        return cuerpo;
    }

    static async delete(path, pathParams = []) {
        const url = Rest._construirURL(path, pathParams);
        const opciones = { method: 'DELETE', headers: Rest._getHeaders() };
        const respuesta = await fetch(url, opciones);

        if (!respuesta.ok) {
            const cuerpo = await respuesta.text();
            throw new Error(`${respuesta.status} - ${respuesta.statusText}: ${cuerpo}`);
        }

        return true;
    }
}

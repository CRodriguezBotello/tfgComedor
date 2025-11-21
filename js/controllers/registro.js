import { Rest } from "../services/rest.js";

/**
 * Controlador del registro de padres.
 */
class Registro {
    constructor() {
        window.onload = this.iniciar.bind(this);
        window.onerror = (error) => console.error('Error capturado. ' + error);
    }

    /**
     * Inicia al cargar la página.
     */
    iniciar() {
        this.form = document.getElementsByTagName('form')[0];
        this.inputs = document.getElementsByTagName('input');
        this.divExito = document.getElementById('divExito');
        this.divError = document.getElementById('divError');
        this.divCargando = document.getElementById('loadingImg');
        this.btnCancelar = document.getElementsByTagName('button')[0];
        this.btnRegistrar = document.getElementsByTagName('button')[1];
        
        this.btnRegistrar.addEventListener('click', this.validarFormulario.bind(this));
        this.btnCancelar.addEventListener('click', this.volverAtras.bind(this));

				this.iIban = document.querySelectorAll('input[name="iban"]')[0]
				this.iIban.onpaste = ( evento => {
					this.iIban.value = evento.clipboardData.getData('text').toUpperCase().replaceAll(' ','')
				})
    }

    /**
     * Valida que los campos sean válidos y realiza el proceso si es así.
     */
    validarFormulario() {
        let cont;
        let total = this.inputs.length;

        for (cont=0; cont<total; cont++) {
            if (!this.inputs[cont].checkValidity()) break;
        }
        
        this.inputs[4].setCustomValidity('');
        this.inputs[7].setCustomValidity('');
        this.form.classList.add('was-validated');

        if (cont == total) {
            // Check de contraseñas
            if (this.inputs[3].value === this.inputs[4].value) {
                // Check de IBAN
								this.inputs[7].value = this.inputs[7].value.toUpperCase().replaceAll(' ','')
                if (this.inputs[7].value.match(/^ES\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}|ES\d{22}$/) &&
									this.isValidIBANNumber(this.inputs[7].value)) {
                    this.divCargando.style.display = 'block';
                
                    if (this.divError.style.display == 'block')
                        this.divError.style.display = 'none';
    
                    this.btnRegistrar.disabled = true;
                    this.btnCancelar.disabled = true;
                    this.insertarPersona();
                }
                else {
                    this.inputs[7].setCustomValidity('El IBAN introducido no es válido.');
                    this.inputs[7].reportValidity();
                }
            }
            else {
                this.inputs[4].setCustomValidity('Las contraseñas no coindicen.');
                this.inputs[4].reportValidity();
            }
        }
    }

	//Validación de IBAN: Ref https://stackoverflow.com/questions/21928083/iban-validation-check
	/*
	 * Returns 1 if the IBAN is valid 
	 * Returns FALSE if the IBAN's length is not as should be (for CY the IBAN Should be 28 chars long starting with CY )
	 * Returns any other number (checksum) when the IBAN is invalid (check digits do not match)
	 */
	isValidIBANNumber(input) {
			var CODE_LENGTHS = {
					AD: 24, AE: 23, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
					CH: 21, CR: 21, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
					FI: 18, FO: 18, FR: 27, GB: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
					HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
					LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27,
					MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29,
					RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24, TR: 26,   
					AL: 28, BY: 28, CR: 22, EG: 29, GE: 22, IQ: 23, LC: 32, SC: 31, ST: 25,
					SV: 28, TL: 23, UA: 29, VA: 22, VG: 24, XK: 20
			};
			var iban = String(input).toUpperCase().replace(/[^A-Z0-9]/g, ''), // keep only alphanumeric characters
							code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/), // match and capture (1) the country code, (2) the check digits, and (3) the rest
							digits;
			// check syntax and length
			if (!code || iban.length !== CODE_LENGTHS[code[1]]) {
					return false;
			}
			// rearrange country code and check digits, and convert chars to ints
			digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, function (letter) {
					return letter.charCodeAt(0) - 55;
			});
			// final check
			return this.mod97(digits) === 1;
	}

	mod97(string) {
			var checksum = string.slice(0, 2), fragment;
			for (var offset = 2; offset < string.length; offset += 7) {
					fragment = String(checksum) + string.substring(offset, offset + 7);
					checksum = parseInt(fragment, 10) % 97;
			}
			return checksum;
	}

    /**
     * Llamada al servidor para añadir a persona a la BBDD.
     */
    insertarPersona() {
        const usuario = {
            nombre: this.inputs[0].value,
            apellidos: this.inputs[1].value,
            correo: this.inputs[2].value,
            clave: this.inputs[3].value,
            telefono: this.inputs[5].value,
            dni: this.inputs[6].value,
            iban: this.inputs[7].value,
            titular: this.inputs[8].value
        };

        const correoFundacion = usuario.correo.includes('@fundacionloyola.es') || usuario.correo.includes('@alumnado.fundacionloyola.net');

        if (correoFundacion) {
            Rest.post('persona', [], usuario, true)
             .then(() => {
                this.divCargando.style.display = 'none';
                this.exito(usuario);
                
             })
             .catch(e => {
                 this.divCargando.style.display = 'none';
                 this.error(e);
             });
        } else {
            Rest.post('persona', [], usuario, true)
            .then(id => {
                this.insertarPadre(id, usuario);
            })
            .catch(e => {
                this.divCargando.style.display = 'none';
                this.error(e);
            });
        }
    }

    /**
     * Llamada al servidor para añadir padre a la BBDD.
     * @param {Number} id ID de la persona.
     * @param {Object} usuario Datos de la persona.
     */
    insertarPadre(id, usuario) {
        Rest.post('padres', [], id, false)
         .then(() => {
             this.divCargando.style.display = 'none';
             this.exito(usuario);
         })
         .catch(e => {
             this.divCargando.style.display = 'none';
             this.error(e);
         })
    }

    /**
     * Aviso de errores al usuario.
     * @param {Object} e Error.
     */
    error(e) {
        if (e != null) {
            if(e == 'Error: 500 - Internal Server Error 1') {
                this.divError.innerHTML = '<p>Ya existe una cuenta con esa dirección de correo.</p>';
            }
            else if (e == 'Error: 408 - Request Timeout') {
                this.divError.innerHTML = '<p>No hay conexión con la base de datos. Intente de nuevo más tarde.</p>';
            }
            else {
                this.divError.innerHTML = '<p>' + e + '</p>';
            }

            this.divError.style.display = 'block';
            this.form.classList.remove('was-validated');
            window.scrollTo(0, document.body.scrollHeight);
        }
        else {
            this.divError.style.display = 'none';
        }

        this.btnRegistrar.disabled = false;
        this.btnCancelar.disabled = false;
    }

    /**
     * Informar al usuario del alta exitosa, y redirigir a página de padres.
     * @param {Object} datos Datos del usuario.
     */
    exito(datos) {
        if (this.divError.style.display == 'block')
            this.divError.style.display = 'none';

        for (let input of this.inputs)
            input.disabled = true;

        this.btnRegistrar.disabled = true;
        this.btnCancelar.disabled = true;
        this.divExito.style.display = 'block';

        window.scrollTo(0, document.body.scrollHeight);
        this.iniciarSesion(datos);
    }

    /**
     * Vuelve a la página anterior.
     */
    volverAtras() {
        window.history.go(-1);
    }

    /**
     * Loguear usuario.
     * @param {Object} datos Datos del usuario.
     */
    iniciarSesion(datos) {
        const login = {
            usuario: datos.correo,
            clave: datos.clave
        };

        Rest.post('login', [], login, true)
         .then(usuario => {
             sessionStorage.setItem('usuario', JSON.stringify(usuario));
             window.location.href = 'index.html';
         })
         .catch(e => {
             this.error(e);
         })
    }

    /**
     * Asigna rol de padre y redirigir.
     */
    redireccionar() {
        let usuario = JSON.parse(sessionStorage.getItem('usuario'));
        usuario.rol = 'P';  // Poner rol de usuario padre.
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        window.location.href = 'index.html';
    }
}

new Registro();

<?php
    require_once('vendor/autoload.php');
    require_once(dirname(__DIR__) . '/daos/daousuario.php');
    require_once(dirname(__DIR__) . '/models/usuario.php');

    // Constantes de tipos de usuario
    //define('SECRETARIA', 'mjaque@fundacionloyola.es'); // pvillalon@fundacionloyola.es
    define('ALUMNADO', '@alumnado.fundacionloyola.net');
    define('PERSONAL', '@fundacionloyola.es');

    /**
     * Controlador de autenticación.
     * Ref: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
     */
    class LoginGoogle {
        // Se configura por inyección de dependencias
        public static $clave = null;
        public static $algoritmo_encriptacion = null;
        public static $iv = ''; // FALTA LA CADENA DE CARACTERES QUE ESTÁ EN EL CÓDIGO COMPLETO
		public static $secretaria = null;

        //Id de cliente de Google.
        private static $ID_CLIENTE = ''; // FALTA EL ID DE CLIENTE DEL PROYECTO DE GOOGLE

        /**
         * Autentifica al usuario con el email y la clave.
         * Devuelve por HTTP el objeto usuario en formato JSON.
         * @param string $pathParams No utilizado.
         * @param string $queryParams No utilizado.
         * @param string $token Token de login de Google.
         */
        function post($pathParams, $queryParams, $token) {
		global $config;
		if ($config['test'] && in_array($token, self::$secretaria)) {
			$payload = [];
			$payload['email'] = $token;
			$payload['given_name'] = '-';
			$payload['family_name'] = '-';
		}
		else{
            $client = new Google_Client(['client_id' => self::$ID_CLIENTE]);
            $payload = $client->verifyIdToken($token);

            if (!$payload) {
                // Invalid ID token
                header('HTTP/1.1 401 Unauthorized');
                die();
            }
				}

            // El usuario ha sido identificado por Google
            $usuario = DAOUsuario::autenticarEmail($payload['email']);

            if (!$usuario) {
                sleep(2);
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            // Verificar el tipo de usuario que hace login
            $tipo = $this->obtenerTipo($payload['email']);

            if ($tipo == null) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            // Completamos los datos del usuario
            $usuario->nombre = $payload['given_name'];
            $usuario->apellidos = $payload['family_name'];
            $usuario->correo = $payload['email'];
            $usuario->autorizacion = openssl_encrypt(json_encode($usuario), self::$algoritmo_encriptacion, self::$clave, 0, self::$iv);
            $usuario->rol = $tipo == 'secretaria' ? 'S' : 'G';  // Asignar rol dependiendo del tipo de usuario.

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($usuario);
            die();
        }
        function simularLogin() {
				/*
            // El usuario ha sido identificado por Google
            $usuario = DAOUsuario::autenticarEmail(SECRETARIA);

            // Completamos los datos del usuario
            $usuario->nombre = 'Pruebas';
            $usuario->apellidos = 'Secretaría';
            $usuario->correo = 'mjaque@fundacionloyola.es';
            $usuario->autorizacion = openssl_encrypt(json_encode($usuario), self::$algoritmo_encriptacion, self::$clave, 0, self::$iv);
            $usuario->rol = 'S';  // Asignar rol dependiendo del tipo de usuario.

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($usuario);
            die();
						*/
        }

        /**
         * Obtener el tipo de usuario que está iniciando sesión.
         * @param string $correo Correo del usuario.
         * @return string|null Tipo de usuario o null si no se pudo identificar.
         */
        function obtenerTipo($correo) {
            if (in_array($correo, self::$secretaria)) {
                return 'secretaria';
            }
            else if (str_contains($correo, constant('ALUMNADO'))) {
                return 'alumnado';
            }
            else if (str_contains($correo, constant('PERSONAL'))) {
                return 'personal';
            }
            else {
                return null;
            }
        }
    }
    

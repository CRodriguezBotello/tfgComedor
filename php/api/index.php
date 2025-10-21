<?php
    /**
     * Router del API REST de la aplicación
     * Su responsabilidad es procesar la petición HTTP para decidir a qué controlador llamar (routing).
     * También identifica al usuario (autenticación).
     * Es un interfaz RESTful (https://www.rfc-editor.org/rfc/rfc7231)
     */
//die("TRON 42. Estamos KO");
    // Cargamos la configuración
    $config = require_once('config.php');

    if ($config['debug']) {
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
    }

    try {
        // Inyección de dependencias
        require_once('./services/bd.php');
        BD::$bd = $config['bd'];
        BD::$host = $config['host_bd'];
        BD::$usuario = $config['usuario_bd'];
        BD::$clave = $config['clave_bd'];

        // Peticiones especiales de depuración
        if ($config['debug']) {
            if ($_SERVER['QUERY_STRING'] == 'cargarBDPruebas') {
                $salida = [];
                
                // Establecemos los locales
                $locale = 'es_ES.UTF-8';
                setlocale(LC_ALL, $locale);
                putenv('LC_ALL=' . $locale);
				$fichero = '../../../sql/appcomedor.sql';
				if(!file_exists($fichero))
					die('No existe fichero');

                exec('mysql -u ' . BD::$usuario . ' --password=' . BD::$clave . ' ' . BD::$bd . ' < '.$fichero, $salida);
                die('Cargada BD Pruebas.<br/>');
            }
						/*
            if ($_SERVER['QUERY_STRING'] == 'simular_login') {
        			require_once('./controllers/logingoogle.php');
              $controlador = new LoginGoogle();
              $controlador->simularLogin();
						}
						*/
        }

        // Procesamos la petición para identificar el recurso solicitado y sus parámetros
        $metodo = $_SERVER['REQUEST_METHOD'];
        $pathParams = explode('/', $_SERVER['PATH_INFO']);
        $queryParams = [];
        parse_str($_SERVER['QUERY_STRING'], $queryParams);
        $recurso = $pathParams[1];  // El primer elemento es la /.
        array_splice($pathParams, 0, 2);    // Quitamos la / y el recurso solicitado.

        // Procesamos los nulos
        for ($i=0; $i<count($pathParams); $i++) {
            if ($pathParams[$i] == 'null')
                $pathParams[$i] = null;
        }

        $body = json_decode(file_get_contents('php://input'));

        // Autenticación
        $usuario = null;
        require_once('./controllers/login.php');
        require_once('./controllers/logingoogle.php');

        // Inyección de dependencias
        Login::$clave = $config['clave_encriptacion'];
        Login::$algoritmo_encriptacion = $config['algoritmo_encriptacion'];
        LoginGoogle::$clave = $config['clave_encriptacion'];
        LoginGoogle::$algoritmo_encriptacion = $config['algoritmo_encriptacion'];

        // Utilizamos Authorization2 en lugar de Authorization por un bug de NGINX que no transmite esa cabecera
        if (array_key_exists('Authorization2', apache_request_headers())) {
            $autorizacion = apache_request_headers()['Authorization2'];

            if ($autorizacion != "null")
                $usuario = json_decode(Login::desencriptar($autorizacion));
        }

        // Logging
        if ($config['log']) {
            require_once('./services/log.php');
            Log::registrar($usuario, $recurso, $metodo, $pathParams, $queryParams, $body);
        }

        // Routing
        $controlador = false;
        switch ($recurso) {
            case 'login':
                require_once('./controllers/login.php');
                $controlador = new Login();
                break;

            case 'login_google':
                require_once('./controllers/logingoogle.php');
                LoginGoogle::$secretaria = $config["correo_secretaria"];
                $controlador = new LoginGoogle();
                break;

            case 'persona':
                require_once('./controllers/persona.php');
                $controlador = new Persona();
                break;

            case 'padres':
                require_once('./controllers/padres.php');
                $controlador = new Padres();
                break;
                
            case 'hijos':
                require_once('./controllers/hijos.php');
                $controlador = new Hijos();
                break;
                
            case 'recuperar':
                require_once('./controllers/recuperar.php');
                $controlador = new Recuperar();
                break;

            case 'restaurar':
                require_once('./controllers/restaurar.php');
                $controlador = new Restaurar();
                break;

            case 'cursos':
                require_once('./controllers/cursos.php');
                $controlador = new Cursos();
                break;

            case 'dias':
                require_once('./controllers/dias.php');
                Dias::$hora_limite = $config['hora_limite'];
                $controlador = new Dias();
                break;

            case 'festivos':
                require_once('./controllers/festivos.php');
                $controlador = new Festivos();
                break;

            case 'secretaria':
                require_once('./controllers/secretaria.php');
                $controlador = new Secretaria();
                break;
                
            case 'constantes':
                require_once('./controllers/constantes.php');
                Constantes::$precioTupper = $config['precio_tupper'];
                Constantes::$precioMenu = $config['precio_menu'];
                $controlador = new Constantes();
                break;

            case 'calendario':
                require_once('./controllers/calendario.php');     
                $controlador = new Calendario();
                break;
                
            default:
                header('HTTP/1.1 501 Not Implemented');
                die();
        }
        if ($controlador) {
            switch($metodo) {
                case 'GET':
                    $controlador->get($pathParams, $queryParams, $usuario);
                    die();

                case 'POST':
                    $controlador->post($pathParams, $queryParams, $body, $usuario);
                    die();

                case 'DELETE':
                    $controlador->delete($pathParams, $queryParams, $usuario);
                    die();

                case 'PUT':
                    $controlador->put($pathParams, $queryParams, $body, $usuario);
                    die();

                default:
                    header('HTTP/1.1 501 Not Implemented');
                    die();
            }
        }
        else {
            header('HTTP/1.1 501 Not Implemented');
            die();
        }
    }
    catch (Throwable $excepcion) { // Throwable (interfaz) incluye Error y Exception
        switch ($excepcion->getCode()) {
            case 2002:      // No hay conexión BBDD.
                header('HTTP/1.1 408 Request Timeout');
                break;

            case 23000:     // Integrity constraint violation: 1062
                header('HTTP/1.1 500 Internal Server Error 1');
                break;

            default:
                header('HTTP/1.1 500 Internal Server Error');
                break;
        }

        if ($config['debug'])
            echo $excepcion;
        die();
    }
?>

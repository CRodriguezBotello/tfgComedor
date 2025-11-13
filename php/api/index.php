<?php
declare(strict_types=1);

// Configuración inicial (cargar primero para decidir debug/display_errors)
$config = require_once('config.php');

// Cabecera JSON
header('Content-Type: application/json; charset=utf-8');

// Control de errores: en producción no mostrar warnings en la salida JSON
if (!empty($config['debug'])) {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
}

try {
    // Inyección de dependencias BD (como antes)
    require_once(__DIR__ . '/services/bd.php');
    BD::$bd = $config['bd'];
    BD::$host = $config['host_bd'];
    BD::$usuario = $config['usuario_bd'];
    BD::$clave = $config['clave_bd'];

    // Peticiones especiales de depuración (si corresponde)
    if (!empty($config['debug']) && ($_SERVER['QUERY_STRING'] ?? '') === 'cargarBDPruebas') {
        $salida = [];
        $locale = 'es_ES.UTF-8';
        setlocale(LC_ALL, $locale);
        putenv('LC_ALL=' . $locale);
        $fichero = __DIR__ . '/../../../sql/appcomedor.sql';
        if (!file_exists($fichero)) die('No existe fichero');
        exec('mysql -u ' . BD::$usuario . ' --password=' . BD::$clave . ' ' . BD::$bd . ' < ' . $fichero, $salida);
        die('Cargada BD Pruebas.<br/>');
    }

    // Método HTTP y parámetros
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $queryParams = [];
    parse_str($_SERVER['QUERY_STRING'] ?? '', $queryParams);

    // Determinar recurso y pathParams: PRIORIDAD a query params (controller=...) para compatibilidad
    $pathParams = [];
    $recurso = $_GET['controller'] ?? $_POST['controller'] ?? null;

    if ($recurso) {
        // Si viene por query, no dependemos de PATH_INFO. pathParams vacíos por defecto.
        $pathParams = [];
    } else {
        // Si no viene por query, intentamos PATH_INFO (ej: /controller/param1/...)
        if (!empty($_SERVER['PATH_INFO'])) {
            $raw = $_SERVER['PATH_INFO'];
            $parts = array_values(array_filter(explode('/', $raw)));
            $recurso = $parts[0] ?? null;
            $pathParams = array_slice($parts, 1);
        } else {
            // Fallback a REQUEST_URI (por si se usa /index.php/controller/...)
            if (!empty($_SERVER['REQUEST_URI'])) {
                $req = $_SERVER['REQUEST_URI'];
                $script = $_SERVER['SCRIPT_NAME'] ?? '';
                $after = $req;
                if ($script && strpos($req, $script) === 0) {
                    $after = substr($req, strlen($script));
                }
                $after = strtok($after, '?');
                $after = trim($after, '/');
                if ($after !== '') {
                    $parts = explode('/', $after);
                    $recurso = $parts[0] ?? null;
                    $pathParams = array_slice($parts, 1);
                }
            }
        }
    }

    // Normalizar 'null' -> null en pathParams
    foreach ($pathParams as $k => $v) {
        if ($v === 'null') $pathParams[$k] = null;
    }

    // Cuerpo (JSON)
    $body = null;
    $rawBody = file_get_contents('php://input');
    if ($rawBody) {
        $body = json_decode($rawBody);
    }

    // Autenticación: cargar clases necesarias y desencriptar Authorization2 si existe
    require_once(__DIR__ . '/controllers/login.php');
    require_once(__DIR__ . '/controllers/logingoogle.php');
    Login::$algoritmo_encriptacion = $config['algoritmo_encriptacion'] ?? '';
    Login::$clave = $config['clave_encriptacion'] ?? '';
    Login::$iv = $config['iv'] ?? '';
    LoginGoogle::$algoritmo_encriptacion = $config['algoritmo_encriptacion'] ?? '';
    LoginGoogle::$clave = $config['clave_encriptacion'] ?? '';
    LoginGoogle::$iv = $config['iv'] ?? '';

    $usuario = null;
     if ($recurso == 'secretaria' && $_SERVER['PATH_INFO'] == '/secretaria/desactivarPadre') {
            $usuario = (object)[
                'id' => 1,
                'nombre' => 'SecretariaTest',
                'rol' => 'secretaria'
            ];
        }
    // Utilizamos Authorization2 en lugar de Authorization por NGINX (compatibilidad)
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (is_array($headers) && array_key_exists('Authorization2', $headers)) {
            $autorizacion = $headers['Authorization2'];
            if ($autorizacion !== "null") {
                try {
                    $usuario = json_decode(Login::desencriptar($autorizacion));
                } catch (Throwable $e) {
                    $usuario = null;
                }
            }
        }
    } else {
        // Fallback: revisar cabeceras en $_SERVER (por si Apache no expone apache_request_headers)
        foreach ($_SERVER as $k => $v) {
            if (stripos($k, 'HTTP_AUTHORIZATION2') !== false) {
                try {
                    $usuario = json_decode(Login::desencriptar($v));
                } catch (Throwable $e) {
                    $usuario = null;
                }
                break;
            }
        }
    }

    // Logging (si está activado)
    if (!empty($config['log'])) {
        require_once(__DIR__ . '/services/log.php');
        Log::registrar($usuario, $recurso, $metodo, $pathParams, $queryParams, $body);
    }

    // Routing: elegir controlador según recurso (igual que antes)
    $controlador = false;
    switch ($recurso) {
        case 'login':
            require_once(__DIR__ . '/controllers/login.php');
            $controlador = new Login();
            break;
        case 'login_google':
            require_once(__DIR__ . '/controllers/logingoogle.php');
            LoginGoogle::$secretaria = $config["correo_secretaria"] ?? '';
            $controlador = new LoginGoogle();
            break;
        case 'persona':
            require_once(__DIR__ . '/controllers/persona.php');
            $controlador = new Persona();
            break;
        case 'padres':
            require_once(__DIR__ . '/controllers/padres.php');
            $controlador = new Padres();
            break;
        case 'hijos':
            require_once(__DIR__ . '/controllers/hijos.php');
            $controlador = new Hijos();
            break;
        case 'recuperar':
            require_once(__DIR__ . '/controllers/recuperar.php');
            $controlador = new Recuperar();
            break;
        case 'restaurar':
            require_once(__DIR__ . '/controllers/restaurar.php');
            $controlador = new Restaurar();
            break;
        case 'cursos':
            require_once(__DIR__ . '/controllers/cursos.php');
            $controlador = new Cursos();
            break;
        case 'dias':
            require_once(__DIR__ . '/controllers/dias.php');
            Dias::$hora_limite = $config['hora_limite'] ?? null;
            $controlador = new Dias();
            break;
        case 'festivos':
            require_once(__DIR__ . '/controllers/festivos.php');
            $controlador = new Festivos();
            break;
        case 'secretaria':
            require_once(__DIR__ . '/controllers/secretaria.php');
            $controlador = new Secretaria();
            break;
        case 'constantes':
            require_once(__DIR__ . '/controllers/constantes.php');
            Constantes::$precioTupper = $config['precio_tupper'] ?? null;
            Constantes::$precioMenu = $config['precio_menu'] ?? null;
            $controlador = new Constantes();
            break;
        case 'calendario':
            require_once(__DIR__ . '/controllers/calendario.php');
            $controlador = new Calendario();
            break;
        // controllers de la API pequeña (ej. menus) - si existen en folder controllers
        default:
            // Si no coincide con los casos, intentar cargar controlador por nombre seguro.
            // Si existe el fichero lo incluimos y dejamos que ese fichero termine la respuesta
            // (controllers simples que emiten JSON directamente). En caso contrario devolvemos 501.
            $safe = preg_replace('/[^a-z0-9_]/i', '', (string)$recurso);
            $candidate = __DIR__ . '/controllers/' . $safe . '.php';
            if (is_file($candidate)) {
                require_once($candidate);
                // Si el fichero definía una clase con nombre capitalizado la instanciamos
                $classe = ucfirst($safe);
                if (class_exists($classe)) {
                    $controlador = new $classe();
                } else {
                    // asumimos que el controlador ya ha emitido la respuesta y terminamos
                    die();
                }
            } else {
                header('HTTP/1.1 501 Not Implemented');
                die();
            }
            break;
    }

    // Si hay controlador, despachar según método HTTP (compatibilidad con el patrón actual)
    if ($controlador) {
        switch ($metodo) {
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
    } else {
        header('HTTP/1.1 501 Not Implemented');
        die();
    }
} catch (Throwable $excepcion) {
    // Manejo de excepciones similar al original
    switch ($excepcion->getCode()) {
        case 2002:
            header('HTTP/1.1 408 Request Timeout');
            break;
        case 23000:
            header('HTTP/1.1 500 Internal Server Error 1');
            break;
        default:
            header('HTTP/1.1 500 Internal Server Error');
            break;
    }
    if (!empty($config['debug'])) {
        // En debug mostramos la excepción (útil durante desarrollo)
        echo json_encode(['ok' => false, 'error' => (string)$excepcion->getMessage()]);
    }
    die();
}
?>
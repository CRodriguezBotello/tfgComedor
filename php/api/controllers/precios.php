<?php
    require_once(dirname(__DIR__) . '/daos/daoprecios.php');

    class Precios {

        private function getInputArrayFromBody($body) {
            // $body viene como objeto (json_decode en index.php). Convertir a array si es necesario.
            if (is_array($body)) return $body;
            if (is_object($body)) return json_decode(json_encode($body), true);
            // fallback a php://input
            $raw = file_get_contents('php://input');
            $d = json_decode($raw, true);
            return is_array($d) ? $d : [];
        }

        function get($pathParams, $queryParams, $usuario) {
            header('Content-Type: application/json; charset=utf-8');

            $idBuscado = null;
            if (isset($pathParams[0]) && $pathParams[0] !== '') $idBuscado = $pathParams[0];

            if ($idBuscado) {
                $item = DAOPrecios::obtenerPrecioPorId($idBuscado);
                if ($item === false) {
                    header('HTTP/1.1 404 Not Found');
                    echo json_encode(['error' => 'No encontrado']);
                } else {
                    echo json_encode($item);
                }
            } else {
                $list = DAOPrecios::obtenerPrecios();
                echo json_encode($list ?: []);
            }
            die();
        }

        function post($pathParams, $queryParams, $body, $usuario) {
            header('Content-Type: application/json; charset=utf-8');
            // Crear nuevas tarifas no está soportado en el nuevo esquema (columnas fijas)
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['success' => false, 'error' => 'Operación no soportada: la tabla contiene columnas fijas']);
            die();
        }

        function put($pathParams, $queryParams, $body, $usuario) {
            header('Content-Type: application/json; charset=utf-8');

            $data = $this->getInputArrayFromBody($body);

            $idToUpdate = null;
            if (isset($pathParams[0]) && $pathParams[0] !== '') $idToUpdate = $pathParams[0];
            if (isset($data['idPrecio']) && $data['idPrecio'] !== '') $idToUpdate = $data['idPrecio'];

            if (!$idToUpdate || !isset($data['cantidad'])) {
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['success' => false, 'error' => 'datos incompletos']);
                die();
            }

            try {
                $ok = DAOPrecios::actualizarPrecio($idToUpdate, $data['cantidad']);
                echo json_encode(['success' => (bool)$ok]);
            } catch (Exception $e) {
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            die();
        }

        function delete($pathParams, $queryParams, $usuario) {
            header('Content-Type: application/json; charset=utf-8');

            // Borrado no soportado en esquema de columnas fijas
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Operación no permitida']);
            die();
        }
    }

    // Si se accede directamente al fichero, actúa como endpoint HTTP
    if (php_sapi_name() !== 'cli' && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
        header('Content-Type: application/json; charset=utf-8');

        $pathInfo = $_SERVER['PATH_INFO'] ?? '';
        $pathParams = array_values(array_filter(explode('/', $pathInfo)));
        $method = $_SERVER['REQUEST_METHOD'];

        try {
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                exit;
            }

            // Intentamos usar el DAO si existe
            $lista = null;
            if (class_exists('DAOPrecios') && method_exists('DAOPrecios', 'obtenerPrecios')) {
                try {
                    $lista = DAOPrecios::obtenerPrecios();
                } catch (Throwable $e) {
                    // noop, fallback más abajo
                    $lista = null;
                }
            }

            // Si el DAO no devuelve nada, fallback directo a la BBDD usando config.php
            if (empty($lista)) {
                $configPath = __DIR__ . '/../config.php';
                if (!file_exists($configPath)) {
                    throw new Exception('Falta config.php para la conexión a BBDD');
                }
                $config = include $configPath;
                $dsn = "mysql:host={$config['host_bd']};dbname={$config['bd']};charset=utf8mb4";
                $pdo = new PDO($dsn, $config['usuario_bd'], $config['clave_bd'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);

                $stmt = $pdo->query("SELECT idPrecio, precioMensual, precioDiario, precioDiaProfesor, precioTupper, precioDiaHijoProfe FROM Precios ORDER BY idPrecio DESC LIMIT 1");
                $row = $stmt->fetch();
                if ($row) {
                    $lista = [
                        ['idPrecio' => 'precioMensual', 'nombreP' => 'Precio mensual', 'cantidad' => $row['precioMensual']],
                        ['idPrecio' => 'precioDiario', 'nombreP' => 'Precio diario', 'cantidad' => $row['precioDiario']],
                        ['idPrecio' => 'precioDiaProfesor', 'nombreP' => 'Precio día profesor', 'cantidad' => $row['precioDiaProfesor']],
                        ['idPrecio' => 'precioTupper', 'nombreP' => 'Precio tupper', 'cantidad' => $row['precioTupper']],
                        ['idPrecio' => 'precioDiaHijoProfe', 'nombreP' => 'Precio día hijo/profe', 'cantidad' => $row['precioDiaHijoProfe']]
                    ];
                }
            }

            echo json_encode($lista ?: [], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Internal error', 'message' => $e->getMessage()]);
            exit;
        }
    }
?>
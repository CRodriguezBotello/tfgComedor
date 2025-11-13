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
            if (isset($pathParams[0]) && is_numeric($pathParams[0])) $idBuscado = (int)$pathParams[0];

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

            $data = $this->getInputArrayFromBody($body);
            if (empty($data['nombreP']) || !isset($data['cantidad'])) {
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['success' => false, 'error' => 'datos incompletos']);
                die();
            }

            try {
                $newId = DAOPrecios::crearPrecio($data['nombreP'], $data['cantidad']);
                if ($newId !== false) {
                    echo json_encode(['success' => true, 'id' => $newId]);
                } else {
                    header('HTTP/1.1 500 Internal Server Error');
                    echo json_encode(['success' => false, 'error' => 'no creado']);
                }
            } catch (Exception $e) {
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            die();
        }

        function put($pathParams, $queryParams, $body, $usuario) {
            header('Content-Type: application/json; charset=utf-8');

            $data = $this->getInputArrayFromBody($body);

            $idToUpdate = null;
            if (isset($pathParams[0]) && is_numeric($pathParams[0])) $idToUpdate = (int)$pathParams[0];
            if (isset($data['idPrecio']) && is_numeric($data['idPrecio'])) $idToUpdate = (int)$data['idPrecio'];

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


            $idToDelete = null;
            if (isset($pathParams[0]) && is_numeric($pathParams[0])) $idToDelete = (int)$pathParams[0];
            if (isset($pathParams[1]) && is_numeric($pathParams[1])) $idToDelete = (int)$pathParams[1];
            if (!$idToDelete && isset($queryParams['id']) && is_numeric($queryParams['id'])) $idToDelete = (int)$queryParams['id'];

            if (!$idToDelete) {
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['error' => 'ID inválido']);
                die();
            }

            try {
                $ok = DAOPrecios::borrarPrecio($idToDelete);
                echo json_encode(['ok' => (bool)$ok]);
            } catch (Exception $e) {
                error_log('Error al borrar precio: ' . $e->getMessage());
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['error' => 'Error servidor']);
            }
            die();
        }
    }
?>
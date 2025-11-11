<?php
    require_once(dirname(__DIR__) . '/daos/daousuario.php');

    /**
     * Controlador de padres.
     */
    class Padres {
        /**
         * Inserta fila a la tabla padres.
         * @param array $pathParams No utilizado.
         * @param array $queryParams No utilizado.
         * @param object $id ID del padre.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function post($pathParams, $queryParams, $id, $usuario) {            
            // Insertar en tabla de padres.
            DAOUsuario::altaPadre($id);
            sleep(1);
            header('HTTP/1.1 200 OK');
            die();
        }

        /**
         * Borrar padre.
         * @param array $pathParams ID del padre viene aquí.
         * @param array $queryParams No utilizado.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function delete($pathParams, $queryParams, $usuario) {
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                echo json_encode(['error' => 'No autorizado']);
                die();
            }

            // admitir id en pathParams[0] o [1]
            $id = null;
            if (isset($pathParams[0]) && is_numeric($pathParams[0])) $id = (int)$pathParams[0];
            if (isset($pathParams[1]) && is_numeric($pathParams[1])) $id = (int)$pathParams[1];

            if (!$id) {
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['error' => 'ID inválido']);
                die();
            }

            try {
                // Eliminar la cuenta de padre definitivamente
                DAOUsuario::eliminarPadreDefinitivo($id);
                header('Content-Type: application/json; charset=utf-8');
                header('HTTP/1.1 200 OK');
                echo json_encode(['ok' => true]);
            } catch (Exception $e) {
                error_log('Error al eliminar padre: '.$e->getMessage());
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['error' => 'Error servidor']);
            }
            die();
        }
    }
?>

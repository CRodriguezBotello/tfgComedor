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
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            if (count($pathParams)) {
                $resultado = DAOUsuario::desactivaPadre($usuario->id);
                sleep(1);

                if ($resultado) header('HTTP/1.1 200 OK');
                else header('HTTP/1.1 400 Bad Request 1');
                die();
            }
            else {
                header('HTTP/1.1 400 Bad Request');
                die();
            }
        }
    }
?>

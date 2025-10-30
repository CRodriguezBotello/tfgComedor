<?php
    require_once(dirname(__DIR__) . '/daos/daousuario.php');

    /**
     * Controlador de hijos.
     */
    class Hijos {
        /**
         * Inserta al hijo con sus datos en la base datos.
         * @param array $pathParams No utilizado.
         * @param array $queryParams No utilizado.
         * @param object $datos Datos del usuario.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function post($pathParams, $queryParams, $datos, $usuario) {
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            if (count($pathParams)) {
                switch ($pathParams[0]) {
                    case 'altaHijo':
                        $this->insertarHijo($datos);
                        sleep(1);
                        break;

                    case 'registrarHijo':
                        $this->registrarHijoPin($datos);
                        sleep(1);
                        break;

                    default:
                        header('HTTP/1.1 501 Not Implemented');
                        break;
                }
            }
            else {
                header('HTTP/1.1 400 Bad Request');
            }

            die();
        }
        
        /**
         * Insertar hijo.
         * @param object $datos Datos del hijo.
         */
        function insertarHijo($datos) {
            DAOUSuario::insertarHijo($datos);
            header('HTTP/1.1 200 OK');
        }

        /**
         * Registrar hijo a un padre.
         * @param object $datos Datos.
         */
        function registrarHijoPin($datos) {
            $resultado = DAOUSuario::registrarHijoPadre($datos);
            if ($resultado) header('HTTP/1.1 200 OK');
            else header('HTTP/1.1 400 Bad Request 1');
        }

        /**
         * Devuelve los hijos de un padre.
         * @param array $pathParams No utilizado.
         * @param array $queryParams Aquí viaja el ID del padre.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function get($pathParams, $queryParams, $usuario) {
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            $hijos = DAOUsuario::dameHijos($queryParams['id']);
            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($hijos);
            die();
        }

        /**
         * Borra un hijo.
         * @param array $pathParams Aquí viaja el ID del hijo a borrar.
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
                switch ($pathParams[0]) {
                    case 'eliminarHijo':
												DAOUsuario::eliminarHijo($pathParams[1], $usuario->id);
            						header('HTTP/1.1 200 OK');
                        break;

                    case 'eliminarRelacion':
                        $this->eliminarRelacion($pathParams[1], $pathParams[2]);
                        break;
                }
            }
            else {
                header('HTTP/1.1 400 Bad Request');
            }
            
            die();
        }

        /**
         * Eliminar relación padre-hijo :(
         * @param int $idHijo ID del hijo.
         * @param int $idPadre ID del padre.
         */
        function eliminarRelacion($idHijo, $idPadre) {
            DAOUsuario::eliminarRelacion($idHijo, $idPadre);
            header('HTTP/1.1 200 OK');
        }

        /**
         * Modifica un hijo.
         * @param array $pathParams No utilizado.
         * @param array $queryParams No utilizado.
         * @param object $datos Datos del hijo.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function put($pathParams, $queryParams, $datos, $usuario) {
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            DAOUsuario::modificarHijo($datos);
            sleep(1);
            header('HTTP/1.1 200 OK');
            die();
        }
    }
?>

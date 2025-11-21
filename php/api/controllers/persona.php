<?php
    require_once(dirname(__DIR__) . '/daos/daousuario.php');

    /**
     * Controlador de registro de personas.
     */
    class Persona {
        /**
         * Inserta fila a la tabla persona.
         * @param array $pathParams No utilizado.
         * @param array $queryParams No utilizado.
         * @param object $datos Datos del usuario.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function post($pathParams, $queryParams, $datos, $usuario) {
            // Insertar en tabla de personas.
						try{
            	$id = DAOUsuario::altaPersona($datos);
						}
						catch(Exception $e) {
							//echo 'Message: ' .$e->getMessage();
							if (strpos($e->getMessage(), 'UQ_correoPersona'))
            		header('HTTP/1.1 400 Bad Request - Email repetido');
							else if (strpos($e->getMessage(), 'UQ_dniPersona'))
            		header('HTTP/1.1 400 Bad Request - DNI repetido');
							else
            		header('HTTP/1.1 400 Bad Request');
							die();
						}	

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($id);
            die();
        }

        /**
         * Actualiza fila tabla persona.
         * @param array $pathParams No utilizado.
         * @param array $queryParams No utilizado.
         * @param object $datos Datos del usuario.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function put($pathParams, $queryParams, $datos, $usuario) {
            DAOUsuario::modificarPersona($datos);
            sleep(1);
            header('HTTP/1.1 200 OK');
            die();
        }
    }
?>

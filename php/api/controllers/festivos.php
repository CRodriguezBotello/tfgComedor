<?php
    require_once(dirname(__DIR__) . '/daos/daofestivos.php');

    /**
     * Controlador de días festivos.
     */
    class Festivos {
        /**
         * Sacar los días festivos.
         * @param array $pathParams No utilizado.
         * @param array $queryParams No utilizado.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function get($pathParams, $queryParams, $usuario) {
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            if (isset($queryParams['inicio']) && isset($queryParams['final'])) {
                $fechaInicio = new DateTime($queryParams['inicio']);
                $fechaInicio = $fechaInicio->format('Y-m-d');
                
                $fechaFinal = new DateTime($queryParams['final']);
                $fechaFinal = $fechaFinal->format('Y-m-d');

                $festivos = DAOFestivos::obtenerFestivos($fechaInicio, $fechaFinal);

                header('Content-type: application/json; charset=utf-8');
                header('HTTP/1.1 200 OK');
                echo json_encode($festivos);
            }
            else {
                header('HTTP/1.1 400 Bad Request');
            }

            die();
        }
    }
?>
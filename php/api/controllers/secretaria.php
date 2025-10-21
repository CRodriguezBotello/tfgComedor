<?php
    require_once(dirname(__DIR__) . '/daos/daousuario.php');

    /**
     * Controlador de secretaría.
     */
    class Secretaria {
        /**
         * Insertar/modificar incidencia.
         * @param array $pathParams No utilizado.
         * @param array $queryParams No utilizado.
         * @param object $datos Objeto con ID y la incidencia.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function put($pathParams, $queryParams, $datos, $usuario) {
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            if (count($pathParams)) {
                switch ($pathParams[0]) {
                    case 'modificarPadre':
                        DAOUsuario::modificarPadreSecretaria($datos);
                        header('HTTP/1.1 200 OK');
                        break;

                    case 'incidencia':
                        DAOUsuario::insertarIncidencia($datos);
                        header('HTTP/1.1 200 OK');
                        break;
                        
                    case 'tupper':
                        DAOUsuario::insertarTupper($datos);
                        header('HTTP/1.1 200 OK');
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
         * Sacar los usuarios de una fecha (Si existe proceso) Sacar los usuarios de un mes (Si existe procesom).
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

            if (count($queryParams) && isset($queryParams['proceso'])) {
                switch ($queryParams['proceso']) {
                    case 'usuarios':
                        $this->obtenerUsuarios($queryParams['fecha']);
                        break;

                    case 'incidencias':
                        $this->obtenerIncidencias($queryParams['fecha']);
                        break;

                    case 'usuariosMes':
                        $this->obtenerUsuariosMes($queryParams['mes']);
                        break;

                    case 'incidenciasMes':
                        $this->obtenerIncidenciasMes($queryParams['mes']);
                        break;

                    case 'padres':
                        $this->obtenerListadoPadres($queryParams['busqueda']);
                        break;
                        
                    case 'tupper':
                        $this->obtenerTupper($queryParams['fecha']);
                        break;

                    case 'q19':
                        $this->obtenerQ19($queryParams['mes']);
                        break;

                    default:
                        header('HTTP/1.1 501 Not Implemented');
                        die();
                }
            }
            else {
                header('HTTP/1.1 400 Bad Request');
                die();
            }
        }
        
        /**
         * Obtener usuarios mensuales.
         * @param string $mes Mes.
         */
        function obtenerUsuariosMes($mes) {
            $usuarios = DAOUsuario::obtenerUsuariosPorMes($mes);

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($usuarios);
            die();
        }

        /**
         * Obtener incidencias mensuales.
         * @param string $mes Mes.
         */
        function obtenerIncidenciasMes($mes) {
            $incidencias = DAOUsuario::obtenerIncidenciasPorMes($mes);

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($incidencias);
            die();
        }

        /**
         * Obtener usuarios.
         * @param string $date Fecha.
         */
        function obtenerUsuarios($date) {
            $fecha = new DateTime($date);
            $fecha = $fecha->format('Y-m-d');
            
            $usuarios = DAOUsuario::obtenerUsuariosPorDia($fecha);

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($usuarios);
            die();
        }

        /**
         * Obtener incidencias.
         * @param string $date Fecha.
         */
        function obtenerIncidencias($date) {
            $fecha = new DateTime($date);
            $fecha = $fecha->format('Y-m-d');
            
            $incidencias = DAOUsuario::obtenerIncidenciasPorDia($fecha);

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($incidencias);
            die();
        }
          /**
         * Obtener padres.
         * @param string $busqueda Busqueda.
         */
        function obtenerListadoPadres($busqueda) {
            $padres = DAOUsuario::obtenerListadoPadres($busqueda);

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($padres);
            die();
        }

        /**
         * Obtener Q19 de un mes.
         * @param string $mes Mes.
         */
        function obtenerQ19($mes) {
            $q19 = DAOUsuario::obtenerQ19($mes);

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($q19);
            die();
        }

        function obtenerTupper($date) {
            $fecha = new DateTime($date);
            $fecha = $fecha->format('Y-m-d');
            
            $tupper = DAOUsuario::obtenerTupper($fecha);

            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($tupper);
            die();
        }
    }
?>

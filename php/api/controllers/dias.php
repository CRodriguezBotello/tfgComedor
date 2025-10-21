<?php
    require_once(dirname(__DIR__) . '/daos/daousuario.php');
    require_once(dirname(__DIR__) . '/daos/daofestivos.php');

    /**
     * Controlador de hijos.
     */
    class Dias {
        // Se configura por inyección de dependencias
        public static $hora_limite = null;

        /**
         * Obtener filas de la tabla dias.
         * @param array $pathParams No utilizado.
         * @param array $queryParams Array de IDs.
         * @param object $usuario Usuario que realiza el proceso.
         */
        function get($pathParams, $queryParams, $usuario) {
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            if (count($queryParams)) {
                $resultado = DAOUsuario::obtenerDias($queryParams);

                header('Content-type: application/json; charset=utf-8');
                header('HTTP/1.1 200 OK');
                echo(json_encode($resultado));
                die();
            }
            else {
                header('HTTP/1.1 400 Bad Request');
                die();
            }
        }

        /**
         * Inserta fila a la tabla dias.
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
        
            // Convertir la fecha enviada a objeto DateTime
            $fecha = new DateTime($datos->dia);
            $fechaActual = new DateTime();
            $horaActual = (int)$fechaActual->format('H');
        
            // Verificar si la fecha enviada es menor o igual que la fecha actual
            if ($fecha <= $fechaActual) {
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(array("error" => "La fecha enviada es menor o igual que la fecha actual"));
                die();
            }
        
            // Verificar si la fecha enviada es el día siguiente y si ya pasó las HORALIMITE:00 horas del día actual
            $limiteModificacion = new DateTime();
            $limiteModificacion->setTime(self::$hora_limite, 0, 0); // La hora límite es las HORALIMITE:00
            $fechaSiguiente = (new DateTime())->modify('+1 day')->setTime(0, 0, 0);
        
            if ($fecha == $fechaSiguiente && $horaActual >= self::$hora_limite) {
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(array("error" => "No se pueden marcar días siguientes después de las 14:00 horas del día actual"));
                die();
            }
        
            // Es fin de semana
            $diaSemana = (int)$fecha->format('w');
            if ($diaSemana === 0 || $diaSemana === 6) {
                // Abortamos sin error
                header('HTTP/1.1 200 OK');
                die();
            }
        
            // ¿Es festivo?
            if (DAOFestivos::esFestivo($fecha->format('Y-m-d'))) {
                // Abortamos sin error
                header('HTTP/1.1 200 OK');
                die();
            }
        
            // Si todo está correcto, procedemos a insertar el día
            DAOUsuario::altaDia($datos);
            header('HTTP/1.1 200 OK');
            die();
        }

        /**
         * Borrar fila de la tabla dias
         * @param array $pathParams Datos del día.
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
                $fecha = new DateTime($pathParams[0]);
                $fecha = $fecha->format('Y-m-d');

                // Obtener la fecha actual y la hora actual
                $fechaActual = new DateTime();
                $fechaActual->setTime(0, 0, 0); // Ajustar la hora a medianoche
                $horaActual = (int)date('H');

                // Calcular la fecha límite para la modificación
                $limiteModificacion = new DateTime();
                $limiteModificacion->setTime(self::$hora_limite, 0, 0); // La hora límite es las HORALIMITE:00

                // Verificar si la fecha enviada es para el día siguiente
                $fechaSiguiente = new DateTime();
                $fechaSiguiente->modify('+1 day');
                $fechaSiguiente->setTime(0, 0, 0);

                if ($fecha == $fechaSiguiente->format('Y-m-d')) {
                    // Si es el día siguiente, comprobar la hora
                    if ($fechaActual <= $limiteModificacion && $horaActual >= self::$hora_limite) {
                        header('HTTP/1.1 400 Bad Request');
                        echo json_encode(array("error" => "No se pueden eliminar registros del día siguiente después de las 14:00 horas del día actual"));
                        die();
                    } else {
                        DAOUsuario::eliminarDia($fecha, $pathParams[1], $pathParams[2]);
                        header('HTTP/1.1 200 OK');
                        die();
                    }
                } elseif ($fecha > $fechaSiguiente->format('Y-m-d')) {
                    // Si es un día posterior al siguiente, permitir la eliminación
                    DAOUsuario::eliminarDia($fecha, $pathParams[1], $pathParams[2]);
                    header('HTTP/1.1 200 OK');
                    die();
                } else {
                    // Si es un día anterior, devolver un error
                    header('HTTP/1.1 400 Bad Request');
                    echo json_encode(array("error" => "No se pueden eliminar registros de días anteriores o del día actual"));
                    die();
                }
            } else {
                header('HTTP/1.1 400 Bad Request');
                die();
            }
        }
    }

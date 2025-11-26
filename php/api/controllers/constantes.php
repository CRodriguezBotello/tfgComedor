<?php

    class Constantes {
        public static $precioTupper = null;
        public static $precioMenu = null;
     
        function get($pathParams, $queryParams, $usuario) {
            // Si no existe $usuario, es porque la autorización ha fallado.
            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            if (count($queryParams) && isset($queryParams['proceso'])) {
                switch ($queryParams['proceso']) {
                    case 'tupper':
                        $this->obtenerTupper(self::$precioTupper);
                        break;
                    case 'menu':
                        $this->obtenerMenu(self::$precioMenu);
                        break;
                }
            }
            else {
                header('HTTP/1.1 400 Bad Request');
                die();
            }
        }
        
        function obtenerTupper($constante){
            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($constante);
            die();
        }
        
        function obtenerMenu($constante){
            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($constante);
            die();
        }
          
    }
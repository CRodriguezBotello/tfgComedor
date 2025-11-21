<?php
    /**
     * Servicio de log.
     */
    class Log {
        /**
         *  Registra una operación en el log de base de datos.
         */
        static function registrar($usuario, $controlador, $metodo, $pathParams, $queryParams, $body) {
            $sql  = 'INSERT INTO Log (usuario, controlador, metodo, pathParams, queryParams, body) ';
            $sql .= 'VALUES (:usuario, :controlador, :metodo, :pathParams, :queryParams, :body)';

            if ($usuario) 
                $usuario = $usuario->email;

            $params = array(
                'usuario' => $usuario,
                'controlador' => $controlador, 
                'metodo' => $metodo, 
                'pathParams' => join('##', $pathParams), 
                'queryParams' => join('##', $queryParams),
                'body' => json_encode($body)
            ); 

            BD::insertar($sql, $params);
        }
    }
?>
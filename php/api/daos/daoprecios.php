<?php

    /**
     * DAO de Precios.
     * Acceso a la tabla Precios usando el helper BD del proyecto.
     */
    class DAOPrecios {

        /**
         * Devuelve todos los precios.
         * @return array|false
         */
        public static function obtenerPrecios() {
            $sql = 'SELECT idPrecio, nombreP, cantidad FROM Precios ORDER BY idPrecio';
            return BD::seleccionar($sql, null);
        }

        /**
         * Devuelve un precio por id.
         * @param int $id
         * @return array|false
         */
        public static function obtenerPrecioPorId($id) {
            $sql = 'SELECT idPrecio, nombreP, cantidad FROM Precios WHERE idPrecio = :id';
            $params = array('id' => $id);
            $res = BD::seleccionar($sql, $params);
            return ($res && count($res) === 1) ? $res[0] : false;
        }

        /**
         * Crea un precio.
         * @param string $nombre
         * @param float $cantidad
         * @return int|false ID insertado o false
         */
        public static function crearPrecio($nombre, $cantidad) {
            $sql = 'INSERT INTO Precios (nombreP, cantidad) VALUES (:nombreP, :cantidad)';
            $params = array(
                'nombreP' => $nombre,
                'cantidad' => $cantidad
            );
            return BD::insertar($sql, $params);
        }

        /**
         * Actualiza cantidad de un precio.
         * @param int $id
         * @param float $cantidad
         * @return boolean
         */
        public static function actualizarPrecio($id, $cantidad) {
            $sql = 'UPDATE Precios SET cantidad = :cantidad WHERE idPrecio = :id';
            $params = array('cantidad' => $cantidad, 'id' => $id);
            return BD::actualizar($sql, $params);
        }

        /**
         * Borra un precio por id.
         * @param int $id
         * @return boolean
         */
        public static function borrarPrecio($id) {
            $sql = 'DELETE FROM Precios WHERE idPrecio = :id';
            $params = array('id' => $id);
            return BD::borrar($sql, $params);
        }
    }
?>
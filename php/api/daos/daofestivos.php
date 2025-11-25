<?php
    /**
     * DAO de Festivos.
     * Objeto para el acceso a los datos relacionados con días festivos.
     */
    class DAOFestivos {
        /**
         * Consulta para obtener filas de la tabla 'festivo'.
         * @return array|boolean Array de los festivos, o false si no existen.
         */
        public static function obtenerFestivos($fechaInicio, $fechaFinal) {
            $sql = 'SELECT diaFestivo, definicion FROM Festivo';
            $sql .= ' WHERE diaFestivo BETWEEN :inicio AND :final';
            $params = array(
                'inicio' => $fechaInicio,
                'final' => $fechaFinal
            );
            $resultado = BD::seleccionar($sql, $params);
            return $resultado ? $resultado : array();
        }

        // Si quieres mantener procesarFestivos para compatibilidad, podrías convertir aquí,
        // pero ahora devolvemos arrays con ['diaFestivo','definicion'] para que el frontend los use.

        // Crear festivo: acepta definición
        public static function crearFestivo(string $fecha, string $definicion = '') {
            $sql = 'INSERT INTO Festivo (diaFestivo, definicion) VALUES (:f, :d)';
            $params = array('f' => $fecha, 'd' => $definicion);
            return BD::actualizar($sql, $params);
        }

        // Actualizar festivo: devuelve número de filas afectadas
        public static function actualizarFestivo(string $oldFecha, string $newFecha, ?string $definicion = null) {
            // Si definicion es NULL solo actualizamos la fecha; si viene (aunque sea cadena vacía) actualizamos también la definición.
            if ($definicion === null) {
                $sql = 'UPDATE Festivo SET diaFestivo = :n WHERE diaFestivo = :o';
                $params = array('n' => $newFecha, 'o' => $oldFecha);
            } else {
                $sql = 'UPDATE Festivo SET diaFestivo = :n, definicion = :d WHERE diaFestivo = :o';
                $params = array('n' => $newFecha, 'd' => $definicion, 'o' => $oldFecha);
            }
            return BD::actualizar($sql, $params);
        }

        // Borrar un festivo: devuelve número de filas afectadas
        public static function borrarFestivo(string $fecha) {
            $sql = 'DELETE FROM Festivo WHERE diaFestivo = :f';
            $params = array('f' => $fecha);
            return BD::actualizar($sql, $params);
        }

        // Borrar todos los festivos: devuelve número de filas afectadas
        public static function borrarTodosFestivos() {
            $sql = 'DELETE FROM Festivo';
            return BD::actualizar($sql, array());
        }

        // Verifica si una fecha es festiva
        public static function esFestivo(string $fecha): bool
        {
            $sql = 'SELECT COUNT(*) AS cnt FROM Festivo WHERE diaFestivo = :f';
            $resultado = BD::seleccionar($sql, array('f' => $fecha));
            if (!$resultado) {
                return false;
            }
            $cnt = isset($resultado[0]['cnt']) ? (int)$resultado[0]['cnt'] : 0;
            return $cnt > 0;
        }
    }

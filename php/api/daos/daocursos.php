<?php
    require_once(dirname(__DIR__) . '/models/curso.php');

    /**
     * DAO de Cursos.
     * Objeto para el acceso a los datos relacionados con cursos.
     */
    class DAOCurso {
        /**
         * Consulta para obtener todas las filas de la tabla 'cursos'.
         * @return array|boolean Array de los cursos, o false si no existen.
         */
        public static function obtenerCursos() {
            $sql = 'SELECT id, nombre FROM Curso ORDER BY orden';
            $resultado = BD::seleccionar($sql, null);
            return DAOCurso::crearCursos($resultado, true);
        }

        /**
         * Genera un listado de los cursos.
         * @param array $listaCursos Array de datos.
         * @return array|boolean Array de cursos, o False si no se pudo generar el listado.
         */
        public static function crearCursos($listaCursos) {
            $cursos = array();

            if (count($listaCursos) > 0) {
                for ($i=0; $i<count($listaCursos); $i++) {
                    $curso = new Curso();
                    $curso->id = $listaCursos[$i]['id'];
                    $curso->nombre = $listaCursos[$i]['nombre'];
                    $cursos[] = $curso;
                }
                return $cursos;
            }
            else {
                return false;
            }
        }
    }
?>
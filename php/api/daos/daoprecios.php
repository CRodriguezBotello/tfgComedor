<?php

    /**
     * DAO de Precios.
     * Acceso a la tabla Precios usando el helper BD del proyecto.
     */
    class DAOPrecios {

        // Mapa de columnas permitidas y su etiqueta para mostrar en frontend
        private static $columnMap = [
            'precioMensual' => 'Precio mensual',
            'precioDiario' => 'Precio diario',
            'precioDiaProfesor' => 'Precio día profesor',
            'precioTupper' => 'Precio tupper',
            'precioDiaHijoProfe' => 'Precio día hijo/profe'
        ];

        /**
         * Devuelve todos los precios como un array de entradas { idPrecio, nombreP, cantidad }.
         * @return array|false
         */
        public static function obtenerPrecios() {
            // Intentar usar BD::seleccionar si existe
            if (class_exists('BD') && method_exists('BD', 'seleccionar')) {
                $sql = 'SELECT * FROM Precios LIMIT 1';
                $row = BD::seleccionar($sql, null);
                if ($row && is_array($row) && count($row) > 0) {
                    $r = $row[0];
                    $out = [];
                    foreach (self::$columnMap as $col => $label) {
                        $out[] = [
                            'idPrecio' => $col,
                            'nombreP' => $label,
                            'cantidad' => isset($r[$col]) ? $r[$col] : 0
                        ];
                    }
                    return $out;
                }
                return [];
            }

            // Fallback directo usando PDO y config.php
            $configPath = __DIR__ . '/../../config.php';
            if (!file_exists($configPath)) return [];
            $config = include $configPath;
            $dsn = "mysql:host={$config['host_bd']};dbname={$config['bd']};charset=utf8mb4";
            $pdo = new PDO($dsn, $config['usuario_bd'], $config['clave_bd'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $stmt = $pdo->query("SELECT * FROM Precios ORDER BY idPrecio DESC LIMIT 1");
            $r = $stmt->fetch();
            if (!$r) return [];
            $out = [];
            foreach (self::$columnMap as $col => $label) {
                $out[] = [
                    'idPrecio' => $col,
                    'nombreP' => $label,
                    'cantidad' => isset($r[$col]) ? $r[$col] : 0
                ];
            }
            return $out;
        }

        /**
         * Devuelve un precio por id o por nombre de columna.
         * @param int|string $id
         * @return array|false
         */
        public static function obtenerPrecioPorId($id) {
            // Si existe BD, delegar
            if (class_exists('BD') && method_exists('BD', 'seleccionar')) {
                // compatibilidad con implementación previa
                if (is_numeric($id)) {
                    $sql = 'SELECT idPrecio, nombreP, cantidad FROM Precios WHERE idPrecio = :id';
                    $params = array('id' => (int)$id);
                    $res = BD::seleccionar($sql, $params);
                    return ($res && count($res) === 1) ? $res[0] : false;
                }
                if (is_string($id) && array_key_exists($id, self::$columnMap)) {
                    $sql = 'SELECT * FROM Precios LIMIT 1';
                    $rows = BD::seleccionar($sql, null);
                    if (!$rows || !isset($rows[0][$id])) return false;
                    return [
                        'idPrecio' => $id,
                        'nombreP' => self::$columnMap[$id],
                        'cantidad' => $rows[0][$id]
                    ];
                }
                return false;
            }

            // Fallback PDO
            $configPath = __DIR__ . '/../../config.php';
            if (!file_exists($configPath)) return false;
            $config = include $configPath;
            $dsn = "mysql:host={$config['host_bd']};dbname={$config['bd']};charset=utf8mb4";
            $pdo = new PDO($dsn, $config['usuario_bd'], $config['clave_bd'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);

            if (is_numeric($id)) {
                $stmt = $pdo->prepare('SELECT idPrecio, precioMensual AS cantidad FROM Precios WHERE idPrecio = :id');
                $stmt->execute(['id' => (int)$id]);
                $row = $stmt->fetch();
                return $row ? $row : false;
            }

            if (is_string($id) && array_key_exists($id, self::$columnMap)) {
                $stmt = $pdo->query('SELECT * FROM Precios LIMIT 1');
                $rows = $stmt->fetchAll();
                if (!$rows || !isset($rows[0][$id])) return false;
                return [
                    'idPrecio' => $id,
                    'nombreP' => self::$columnMap[$id],
                    'cantidad' => $rows[0][$id]
                ];
            }

            return false;
        }

        /**
         * Crear precio NO soportado con el esquema actual (columnas fijas).
         * @return int|false
         */
        public static function crearPrecio($nombre, $cantidad) {
            // No soportado: la tabla ahora tiene columnas fijas.
            return false;
        }

        /**
         * Actualiza cantidad de un precio por id numérico o por nombre de columna.
         * @param int|string $id
         * @param float $cantidad
         * @return boolean
         */
        public static function actualizarPrecio($id, $cantidad) {
            // Si id es numérico, actualizar fila por id (compatibilidad)
            if (is_numeric($id)) {
                $sql = 'UPDATE Precios SET cantidad = :cantidad WHERE idPrecio = :id';
                $params = array('cantidad' => $cantidad, 'id' => (int)$id);
                return BD::actualizar($sql, $params);
            }

            // Si id es string, actualizar columna permitida en la primera fila (idPrecio = 1)
            if (is_string($id) && array_key_exists($id, self::$columnMap)) {
                // Prevención de inyección: la columna se toma sólo desde la whitelist
                $col = $id;
                $sql = "UPDATE Precios SET `$col` = :cantidad WHERE idPrecio = (SELECT idPrecio FROM (SELECT idPrecio FROM Precios LIMIT 1) AS tmp)";
                $params = array('cantidad' => $cantidad);
                return BD::actualizar($sql, $params);
            }

            return false;
        }


    }
?>
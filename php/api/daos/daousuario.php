<?php
    require_once(dirname(__DIR__) . '/models/usuario.php');
    require_once(dirname(__DIR__) . '/models/recuperacion.php');
    require_once(dirname(__DIR__) . '/models/dia.php');

    /**
     * DAO de Usuario.
     * Objeto para el acceso a los datos relacionados con usuarios.
     */
    class DAOUsuario {
        /**
         * Consulta la base de datos para autenticar al usuario y devolver sus datos.
         * @param object $login Login Modelo de login.
         * @return object|boolean Devuelve los datos del usuario o false si no existe el usuario. 
         */
        public static function autenticarLogin($login) {
            if (!BD::iniciarTransaccion())
                throw new Exception('No es posible iniciar la transacción.');
            $sql = 'SELECT id, nombre, apellidos, correo, clave, telefono, dni, iban, titular, activo FROM Persona';
            $sql .= ' WHERE correo=:correo';
            $params = array('correo' => $login->usuario);
            $persona = BD::seleccionar($sql, $params);
            // Chequear si existe o no alguien con ese correo.
            if (!$persona) {
                if (!BD::commit()) throw new Exception('No se pudo confirmar la transacción.');
                else return false;
            }
            
            $sql = 'SELECT * FROM Persona';
            $sql .= ' WHERE correo = :usuario';
            $params = array('usuario' => $login->usuario);
            if(!$persona[0]['activo']){
                if (!BD::commit()) throw new Exception('No se pudo confirmar la transacción.');
                else {
                    // Devolvemos un objeto indicando que el usuario está desactivado
                    $res = new stdClass();
                    $res->desactivado = true;
                    $res->id = $persona[0]['id'];
                    $res->correo = $persona[0]['correo'];
                    return $res;
                }
            }
            $resultado = BD::seleccionar($sql, $params);
            if (!BD::commit()) 
                throw new Exception('No se pudo confirmar la transacción.');
            if (password_verify($login->clave, $resultado[0]['clave'])) {
                return DAOUsuario::crearUsuario($resultado);
            }
            else {
                return false;
            }
        }

        public static function actualizarFechaMandato($idPersona, $fecha) {
            if (!BD::iniciarTransaccion()) {
                throw new Exception('No se pudo iniciar la transacción.');
            }

            $sql = "UPDATE Persona SET fechaFirmaMandato = :fecha WHERE id = :id";
            $params = [
                'fecha' => $fecha,
                'id' => $idPersona
            ];

            try {
                BD::actualizar($sql, $params); // usa tu método de actualización
                if (!BD::commit()) {
                    throw new Exception('No se pudo confirmar la transacción.');
                }
            } catch (Exception $e) {
                BD::rollback();
                throw $e; // relanza la excepción para controlarla fuera
            }
        }



        public static function desactivarPadre(int $idPersona) {
            $sql = "
                UPDATE Persona p
                LEFT JOIN Hijo_Padre hp ON p.id = hp.idHijo
                SET p.activo = 0
                WHERE p.id = :idPadre OR hp.idPadre = :idPadre
            ";
            
            BD::actualizar($sql, ['idPadre' => $idPersona]);
        }

        public static function reactivarPadre(int $idPersona) {
            $sql = "
                UPDATE Persona p
                LEFT JOIN Hijo_Padre hp ON p.id = hp.idHijo
                SET p.activo = 1
                WHERE p.id = :idPadre OR hp.idPadre = :idPadre
            ";
            
            BD::actualizar($sql, ['idPadre' => $idPersona]);
        }

        public static function eliminarPadre(int $idPersona) {
            $sql = " DELETE pPadre, pHijo, h 
                    FROM Persona AS pPadre 
                    LEFT JOIN Padre AS pa ON pa.id = pPadre.id 
                    LEFT JOIN Hijo_Padre AS hp ON hp.idPadre = pa.id 
                    LEFT JOIN Persona AS pHijo ON pHijo.id = hp.idHijo 
                    LEFT JOIN Hijo AS h ON h.id = pHijo.id 
                    WHERE pPadre.id = :idPadre;
            ";
            
            BD::actualizar($sql, ['idPadre' => $idPersona]);
        }
        
        /**
         * Obtener las incidencias de una fecha.
         * @param DateTime $fecha Fecha.
         * @return array Devuelve las incidencias. 
         */
        public static function obtenerIncidenciasPorDia($fecha) {
            $sql = 'SELECT idPersona, incidencia FROM Dias';
            $sql .= ' WHERE dia=:fecha';
            $params = array('fecha' => $fecha);

            return BD::seleccionar($sql, $params);
        }

        /**
         * Obtener las incidencias de un mes.
         * @param integer $mes Mes.
         * @return array Devuelve las incidencias. 
         */
        public static function obtenerIncidenciasPorMes($mes) {
            //SELECT idPersona, GROUP_CONCAT(CONCAT(DATE_FORMAT(dia, '%d/%m/%Y'), ' - ', incidencia) SEPARATOR ', ') AS incidencias_mes FROM Dias WHERE MONTH(dia) = 6 GROUP BY idPersona; 
           
            $sql = 'SELECT idPersona, GROUP_CONCAT(CONCAT(DATE_FORMAT(dia, "%d/%m/%Y"), " - ",  incidencia) SEPARATOR "\n ") AS incidencias FROM Dias';
            $sql .= ' WHERE MONTH(dia)=:mes';
            $sql .= ' GROUP BY idPersona';
            $params = array('mes' => $mes);

            return BD::seleccionar($sql, $params);
        }

        /**
         * Inserta/modifica incidencia de un día de un usuario en concreto.
         * @param object $datos Datos de la incidencia.
         */
        public static function insertarIncidencia($datos) {
            $sql = 'UPDATE Dias SET incidencia=:incidencia';
            $sql .= ' WHERE dia=:dia AND idPersona=:idPersona';

            $fecha = new DateTime($datos->dia);
            $fecha = $fecha->format('Y-m-d');

            $params = array(
                'dia' => $fecha,
                'incidencia' => $datos->incidencia,
                'idPersona' => $datos->idPersona
            );

            BD::actualizar($sql, $params);
        }

        /**
         * Eliminar padre.
         * @param int $id ID de la persona padre.
         * @return boolean True si se hizo el proceso, false si no.
         */
        public static function desactivaPadre($idPersona) {
        	$sql  = 'UPDATE Persona ';
					$sql .= 'SET activo = 0 ';
        	$sql .= 'WHERE id = ( ';
					$sql .= 'SELECT id FROM Padre WHERE id = :idPersona) ';
          $params = array('idPersona' => $idPersona);
          BD::actualizar($sql, $params);
        }

        /**
         * Obtener filas de la tabla días de las personas cuyos IDs estén en la lista.
         * @param array $idPersonas Lista con los IDs de las personas.
         * @return array Array con los días de todas las personas.
         */
        public static function obtenerDias($idPersonas) {
            $sql = 'SELECT dia, idPersona, idPadre FROM Dias';
            $sql .= ' WHERE idPersona IN (';

            foreach ($idPersonas as $id)
                $sql .= $id . ',';

            $sql = substr_replace($sql, ")", -1);
            $resultado = BD::seleccionar($sql, null);

            return DAOUsuario::crearDias($resultado);
        }


        public static function eliminarHijoDefinitivo($idHijo, $idPadre) {
            // Iniciar transacción usando el helper BD del proyecto
            if (!BD::iniciarTransaccion()) {
                throw new Exception('No es posible iniciar la transacción.');
            }

            try {
                // 1) Eliminar la relación padre-hijo concreta
                $sql = 'DELETE FROM Hijo_Padre WHERE idHijo = :idHijo AND idPadre = :idPadre';
                BD::borrar($sql, array('idHijo' => $idHijo, 'idPadre' => $idPadre));

                // 2) Comprobar si quedan otros padres activos para este hijo
                $sql = 'SELECT COUNT(*) AS cnt FROM Hijo_Padre WHERE idHijo = :idHijo AND activo = 1';
                $res = BD::seleccionar($sql, array('idHijo' => $idHijo));
                $otros = (isset($res[0]['cnt']) ? (int)$res[0]['cnt'] : 0);

                if ($otros === 0) {
                    // No hay otros padres: eliminar todas las referencias y la persona
                    // a) eliminar cualquier fila residual en Hijo_Padre
                    $sql = 'DELETE FROM Hijo_Padre WHERE idHijo = :idHijo';
                    BD::borrar($sql, array('idHijo' => $idHijo));

                    // b) eliminar Dias asociados (evita conflicto FK)
                    $sql = 'DELETE FROM Dias WHERE idPersona = :idHijo';
                    BD::borrar($sql, array('idHijo' => $idHijo));

                    // c) eliminar Persona (la FK en Hijo tiene ON DELETE CASCADE)
                    $sql = 'DELETE FROM Persona WHERE id = :id';
                    BD::borrar($sql, array('id' => $idHijo));
                }

                if (!BD::commit()) {
                    throw new Exception('No se pudo confirmar la transacción.');
                }

                return true;
            } catch (Exception $e) {
                // Intentar rollback si el helper lo soporta
                if (method_exists('BD', 'rollBack')) {
                    BD::rollBack();
                }
                throw $e;
            }
        }

        /**
         * Obtener los datos de las personas que tienen 'x' día asignado.
         * @param DateTime $fecha Fecha.
         */
        public static function obtenerUsuariosPorDia($fecha) {
            if (!BD::iniciarTransaccion())
                throw new Exception('No es posible iniciar la transacción.');

            $sql = 'SELECT idPersona FROM Dias';
            $sql .= ' WHERE dia=:fecha';
            $params = array('fecha' => $fecha);

            $resultados = BD::seleccionar($sql, $params);

            if (!count($resultados)) {
                if (!BD::commit()) throw new Exception('No se pudo confirmar la transacción.');
                else return false;
            }

            $sql = 'SELECT id, nombre, apellidos, correo FROM Persona';
            $sql .= ' WHERE id IN (';

            foreach ($resultados as $resultado)
                $sql .= $resultado['idPersona'] . ',';
            
            $sql = substr_replace($sql, ")", -1);
            $sql .= ' ORDER BY apellidos';
            $usuarios = BD::seleccionar($sql, null);
            
            if (!BD::commit())
                throw new Exception('No se pudo confirmar la transacción.');
                
            return $usuarios;
        }
        
        public static function obtenerDiasCalendario($idPadre, $anio, $mes) {
            $sql = '
                SELECT
                    h.id AS id_hijo,
                    p.nombre,
                    p.apellidos,
                    DATE_FORMAT(d.dia, "%d-%m-%Y") AS fecha,
                    d.tupper
                FROM Hijo h
                JOIN Persona p ON h.id = p.id
                JOIN Dias d ON h.id = d.idPersona
                JOIN Hijo_Padre hp ON h.id = hp.idHijo
                WHERE h.activo = 1
                AND hp.idPadre = ?
                AND YEAR(d.dia) = ?
                AND MONTH(d.dia) = ?
                ORDER BY h.id, d.dia
            ';
            $resultado = BD::seleccionar($sql, [$idPadre, $anio, $mes]);
            $datos = [];
            foreach ($resultado as $fila) {
                $idHijo = $fila['id_hijo'];
                if (!isset($datos[$idHijo])) {
                    $datos[$idHijo] = [
                        'id_hijo' => $idHijo,
                        // concatenar nombre + apellidos para que la vista reciba el nombre completo
                        'nombre' => trim($fila['nombre'] . ' ' . ($fila['apellidos'] ?? '')),
                        'dias' => []
                    ];
                }
                $datos[$idHijo]['dias'][] = [
                    'fecha' => $fila['fecha'],
                    'tupper' => (int)$fila['tupper']
                ];
            }
            return array_values($datos); // devuelve array indexado por posición
        }

        /**
         * Obtener los datos de las personas que van al comedor en 'x' mes.
         * @param Integer $mes Mes.
         */
        public static function obtenerUsuariosPorMes($mes) {
            // Añadimos cálculo del importe por usuario usando la fila de Precios
            $sql = "SELECT Persona.id, Persona.nombre, Persona.apellidos, Persona.correo, Persona.dni AS dni, Persona.fechaFirmaMandato AS fechaFirmaMandato,
                        COUNT(Dias.idPersona) AS numeroMenus,
                        SUM(Dias.tupper) AS tupper,
                        GROUP_CONCAT(DAYOFMONTH(Dias.dia) ORDER BY Dias.dia ASC SEPARATOR ', ') AS dias,
                        GROUP_CONCAT(
                            CASE WHEN Dias.tupper = 1 THEN DAYOFMONTH(Dias.dia) END
                            ORDER BY Dias.dia ASC
                            SEPARATOR ', '
                        ) AS diasTupper,
                            (COUNT(Dias.idPersona) * (CASE WHEN COALESCE(padre.tipo, Persona.tipo) IN ('E','A') THEN COALESCE(MAX(pr.precioDiaHijoProfe), MAX(pr.precioDiario), MAX(pr.precioMensual), 0) ELSE COALESCE(MAX(pr.precioDiario), MAX(pr.precioMensual), 0) END) + COALESCE(SUM(Dias.tupper),0) * COALESCE(MAX(pr.precioTupper),0)) AS importe,
                        COALESCE(padre.tipo, NULL) AS tipoPadre,
                        GROUP_CONCAT(DISTINCT CONCAT(p2.nombre, ' ', COALESCE(p2.apellidos, '')) SEPARATOR '; ') AS hijos
                        FROM Persona
                        JOIN Dias ON Persona.id = Dias.idPersona
                        LEFT JOIN Persona padre ON padre.id = Dias.idPadre
                        LEFT JOIN Hijo_Padre hp ON hp.idPadre = Persona.id
                        LEFT JOIN Persona p2 ON p2.id = hp.idHijo
                        CROSS JOIN (SELECT precioMensual, precioDiario, precioDiaHijoProfe, precioDiaProfesor, precioTupper FROM Precios LIMIT 1) AS pr
                        WHERE MONTH(Dias.dia) = :mes
                        GROUP BY Persona.id, Persona.dni, Persona.fechaFirmaMandato, Persona.nombre, Persona.apellidos, Persona.correo, padre.tipo
                        ORDER BY Persona.apellidos";
            $params = array('mes' => $mes);
            $usuarios = BD::seleccionar($sql, $params);
            return $usuarios;
        }

        /**
         * Añadir fila a la tabla días
         * @param object $datos Datos del día.
         */
        public static function altaDia($datos) {
             $sql = 'INSERT INTO Dias(dia, idPersona, idPadre)';
             $sql .= ' VALUES(:dia, :idPersona, :idPadre)';
 
            // Asegurar formato de fecha YYYY-MM-DD
            $fecha = new DateTime($datos->dia);
            $params = array(
                'dia' => $fecha->format('Y-m-d'),
                'idPersona' => $datos->idPersona,
                'idPadre' => $datos->idPadre
            );

            return BD::insertar($sql, $params);
        }

        /**
         * Eliminar fila tabla días.
         * @param object $dia Fecha del día.
         * @param int $idPersona ID de la persona.
         * @param int $idPadre ID del padre.
         */
        public static function eliminarDia($dia, $idPersona, $idPadre) {
            $sql = 'DELETE FROM Dias';
            $sql .= ' WHERE dia=:dia AND idPersona=:idPersona AND idPadre=:idPadre';

            $params = array(
                'dia' => $dia,
                'idPersona' => $idPersona,
                'idPadre' => $idPadre
            );

            BD::borrar($sql, $params);
        } 

        /**
         * Consulta la base de datos para autenticar al usuario y devolver sus datos.
         * El email ha sido autenticado por Google.
         * @param string $email Correo del usuario.
         * @return Usuario|boolean Devuelve los datos del usuario o false si no existe el usuario.
         */
        public static function autenticarEmail($email) {
            // Incluir la columna 'tipo' en la selección
            $sql = 'SELECT id, nombre, apellidos, correo, clave, telefono, dni, iban, titular, tipo FROM Persona';
            $sql .= ' WHERE correo = :email';

            $params = array('email' => $email);
            $resultado = BD::seleccionar($sql, $params);

            return DAOUsuario::crearUsuario($resultado);
        }

        /**
         * Consulta la base de datos para ver si existe usuario with el correo electrónico pasado.
         * @param string $email Correo del usuario.
         * @return Usuario|boolean Devuelve los datos del usuario o false si no existe el usuario.
         */
        public static function existeCorreo($datos) {
            $sql = 'SELECT id, nombre, apellidos, correo, clave, telefono, dni, iban, titular FROM Persona';
            $sql .= ' WHERE correo = :email';

            $params = array('email' => $datos->correo);
            $resultado = BD::seleccionar($sql, $params);

            return DAOUsuario::crearUsuario($resultado);
        }

        /**
         * Inserta fila en la tabla de recuperacionClave.
         * @param object $datos Datos del usuario.
         * @return string Devuelve código único de la solicitud.
         */
        public static function insertarRecuperacionClave($datos) {
            $sql = 'INSERT INTO RecuperacionClaves(id, fechaLimite, codigo)';
            $sql .= ' VALUES(:id, :fechaLimite, :codigo)';

            $fecha = new DateTime('now');
            $fecha->modify('+1 day');

            $codigo = self::generarUID(8);

            $params = array(
                'id' => $datos->id,
                'fechaLimite' => $fecha->format('Y-m-d H:i:s'),
                'codigo' => $codigo
            );

            BD::insertar($sql, $params);
            return $codigo;
        }

        /**
         * Obtiene fila de la tabla recuparacionClaves.
         * @param string $codigo Código único.
         * @return Recuperacion Objeto con la información.
         */
        public static function obtenerRecuperacionPorCodigo($codigo) {
            $sql = 'SELECT id, fechaLimite, codigo FROM RecuperacionClaves';
            $sql .= ' WHERE codigo=:codigo';
            $params = array('codigo' => $codigo);

            $resultado = BD::seleccionar($sql, $params);
            return DAOUsuario::crearRecuperacionClave($resultado);
        }
        
        /**
         * Obtiene fila de la tabla recuparacionClaves.
         * @param object $datos Datos de la Persona.
         * @return object Objeto con la información.
         */
        public static function obtenerRecuperacionPorID($datos) {
            $sql = 'SELECT id, fechaLimite, codigo FROM RecuperacionClaves';
            $sql .= ' WHERE id=:id';
            $params = array('id' => $datos->id);

            $resultado = BD::seleccionar($sql, $params);
            return DAOUsuario::crearRecuperacionClave($resultado);
        }

        /**
         * Borra fila de la tabla recuperacionClaves.
         * @param object $datos Datos de la fila.
         */
        public static function borrarRecuperacion($datos) {
            $sql = 'DELETE FROM RecuperacionClaves';
            $sql .= ' WHERE id=:id';
            $params = array('id' => $datos->id);

            BD::borrar($sql, $params);
        }

        /**
         * Genera código único.
         * @param int $longitud Longitud a generar.
         * @return string Código.
         */
        public static function generarUID($longitud) {
            return strtoupper(bin2hex(openssl_random_pseudo_bytes($longitud)));
        }

        /**
         * Añade fila a tabla 'Persona'
         * @param object $datos Datos de la Persona.
         * @return int ID de la fila insertada.
         */
        public static function altaPersona($datos)
        {
            $sql = 'INSERT INTO Persona(nombre, apellidos, correo, clave, telefono, dni, iban, titular, tipo)';
            $sql .= ' VALUES(:nombre, :apellidos, :correo, :clave, :telefono, :dni, :iban, :titular, :tipo)';

            if ($datos->clave != null) {
                $clave = password_hash($datos->clave, PASSWORD_DEFAULT, ['cost' => 15]);
            } else {
                $clave = NULL;
            }

            // Cargar configuración para comprobar lista de correos de secretaria
            $config = require_once(dirname(dirname(__DIR__)) . '/config.php');

            $correoLower = strtolower(trim($datos->correo));
            $tipo = 'U';
            if (isset($config['correo_secretaria']) && is_array($config['correo_secretaria'])) {
                $secretarias = array_map('strtolower', $config['correo_secretaria']);
                if (in_array($correoLower, $secretarias, true)) {
                    $tipo = 'A';
                }
            }

            if ($tipo !== 'A') {
                if (strpos($correoLower, '@fundacionloyola.es') !== false) {
                    $tipo = 'E';
                } else if (strpos($correoLower, '@alumnado.fundacionloyola.net') !== false) {
                    // Consideramos alumnado también como empleado/miembro educativo
                    $tipo = 'E';
                } else {
                    $tipo = 'U';
                }
            }

            $params = array(
                'nombre' => $datos->nombre,
                'apellidos' => $datos->apellidos,
                'correo' => $datos->correo,
                'clave' => $clave,
                'telefono' => $datos->telefono,
                'dni' => $datos->dni,
                'iban' => $datos->iban,
                'titular' => $datos->titular,
                'tipo' => $tipo
            );
        
            // Antes: se creaban automáticamente las entradas adicionales de 'Personal' (Padre/Hijo)
            // cuando el tipo era 'E'. Cambiamos comportamiento: NO crear hijo/padre automáticamente
            // para usuarios con correo de la fundación a menos que el cliente solicite explícitamente
            // la creación (campo opcional $datos->crearPersonal = true).
            $crearPersonal = isset($datos->crearPersonal) ? (bool)$datos->crearPersonal : false;

            // Insertar la Persona
            $id = BD::insertar($sql, $params);

            // Si es admin/secretaria (tipo 'A') o empleado/alumnado (tipo 'E'), crear la fila en Padre
            // para que puedan añadir hijos más tarde. No crear Hijo automáticamente para 'E'.
            if ($tipo === 'A' || $tipo === 'E') {
                try {
                    self::altaPadre($id);
                } catch (Throwable $e) {
                    error_log('Error creando Padre para id=' . $id . ': ' . $e->getMessage());
                }
            }

            // Si se indicó explícitamente crearPersonal y el tipo es 'E', crear también el registro
            // en Hijo y la relación Hijo_Padre para el propio usuario (caso excepcional).
            if ($crearPersonal && $tipo === 'E') {
                try {
                    // Insertar en Hijo usando el id ya creado
                    $sqlH = 'INSERT INTO Hijo(id, idPadreAlta, idCurso, pin) VALUES(:id, :idPadreAlta, :idCurso, :pin)';
                    $paramsH = array(
                        'id' => $id,
                        'idPadreAlta' => $id,
                        'idCurso' => 1,
                        'pin' => self::generarUID(4)
                    );
                    BD::insertar($sqlH, $paramsH);

                    // Insertar relación en Hijo_Padre
                    $sqlHP = 'INSERT INTO Hijo_Padre(idPadre, idHijo) VALUES(:idPadre, :idHijo)';
                    $paramsHP = array('idPadre' => $id, 'idHijo' => $id);
                    BD::insertar($sqlHP, $paramsHP);
                } catch (Throwable $e) {
                    error_log('Error creando Hijo/Hijo_Padre para id=' . $id . ': ' . $e->getMessage());
                }
            }

            return $id;
        }
        
        public static function insertarPersonal($sql,$params)
        {
            if (!BD::iniciarTransaccion())
                throw new Exception('No es posible iniciar la transacción.');
        
            $id = BD::insertar($sql, $params);
        
            self::altaPadre($id);
        
            // Insertar en Hijo
            $sql = 'INSERT INTO Hijo(id, idPadreAlta, idCurso, pin)';
            $sql .= ' VALUES(:id, :idPadreAlta, :idCurso, :pin)';
            $params = array(
                'id' => $id,
                'idPadreAlta' =>  $id,
                'idCurso' => 1,// NO PUEDE SER NULO Y NO SE QUE PONER
                'pin' => self::generarUID(4)
            );

           BD::insertar($sql, $params);

            // Insertar en Hijo_Padre
            $sql = 'INSERT INTO Hijo_Padre(idPadre, idHijo)';
            $sql .= ' VALUES(:idPadre, :idHijo)';
            $params = array(
                'idPadre' => $id,
                'idHijo' => $id
            );

            BD::insertar($sql, $params);
            if (!BD::commit())
                throw new Exception('No se pudo confirmar la transacción.');
        
            return $id;
        }

        /**
         * Inserta fila en la tabla 'Persona' solo de varios campos.
         * @param object $datos Datos del usuario.
         * @return void
         */
        public static function altaUsuarioGoogle($datos) {
            $sql = 'INSERT INTO Persona(nombre, apellidos, correo, tipo)';
            $sql .= ' VALUES(:nombre, :apellidos, :correo, :tipo)';

            // Cargar configuración para comprobar lista de correos de secretaria
            $config = require_once(dirname(dirname(__DIR__)) . '/config.php');
            $correoLower = strtolower(trim($datos['email']));
            $tipo = 'U';
            if (isset($config['correo_secretaria']) && is_array($config['correo_secretaria'])) {
                $secretarias = array_map('strtolower', $config['correo_secretaria']);
                if (in_array($correoLower, $secretarias, true)) {
                    $tipo = 'A';
                }
            }

            if ($tipo !== 'A') {
                if (strpos($correoLower, '@fundacionloyola.es') !== false || strpos($correoLower, '@alumnado.fundacionloyola.net') !== false) {
                    $tipo = 'E';
                } else {
                    $tipo = 'U';
                }
            }

            $params = array(
                'nombre' => $datos['given_name'],
                'apellidos' => $datos['family_name'],
                'correo' => $datos['email'],
                'tipo' => $tipo
            );

            $id = BD::insertar($sql, $params);
            // Crear entrada en Padre para tipos 'A' y 'E' para permitir añadir hijos más tarde
            if ($tipo === 'A' || $tipo === 'E') {
                try {
                    self::altaPadre($id);
                } catch (Throwable $e) {
                    error_log('Error creando Padre para usuario Google id=' . $id . ': ' . $e->getMessage());
                }
            }

            return $id;
        }

        /**
         * Modifica fila de la tabla 'Persona'.
         * @param object $datos Datos de la Persona.
         * @return void
         */
        public static function modificarPersona($datos) {
            $sql = 'UPDATE Persona';
            $sql .= ' SET nombre=:nombre, apellidos=:apellidos, correo=:correo, iban=:iban, telefono=:telefono WHERE id=:id';
            $params = array(
                'nombre' => $datos->nombre,
                'apellidos' => $datos->apellidos,
                'correo' => $datos->correo,
                'iban' => $datos->iban,
                'telefono' => $datos->telefono,
                'id' => $datos->id
            );

            BD::actualizar($sql, $params);
        }

        /**
         * Modifica campo contraseña de una fila de la tabla 'Persona'.
         * @param object $datos Datos de la Persona.
         * @return void
         */
        public static function modificarContrasenia($datos) {
            $sql = 'UPDATE Persona';
            $sql .= ' SET clave=:clave WHERE id=:id';
            $params = array(
                'id' => $datos->id,
                'clave' => password_hash($datos->clave, PASSWORD_DEFAULT, ['cost' => 15])
            );

            BD::actualizar($sql, $params);
        }

        /**
         * Inserta fila en la tabla 'Padre'.
         * @param int $id ID de la persona.
         */
        public static function altaPadre($id) {
            $sql = 'INSERT INTO Padre(id)';
            $sql .= ' VALUES(:id)';
            $params = array('id' => $id);

            BD::insertar($sql, $params); 
        }
    
        /**
         * Insertar hijo,
         * @param object $datos Datos hijo.
         */
        public static function insertarHijo($datos) {
            if (!BD::iniciarTransaccion())
                throw new Exception('No es posible iniciar la transacción.');

            // Insertar en Persona
            $sql = 'INSERT INTO Persona(nombre, apellidos)';
            $sql .= ' VALUES(:nombre, :apellidos)';

            $params = array(
                'nombre' => $datos->nombre,
                'apellidos' => $datos->apellidos
            );

            $id = BD::insertar($sql, $params);  

            // Insertar en Hijo
            $sql = 'INSERT INTO Hijo(id, idPadreAlta, idCurso, pin)';
            $sql .= ' VALUES(:id, :idPadreAlta, :idCurso, :pin)';
            $params = array(
                'id' => $id,
                'idPadreAlta' => $datos->id,
                'idCurso' => $datos->idCurso,
                'pin' => self::generarUID(4)
            );

            BD::insertar($sql, $params); 

            // Insertar en Hijo_Padre
            $sql = 'INSERT INTO Hijo_Padre(idPadre, idHijo)';
            $sql .= ' VALUES(:idPadre, :idHijo)';
            $params = array(
                'idPadre' => $datos->id,
                'idHijo' => $id
            );

            BD::insertar($sql, $params); 

            if (!BD::commit())
                throw new Exception('No se pudo confirmar la transacción.');
        }

        /**
         * Añade a un hijo existente relación con un padre.
         * @param object $datos Datos (ID padre y pin).
         * @return boolean True si el proceso es exitoso, false si no lo es.
         */
        public static function registrarHijoPadre($datos) {
            if (!BD::iniciarTransaccion())
                throw new Exception('No es posible iniciar la transacción.');

            $sql = 'SELECT id, idPadreAlta, idCurso, pin FROM Hijo';
            $sql .= ' WHERE pin=:pin';
            $params = array('pin' => $datos->pin);

            $resultado = BD::seleccionar($sql, $params);

            if (!$resultado) {
                if (!BD::commit()) throw new Exception('No se pudo confirmar la transacción.');
                else return false;
            }

            $sql = 'INSERT INTO Hijo_Padre(idPadre, idHijo)';
            $sql .= ' VALUES(:idPadre, :idHijo)';
            $params = array(
                'idPadre' => $datos->id,
                'idHijo' => $resultado[0]['id']
            );

            BD::insertar($sql, $params);

            if (!BD::commit())
                throw new Exception('No se pudo confirmar la transacción.');

            return true;
        }

        /**
         * Muestra todos los hijos asociados a un padre.
         * @param int $id ID de la Persona.
         * @return object|boolean Devuelve los datos de los hijos asociados al usuario o false si no existe el usuario.
         */
        public static function dameHijos($id) {
            $sql = 'SELECT Persona.id, Hijo.idPadreAlta, Hijo.pin, Persona.nombre, Persona.apellidos, Hijo.idCurso FROM Persona';
            $sql .= ' INNER JOIN Hijo_Padre ON Persona.id = Hijo_Padre.idHijo';
            $sql .= ' INNER JOIN Hijo on Persona.id = Hijo.id';
            $sql .= ' WHERE Hijo_Padre.idPadre = :id AND Hijo_Padre.activo=1';
            $params = array('id' => $id);

            return BD::seleccionar($sql, $params);
        }

        /**
         * Elimina fila de la tabla 'Hijo_Padre'
         * @param int $idHijo ID del hijo.
         * @param int $idPadre ID del padre.
         */
        public static function eliminarRelacion($idHijo, $idPadre) {
				die("TRON: No debería usarse (eliminarRelacion)");
            $sql = 'DELETE FROM Hijo_Padre';
            $sql .= ' WHERE idPadre=:idPadre AND idHijo=:idHijo';
            $params = array(
                'idPadre' => $idPadre,
                'idHijo' => $idHijo
            );

            BD::borrar($sql, $params);
        }

        /**
         * Elimina fila de la tabla 'Personas'
         * @param int $id ID de la fila a eliminar.
         */
        public static function eliminaPersona($id){
				die("TRON: No debería usarse (eliminarPersona)");
            $sql = 'DELETE FROM Persona';
            $sql .= ' WHERE id = :id';
            $params = array('id' => $id);

            BD::borrar($sql, $params);
        }
        
				/**
         * Marca el hijo como inactivo.
         * @param int $id ID del hijo.
         */
        public static function eliminarHijo($idHijo, $idPadre){
           if (!BD::iniciarTransaccion())
           	throw new Exception('No es posible iniciar la transacción.');
					
					//Se marca el hijo como inactivo
          $sql = 'UPDATE Hijo_Padre SET activo = 0 ';
          $sql .= ' WHERE idPadre = :idPadre AND idHijo = :idHijo';
          $params = array('idPadre' => $idPadre, 'idHijo' => $idHijo);
          BD::actualizar($sql, $params);
					
					//Se borran los menús futuros
          $sql  = 'DELETE FROM Dias ';
          $sql .= ' WHERE idPadre = :idPadre AND idPersona = :idHijo ';
					if (date('H') < 14)
						$sql .= ' AND dia > CURDATE() ';
					else
						$sql .= ' AND dia > CURDATE() + 1 ';
          $params = array('idPadre' => $idPadre, 'idHijo' => $idHijo);
          BD::borrar($sql, $params);
            
					if (!BD::commit())
          	throw new Exception('No se pudo confirmar la transacción.');
        }


        /**
         * Modifica fila de la tabla 'Persona'
         * @param object $datos Datos de la Persona.
         * @return void
         */
        public static function modificarHijo($datos) {
            //UPDATE Persona inner join hijo on Persona.id = Hijo.id set nombre = 'Prueba', apellidos = 'Prueba2', idCurso = 4;
            $sql = 'UPDATE Persona INNER JOIN Hijo on Persona.id = Hijo.id';
            $sql .= ' SET nombre=:nombre, apellidos=:apellidos, idCurso=:idCurso WHERE Persona.id=:id';
            $params = array(
                'nombre' => $datos->nombre,
                'apellidos' => $datos->apellidos,
                'idCurso' => $datos->idCurso,
                'id' => $datos->id
            );

            BD::actualizar($sql, $params);
        }

        /**
         * Inserta fila en la tabla 'usuario'.
         * @param int $id ID de la Persona.
         * @return int ID de la inserción.
         */
        public static function altaUsuario($id) {
            $sql = 'INSERT INTO Usuario(id)';
            $sql .= ' VALUES(:id)';
            $params = array('id' => $id);

            return BD::insertar($sql, $params);
        }

        /**
         * Genera un listado de los días que tiene de comedor un usuario.
         * @param array $listaDias Array de datos.
         * @return array|boolean Array de dias, o False si no se pudo generar el listado.
         */
        public static function crearDias($listaDias) {
            $dias = array();

            if (count($listaDias) > 0) {
                for ($i=0; $i<count($listaDias); $i++) {
                    $dia = new Dia();
                    $dia->dia = $listaDias[$i]['dia'];
                    $dia->idPersona = $listaDias[$i]['idPersona'];
                    $dia->idPadre = $listaDias[$i]['idPadre'];
                    $dias[] = $dia;
                }
                return $dias;
            }
            else {
                return false;
            }
        }

        /**
         * Genera un objeto de tipo usuario.
         * @param array $resultSet Array de datos.
         * @return Usuario|boolean Objeto creado o False si no se pudo crear.
         */
        public static function crearUsuario($resultSet) {
            $usuario = new Usuario();
           
            if (count($resultSet) == 1) {
                $usuario->id = $resultSet[0]['id'];
                $usuario->correo = $resultSet[0]['correo'];
                $usuario->nombre = $resultSet[0]['nombre'];
                $usuario->apellidos = $resultSet[0]['apellidos'];
                $usuario->telefono = $resultSet[0]['telefono'];
                $usuario->dni = $resultSet[0]['dni'];
                $usuario->iban = $resultSet[0]['iban'];
                $usuario->titular = $resultSet[0]['titular'];
                $usuario->rol = null;
                $usuario->tipo = isset($resultSet[0]['tipo']) ? $resultSet[0]['tipo'] : null; // Asignar tipo desde BBDD
                $usuario->clave = false;
                if ($resultSet[0]['clave'])
                    $usuario->clave = true;
            }
            else {
                $usuario = false;
            }

            return $usuario;
        }

        /**
         * Genera un objeto de tipo recuperacion de claves.
         * @param array $resultSet Array de datos.
         * @return Recuperacion|boolean Objeto creado o False si no se pudo crear.
         */
        public static function crearRecuperacionClave($resultSet) {
            $recuperacion = new Recuperacion();

            if (count($resultSet) == 1) {
                $recuperacion->id = $resultSet[0]['id'];
                $recuperacion->fechaLimite = $resultSet[0]['fechaLimite'];
                $recuperacion->codigo = $resultSet[0]['codigo'];
            }
            else {
                $recuperacion = false;
            }

            return $recuperacion;
        }

        /**
         * Obtener las incidencias de una fecha.
         * @param String $busqueda busqueda.
         * @return array Devuelve las incidencias. 
         */
        public static function obtenerListadoPadres($busqueda) {
            $sql  = 'SELECT p1.id, p1.nombre, p1.apellidos, p1.correo, p1.telefono, p1.dni, p1.iban, p1.titular, p1.fechaFirmaMandato, ';
						$sql .= 'GROUP_CONCAT(CONCAT(p2.nombre, " ", p2.apellidos) SEPARATOR ", ") AS hijos '; 
						$sql .= 'FROM Persona p1 ';
            $sql .= 'INNER JOIN Padre ON p1.id = Padre.id ';
						$sql .= 'LEFT JOIN Hijo_Padre ON Hijo_Padre.idPadre = Padre.id ';
						$sql .= 'LEFT JOIN Persona p2 ON Hijo_Padre.idHijo = p2.id ';
                        $sql .= 'WHERE p1.activo = 1 ';
						$sql .= 'GROUP BY p1.id ';
            if ($busqueda == "null") 
                $params = null;
         		else{
                $sql .= 'WHERE UPPER(p1.nombre) LIKE UPPER(:busqueda) ';
                $sql .= 'OR UPPER(p1.apellidos) LIKE UPPER(:busqueda) ';
                $sql .= 'OR UPPER(p1.correo) LIKE UPPER(:busqueda) ';
               
                $params = array('busqueda' => '%' . $busqueda . '%');
						}
            $padres = BD::seleccionar($sql, $params);
           
            return $padres;
        }

        /**
         * Obtener El listado de padres desactivados.
         * @return array Devuelve las incidencias. 
         */
       public static function obtenerListadoPadresDesactivados() {
            $params = null;
            $sql  = 'SELECT p1.id, p1.nombre, p1.apellidos, p1.correo, p1.telefono, p1.dni, p1.iban, p1.titular, p1.fechaFirmaMandato, ';
            $sql .= 'GROUP_CONCAT(CONCAT(p2.nombre, " ", p2.apellidos) SEPARATOR ", ") AS hijos ';
            $sql .= 'FROM Persona p1 ';
            $sql .= 'INNER JOIN Padre ON p1.id = Padre.id ';
            $sql .= 'LEFT JOIN Hijo_Padre ON Hijo_Padre.idPadre = Padre.id ';
            $sql .= 'LEFT JOIN Persona p2 ON Hijo_Padre.idHijo = p2.id ';
            $sql .= 'WHERE p1.activo = 0 '; // desactivados
            $sql .= 'GROUP BY p1.id, p1.nombre, p1.apellidos, p1.correo, p1.telefono, p1.dni, p1.iban, p1.titular, p1.fechaFirmaMandato';

            $padres = BD::seleccionar($sql, $params);
            return $padres;
    }

        /**
         * Modificar datos padre.
         * @param object $datos Datos del padre.
         */
        public static function modificarPadreSecretaria($datos) {
            $sql = 'UPDATE Persona';
            $sql .= ' SET nombre=:nombre, apellidos=:apellidos, correo=:correo, telefono=:telefono, dni=:dni, iban=:iban, titular=:titular, fechaFirmaMandato=:fechaFirmaMandato';
            $sql .= ' WHERE id=:id';

            $params = array(
                'nombre' => $datos->nombre ?? null,
                'apellidos' => $datos->apellidos ?? null,
                'correo' => $datos->correo ?? null,
               'telefono' => $datos->telefono ?? null,
                'dni' => $datos->dni ?? null,
                'iban' => $datos->iban ?? null,
                'titular' => $datos->titular ?? null,
                // si viene cadena vacía la guardamos como NULL
                'fechaFirmaMandato' => (isset($datos->fechaFirmaMandato) && $datos->fechaFirmaMandato !== '') ? $datos->fechaFirmaMandato : null,
                'id' => $datos->id
            );

            BD::actualizar($sql, $params);
         }

        /**
         * Obtener datos para remesa Q19 de un mes.
         * Ahora devuelve una fila por hijo (no agregada por padre), calculando
         * el importe correspondiente a ese hijo de forma independiente.
         * @param integer $mes Mes.
         * @return array Devuelve los registros de la remesa por hijo.
         */
        public static function obtenerQ19($mes) {
            $sql  = "SELECT 
                        hp.idPadre AS idPadre,
                        p.titular AS titular,
                        p.correo AS correo,
                        p.iban AS iban,
                        p.dni AS dni,
                        p.fechaFirmaMandato AS fechaFirmaMandato,
                        per.id AS idHijo,
                        CONCAT(per.nombre, ' ', COALESCE(per.apellidos, '')) AS hijoNombre,
                        COUNT(d.dia) AS dias,
                        COALESCE(SUM(d.tupper), 0) AS dias_tupper,
                        (
                          COUNT(d.dia) * (
                            CASE
                              WHEN p.tipo IN ('E','A')
                                THEN COALESCE(
                                  (SELECT precioDiaHijoProfe FROM Precios LIMIT 1),
                                  (SELECT precioDiario FROM Precios LIMIT 1),
                                  (SELECT precioMensual FROM Precios LIMIT 1),
                                  0
                                )
                              ELSE COALESCE(
                                  (SELECT precioDiario FROM Precios LIMIT 1),
                                  (SELECT precioMensual FROM Precios LIMIT 1),
                                  0
                              )
                            END
                          )
                          + COALESCE(SUM(d.tupper), 0) * COALESCE((SELECT precioTupper FROM Precios LIMIT 1), 0)
                        ) AS importe
                     FROM Dias d
                     JOIN Persona per ON per.id = d.idPersona
                     JOIN Hijo_Padre hp ON hp.idHijo = per.id AND hp.activo = 1
                     JOIN Persona p ON p.id = hp.idPadre
                     WHERE MONTH(d.dia) = :mes
                     GROUP BY hp.idPadre, per.id, p.titular, p.correo, p.iban, p.dni, p.fechaFirmaMandato, per.nombre, per.apellidos
                     ORDER BY p.apellidos, per.nombre, per.id";
            $params = array('mes' => $mes);
            return BD::seleccionar($sql, $params);
        }

        public static function obtenerQ19PorHijo($mes, $idHijo) {
            $sql  = "SELECT 
                        hp.idPadre AS idPadre,
                        p.titular AS titular,
                        p.correo AS correo,
                        p.iban AS iban,
                        p.dni AS dni,
                        p.fechaFirmaMandato AS fechaFirmaMandato,
                        per.id AS idHijo,
                        CONCAT(per.nombre, ' ', COALESCE(per.apellidos, '')) AS hijoNombre,
                        COUNT(d.dia) AS dias,
                        COALESCE(SUM(d.tupper), 0) AS dias_tupper,
                        (
                          COUNT(d.dia) * (
                            CASE
                              WHEN p.tipo IN ('E','A')
                                THEN COALESCE(
                                  (SELECT precioDiaHijoProfe FROM Precios LIMIT 1),
                                  (SELECT precioDiario FROM Precios LIMIT 1),
                                  (SELECT precioMensual FROM Precios LIMIT 1),
                                  0
                                )
                              ELSE COALESCE(
                                  (SELECT precioDiario FROM Precios LIMIT 1),
                                  (SELECT precioMensual FROM Precios LIMIT 1),
                                  0
                              )
                            END
                          )
                          + COALESCE(SUM(d.tupper), 0) * COALESCE((SELECT precioTupper FROM Precios LIMIT 1), 0)
                        ) AS importe
                     FROM Dias d
                     JOIN Persona per ON per.id = d.idPersona
                     JOIN Hijo_Padre hp ON hp.idHijo = per.id AND hp.activo = 1
                     JOIN Persona p ON p.id = hp.idPadre
                     WHERE MONTH(d.dia) = :mes
                       AND per.id = :idHijo
                     GROUP BY hp.idPadre, per.id, p.titular, p.correo, p.iban, p.dni, p.fechaFirmaMandato, per.nombre, per.apellidos
                     ORDER BY p.apellidos, per.nombre, per.id";
            $params = array('mes' => $mes, 'idHijo' => $idHijo);
            return BD::seleccionar($sql, $params);
        }

        
        
        // Funciones para la gestión de tuppers
        public static function obtenerTupper($fecha) {
            $sql = 'SELECT idPersona, tupper FROM Dias';
            $sql .= ' WHERE dia=:fecha';
            $params = array('fecha' => $fecha);

            return BD::seleccionar($sql, $params);
        }

        public static function insertarTupper($datos) {
            $sql = 'UPDATE Dias SET tupper = :tupper WHERE idPersona = :idPersona AND dia = :dia';
            $fecha = new DateTime($datos->dia);
            $params = array(
                'idPersona' => $datos->idPersona,
                'tupper' => $datos->tupper,
                'dia' => $fecha->format('Y-m-d')
            );

            return BD::actualizar($sql, $params);
        }

        /**
         * Elimina definitivamente la cuenta de un padre y limpia referencias.
         * - Para cada hijo con idPadreAlta = padre:
         *     * si tiene otros padres activos -> reasigna idPadreAlta a uno de ellos
         *     * si no tiene otros padres -> elimina Hijo_Padre, Dias del hijo y Persona del hijo
         * - Elimina relaciones Hijo_Padre del padre, Dias con idPadre y Persona del padre
         *
         * @param int $idPadre
         * @throws Exception
         */
        public static function eliminarPadreDefinitivo($idPadre) {
            if (!BD::iniciarTransaccion()) {
                throw new Exception('No es posible iniciar la transacción.');
            }

            try {
                // 1) Obtener hijos cuyo idPadreAlta es este padre
                $sql = 'SELECT id FROM Hijo WHERE idPadreAlta = :idPadre';
                $hijos = BD::seleccionar($sql, array('idPadre' => $idPadre));

                foreach ($hijos as $h) {
                    $idHijo = (int)$h['id'];

                    // Buscar otros padres activos para este hijo
                    $sql = 'SELECT idPadre FROM Hijo_Padre WHERE idHijo = :idHijo AND idPadre != :idPadre AND activo = 1';
                    $otros = BD::seleccionar($sql, array('idHijo' => $idHijo, 'idPadre' => $idPadre));

                    if (!empty($otros)) {
                        // Reasignar idPadreAlta al primer padre encontrado
                        $nuevoPadre = (int)$otros[0]['idPadre'];
                        $sqlUpd = 'UPDATE Hijo SET idPadreAlta = :nuevoPadre WHERE id = :idHijo';
                        BD::actualizar($sqlUpd, array('nuevoPadre' => $nuevoPadre, 'idHijo' => $idHijo));
                    } else {
                        // No hay otros padres: eliminar hijo totalmente
                        BD::borrar('DELETE FROM Hijo_Padre WHERE idHijo = :idHijo', array('idHijo' => $idHijo));
                        BD::borrar('DELETE FROM Dias WHERE idPersona = :idHijo', array('idHijo' => $idHijo));
                        BD::borrar('DELETE FROM Persona WHERE id = :idHijo', array('idHijo' => $idHijo));
                    }
                }

                // 2) Eliminar relaciones padre-hijo para este padre
                BD::borrar('DELETE FROM Hijo_Padre WHERE idPadre = :idPadre', array('idPadre' => $idPadre));

                // 3) Eliminar entradas de Dias asociadas al padre (opcional, evita restos)
                BD::borrar('DELETE FROM Dias WHERE idPadre = :idPadre', array('idPadre' => $idPadre));

                // 4) Eliminar la Persona del padre (cascade eliminará Padre y Usuario)
                BD::borrar('DELETE FROM Persona WHERE id = :idPadre', array('idPadre' => $idPadre));

                if (!BD::commit()) {
                    throw new Exception('No se pudo confirmar la transacción.');
                }

                return true;
            } catch (Exception $e) {
                if (method_exists('BD', 'rollBack')) BD::rollBack();
                throw $e;
            }
        }

        public static function obtenerUsuariosPorAnio($anio) {
            $sql = "SELECT 
                        p.id, 
                        p.nombre, 
                        p.apellidos,
                        COUNT(d.dia) AS numeroMenus  
                    FROM Persona p
                    JOIN Dias d ON p.id = d.idPersona
                    WHERE YEAR(d.dia) = :anio
                    GROUP BY p.id, p.nombre, p.apellidos 
                    ORDER BY p.apellidos, p.nombre";
        
            $params = array('anio' => $anio);
            
            // Asumiendo que BD::seleccionar devuelve un array de objetos/arrays
            return BD::seleccionar($sql, $params); 
        }

        // DAOUsuario.php
// ...

        /**
         * Obtiene las fechas de asistencia de un alumno para un año, organizado por mes.
         * También obtiene el nombre y apellidos.
         * @param {string|number} id ID de la persona.
         * @param {number} anio Año a consultar.
         * @return {Array<Object>} Lista de fechas de asistencia y datos del alumno.
         */
        public static function obtenerDetalleAsistenciaAnual($id, $anio) {
            $sql = "
                SELECT 
                    p.nombre AS nombreAlumno,
                    p.apellidos AS apellidosAlumno,
                    MONTH(d.dia) AS mes,
                    COUNT(d.idPersona) AS diasAsistidos,
                    pr.precioDiario,
                    (COUNT(d.idPersona) * pr.precioDiario) AS totalMes
                FROM Persona p
                JOIN Dias d ON p.id = d.idPersona
                JOIN Precios pr ON pr.idPrecio = 2
                WHERE p.id = :id
                AND YEAR(d.dia) = :anio
                GROUP BY mes
                ORDER BY mes ASC
            ";
        
            $params = array(
                'id' => $id,
                'anio' => $anio
            );
        
            return BD::seleccionar($sql, $params);
        }


        
    }
?>
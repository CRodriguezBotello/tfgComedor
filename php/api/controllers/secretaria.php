<?php
    require_once(dirname(__DIR__) . '/daos/daousuario.php');

    /**
     * Controlador de secretaría.
     */
    class Secretaria {





        public function post($pathParams, $queryParams, $body, $usuario) {
            
            // ⚠️ La función ini_set debe estar fuera de la clase si quieres que tenga efecto en la ejecución del script.
            // La he movido dentro de generarCertificado, pero si sigue fallando, prueba a ponerla al inicio del archivo.

            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            $accion = $pathParams[0] ?? null;

            if ($accion === 'generarCertificado') {
                
                $id = $body->id ?? null;
                $anio = $body->anio ?? null;

                if (!$id || !$anio) {
                    header('HTTP/1.1 400 Bad Request');
                    echo json_encode(['ok' => false, 'error' => 'Faltan parámetros (id o anio)']);
                    die();
                }

                $this->generarCertificado($id, $anio);
                // La función generarCertificado ahora maneja su propia respuesta HTTP y die()
                return; 
            }

            header('HTTP/1.1 501 Not Implemented');
            echo json_encode(['ok' => false, 'error' => 'Acción POST de Secretaría no implementada: ' . $accion]);
            die();
        }

       // ----------------------------------------------------
        // LÓGICA DE GENERACIÓN DEL PDF (CORREGIDA Y COMPROBADA)
        // ----------------------------------------------------
        private function generarCertificado($id, $anio) {
            
            // ⚠️ 1. Desactivar la visualización de errores y warnings para evitar la corrupción del PDF
            ini_set('display_errors', 0);
            error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING); 

            try {
                // 1. Obtener datos del DAO
                $detalle = DAOUsuario::obtenerDetalleAsistenciaAnual($id, $anio);
                
                if (empty($detalle)) {
                    header('Content-Type: application/json');
                    header('HTTP/1.1 404 Not Found');
                    echo json_encode(['ok' => false, 'error' => 'No hay asistencias registradas para ese año.']);
                    die();
                }

                // 2. Procesar datos
                // 💡 CORRECCIÓN: Aseguramos que la variable del nombre contenga los datos
                $nombreAlumno = $detalle[0]->nombre . ' ' . $detalle[0]->apellidos;
                $asistenciasPorMes = [];

                foreach ($detalle as $registro) {
                    $mes = (int)$registro->mes;
                    if (!isset($asistenciasPorMes[$mes])) {
                        $asistenciasPorMes[$mes] = [
                            'dias' => 0,
                            'fechas' => []
                        ];
                    }
                    $asistenciasPorMes[$mes]['dias']++;
                    $asistenciasPorMes[$mes]['fechas'][] = $registro->fecha;
                }

                // --- INICIO TCPDF ---
                // 3. Generar el PDF

                // Asegurarnos de que la librería TCPDF está cargada
                $tcpdfPath = __DIR__ . '/../../../vendor/tecnickcom/tcpdf/tcpdf.php';
                if (file_exists($tcpdfPath)) {
                    require_once $tcpdfPath;
                }
                if (!class_exists('TCPDF')) {
                    throw new Exception('Clase TCPDF no encontrada. Comprueba que la dependencia está instalada en vendor/tecnickcom/tcpdf.');
                }

                // Instancia de TCPDF
                $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
                $pdf->SetAutoPageBreak(TRUE, 10);
                $pdf->AddPage();
                
                // Contenido del PDF
                $pdf->SetFont('helvetica', 'B', 16);
                $pdf->Cell(0, 10, utf8_decode('CERTIFICADO ANUAL DE ASISTENCIA'), 0, 1, 'C');
                
                $pdf->SetFont('helvetica', '', 12);
                
                // 💡 CORRECCIÓN 1 (Nombre): Se usa la concatenación para asegurar que el nombre se decodifique e imprima correctamente.
                $pdf->Cell(0, 10, utf8_decode("Se certifica que el alumno: ") . utf8_decode($nombreAlumno), 0, 1);
                $pdf->Cell(0, 10, utf8_decode("Asistencia al comedor durante el año: $anio"), 0, 1);
                $pdf->Ln(5);

                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->Cell(40, 7, 'Mes', 1);
                $pdf->Cell(20, 7, 'Dias', 1);
                $pdf->Cell(0, 7, 'Fechas de Asistencia', 1, 1);
                
                $pdf->SetFont('helvetica', '', 10);
                
                $nombresMeses = [1 => 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

                foreach ($asistenciasPorMes as $mesNum => $data) {
                    $nombreMes = $nombresMeses[$mesNum];
                    
                    $fechasStr = implode(', ', array_map(function($f) {
                        // 💡 CORRECCIÓN 2 (Fechas): Usamos 'd/m' para mostrar Día/Mes (ej: 26/11)
                        return date('d/m', strtotime($f)); 
                    }, $data['fechas']));
                    
                    $pdf->Cell(40, 7, utf8_decode($nombreMes), 1);
                    $pdf->Cell(20, 7, $data['dias'], 1);
                    
                    // Usamos MultiCell para que las fechas largas no desborden la celda
                    $pdf->MultiCell(0, 7, $fechasStr, 1, 'L', false);
                }
                
                // --- FIN TCPDF ---

                // 4. Configurar la ruta de guardado (RUTA FÍSICA)
                $filename = "Certificado-{$id}-{$anio}.pdf";

                // Calculamos la carpeta php/ desde el controlador ubicado en php/api/controllers/
                $phpDir = dirname(dirname(__DIR__)); // .../php
                $certDir = $phpDir . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'certificates';

                // Crear el directorio si no existe
                if (!is_dir($certDir)) {
                    mkdir($certDir, 0775, true);
                }

                $filepath = $certDir . DIRECTORY_SEPARATOR . $filename;

                // 5. GUARDAR EL ARCHIVO DIRECTAMENTE con 'F' (File)
                $pdf->Output($filepath, 'F'); 

                // 6. COMPROBACIÓN de ÉXITO
                if (!file_exists($filepath) || filesize($filepath) < 100) { 
                    throw new Exception("El archivo PDF se generó, pero parece estar vacío o dañado en el disco.");
                }

                // 7. Devolver la URL pública como JSON (RUTA WEB)
                // Construimos la URL relativa basada en el SCRIPT_NAME para no hardcodear el nombre del proyecto
                $scriptDir = dirname(dirname($_SERVER['SCRIPT_NAME'])); // por ejemplo: /Comedor20-11-2025/php
                $publicUrl = rtrim($scriptDir, '/') . '/public/certificates/' . $filename;

                header('Content-Type: application/json');
                header('HTTP/1.1 200 OK');
                echo json_encode(['ok' => true, 'url' => $publicUrl]);

            } catch (Throwable $e) {
                // Manejo de errores de PDF o archivo
                error_log("Error generando certificado PDF: " . $e->getMessage());
                header('Content-Type: application/json');
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['ok' => false, 'error' => 'Error interno al generar el PDF: ' . $e->getMessage()]);
            }
            die(); // Detener la ejecución
        }

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

                    case 'desactivarPadre':
                        // $datos viene como stdClass { id: ... }
                        $idPersona = isset($datos->id) ? (int)$datos->id : null;
                        if (!$idPersona) {
                            header('HTTP/1.1 400 Bad Request');
                            echo json_encode(['error' => 'ID de padre no proporcionado']);
                            die();
                        }
                        // Llamamos al DAO para actualizar la tabla Persona
                        DAOUsuario::desactivarPadre($idPersona);
                        header('HTTP/1.1 200 OK');
                        echo json_encode(['mensaje' => "Persona con ID $idPersona desactivada"]);
                        die();
                        break;

                    case 'reactivarPadre':
                        $idPersona = isset($datos->id) ? (int)$datos->id : null;
                        if (!$idPersona) {
                            header('HTTP/1.1 400 Bad Request');
                            echo json_encode(['error' => 'ID de padre no proporcionado']);
                            die();
                        }
                        DAOUsuario::reactivarPadre($idPersona);
                        header('HTTP/1.1 200 OK');
                        echo json_encode(['mensaje' => "Persona con ID $idPersona reactivada"]);
                        die();
                        break;

                    case 'eliminarPadre':
                        $idPersona = isset($datos->id) ? (int)$datos->id : null;
                        if (!$idPersona) {
                            header('HTTP/1.1 400 Bad Request');
                            echo json_encode(['error' => 'ID de padre no proporcionado']);
                            die();
                        }
                        DAOUsuario::eliminarPadre($idPersona);
                        header('HTTP/1.1 200 OK');
                        echo json_encode(['mensaje' => "Persona con ID $idPersona eliminada definitivamente"]);
                        die();
                        break;

                    case 'incidencia':
                        DAOUsuario::insertarIncidencia($datos);
                        header('HTTP/1.1 200 OK');
                        break;

                    case 'actualizarMandato':
                        $idPersona = isset($datos->id) ? (int)$datos->id : null;
                        $fecha = isset($datos->fecha) ? $datos->fecha : null;

                        if (!$idPersona || !$fecha) {
                            header('HTTP/1.1 400 Bad Request');
                            echo json_encode(['error' => 'ID o fecha no proporcionados']);
                            die();
                        }

                        DAOUsuario::actualizarFechaMandato($idPersona, $fecha);
                        header('HTTP/1.1 200 OK');
                        echo json_encode(['mensaje' => "Fecha de mandato actualizada para ID $idPersona"]);
                        die();

                        
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

                    case 'padresDesactivados':
                        $this->obtenerListadoPadresDesactivados();
                        break;
                        
                    case 'tupper':
                        $this->obtenerTupper($queryParams['fecha']);
                        break;

                    case 'q19':
                        // Pasar también el array de query params para poder atender idPersona (Q19 individual)
                        $this->obtenerQ19($queryParams['mes'], $queryParams);
                        break;

                    case 'usuariosAnual':
                        $anio = isset($queryParams['anio']) ? intval($queryParams['anio']) : date('Y');
                        $this->obtenerUsuariosAnual($anio);
                        break;

                    case 'desactivarPadre':
                        // No hace falta hacer nada aquí, el proceso se realiza en PUT.
                        header('HTTP/1.1 200 OK');
                        die();
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

        function obtenerListadoPadresDesactivados() {
            $padres = DAOUsuario::obtenerListadoPadresDesactivados();
            header('Content-type: application/json; charset=utf-8');
            echo json_encode($padres);
            die();
        }

        /**
         * Obtener Q19 de un mes.
         * @param string $mes Mes.
         */
        function obtenerQ19($mes, $queryParams = []) {
            // Si se solicita un idPersona específico devolvemos la remesa individual para ese hijo
            if (is_array($queryParams) && isset($queryParams['idPersona']) && $queryParams['idPersona']) {
                $idHijo = intval($queryParams['idPersona']);
                $q19 = DAOUsuario::obtenerQ19PorHijo($mes, $idHijo);
            } else {
                $q19 = DAOUsuario::obtenerQ19($mes);
            }

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

        function desactivarPadre($idPadre) {
            DAOUsuario::desactivarPadre($idPadre);
            header('HTTP/1.1 200 OK');
            die();
        }

        function obtenerUsuariosAnual($anio) {
            $usuarios = DAOUsuario::obtenerUsuariosPorAnio($anio);
            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 200 OK');
            echo json_encode($usuarios);
            die();
        }
    }
?>
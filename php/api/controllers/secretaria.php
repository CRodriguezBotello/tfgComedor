<?php
    require_once(dirname(__DIR__) . '/daos/daousuario.php');

    /**
     * Controlador de secretaría.
     */
    class Secretaria {
        public function post($pathParams, $queryParams, $body, $usuario) {
            
            // La función ini_set debe estar fuera de la clase si quieres que tenga efecto en la ejecución del script.
            // La he movido dentro de generarCertificado, pero si sigue fallando, prueba a ponerla al inicio del archivo.

            if (!$usuario) {
                header('HTTP/1.1 401 Unauthorized');
                die();
            }

            $accion = $pathParams[0] ?? null;

            if ($accion === 'generarCertificado') {
                
                $id = $body->id ?? null;
                $anio = $body->anio ?? null;
                $anioSig = $body->anioSig ?? null;

                if (!$id || !$anio || !$anioSig) {
                    header('HTTP/1.1 400 Bad Request');
                    echo json_encode(['ok' => false, 'error' => 'Faltan parámetros (id, anio o anioSig)']);
                    die();
                }

                $this->generarCertificado($id, $anio, $anioSig);
                // La función generarCertificado ahora maneja su propia respuesta HTTP y die()
                return; 
            }

            header('HTTP/1.1 501 Not Implemented');
            echo json_encode(['ok' => false, 'error' => 'Acción POST de Secretaría no implementada: ' . $accion]);
            die();
        }

// ----------------------------------------------------
// LÓGICA DE GENERACIÓN DEL PDF (MILIMÉTRICA + CAMPOS RELLENABLES)
// ----------------------------------------------------
private function generarCertificado($id, $anio, $anioSig)
{
    ini_set('display_errors', 0);
    error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

    try {
        // Obtener datos agregados
        $detalle = DAOUsuario::obtenerDetalleAsistenciaAnual($id, $anio, $anioSig);

        if (empty($detalle)) {
            header('HTTP/1.1 404 Not Found');
            echo json_encode(['ok' => false, 'error' => 'No hay datos para ese año.']);
            die();
        }

        // Datos del alumno
        $primer = $detalle[0];
        $nombre = is_array($primer) ? $primer['nombreAlumno'] : $primer->nombreAlumno;
        $apellidos = is_array($primer) ? $primer['apellidosAlumno'] : $primer->apellidosAlumno;
        $nombreCompleto = trim("$nombre $apellidos");
        $anioSig = intval($anio) + 1;

        // TCPDF
        if (!class_exists('TCPDF')) {
            require_once dirname(__DIR__,3)."/vendor/tecnickcom/tcpdf/tcpdf.php";
        }

        $pdf = new TCPDF('P','mm','A4',true,'UTF-8',false);
        $pdf->SetAutoPageBreak(true, 15);
        $pdf->AddPage();

        // --------------------------------------------------------
        // LOGO ARRIBA IZQUIERDA
        // --------------------------------------------------------
        $logoPath = dirname(__DIR__) . "/public/logo.png";
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, 10, 10, 32, 0);
        }

        // --------------------------------------------------------
        // TÍTULO
        // --------------------------------------------------------
        $pdf->SetFont('helvetica','B',20);
        $pdf->SetXY(0, 25);
        $pdf->Cell(0, 35, "CERTIFICADO DE ASISTENCIA COMEDOR", 0, 1, 'C');

        $pdf->Ln(10);

        // --------------------------------------------------------
        // DATOS FIJOS DEL ALUMNO
        // --------------------------------------------------------
        $pdf->SetFont('helvetica','',12);
        $pdf->Write(0, "Alumno/a: ");
        $pdf->SetFont('helvetica','B',12);
        $pdf->Write(0, utf8_decode($nombreCompleto));
        $pdf->Ln(8);

        $pdf->SetFont('helvetica','',12);
        $pdf->Write(0, "Curso escolar: ");
        $pdf->SetFont('helvetica','B',12);
        $pdf->Write(0, "$anio - $anioSig");
        $pdf->Ln(12);

        // --------------------------------------------------------
        // CAMPOS RELLENABLES (sin borde azul feo)
        // --------------------------------------------------------
        $pdf->setFormDefaultProp([
            'lineWidth' => 0,
            'borderStyle' => 'none',
            'fillColor' => [255, 255, 255],
            'strokeColor' => [255, 255, 255]
        ]);

        $pdf->SetFont('helvetica','',11);

        $pdf->Write(0, "DNI del alumno/a: ");
        $pdf->TextField('dni', 62, 6);
        $pdf->Ln(9);

        $pdf->Write(0, "Número de Identificación Escolar: ");
        $pdf->TextField('nie', 62, 6);
        $pdf->Ln(9);

        // --------------------------------------------------------
        // TABLA
        // --------------------------------------------------------
        $pdf->SetFont('helvetica','B',13);
        $pdf->Cell(0, 10, "Resumen mensual de asistencia y costes", 0, 1, 'L');

        $pdf->SetFont('helvetica','B',11);
        $pdf->Cell(70, 8, "Mes", 1, 0, 'C');
        $pdf->Cell(40, 8, "Días asistidos", 1, 0, 'C');
        $pdf->Cell(60, 8, "Coste mensual (€)", 1, 1, 'C');

        $pdf->SetFont('helvetica','',10);

        $totalAnual = 0;

        foreach ($detalle as $r) {
            $mes = is_array($r) ? intval($r['mes']) : intval($r->mes);
            $dias = is_array($r) ? intval($r['diasAsistidos']) : intval($r->diasAsistidos);
            $precio = floatval(is_array($r) ? $r['precioDiario'] : $r->precioDiario);
            $tuppers = intval(is_array($r) ? ($r['tupperMensual'] ?? 0) : ($r->tupperMensual ?? 0));
            $precioTupper = floatval(is_array($r) ? ($r['precioTupper'] ?? 0) : ($r->precioTupper ?? 0));

            // total mensual = precio diario * dias + precio tupper * nº tuppers
            $totalMes = ($precio * $dias) + ($precioTupper * $tuppers);
            $totalAnual += $totalMes;

            $nombreMes = $this->getNombreMes($mes);
            $pdf->Cell(70, 8, utf8_decode($nombreMes . " " . intval($anio)), 1, 0, 'L');
            $pdf->Cell(40, 8, $dias . ($tuppers ? " (t:$tuppers)" : ''), 1, 0, 'C');
            $pdf->Cell(60, 8, number_format($totalMes, 2), 1, 1, 'C');
        }

        // --------------------------------------------------------
        // TOTAL ANUAL
        // --------------------------------------------------------
        $pdf->Ln(5);
        $pdf->SetFont('helvetica','B',12);
        $pdf->Cell(165, 8, "TOTAL ANUAL: " . number_format($totalAnual, 2) . " €", 0, 1, 'R');

        // --------------------------------------------------------
        // FIRMA
        // --------------------------------------------------------
        $pdf->Ln(15);

        $pdf->SetFont('helvetica','',11);
        $pdf->Write(0, "Firma del responsable: ");
        $pdf->Ln(12);

        // --------------------------------------------------------
        // GUARDAR PDF
        // --------------------------------------------------------
        $clean = preg_replace('/[^a-zA-Z0-9\s-]/','', $nombreCompleto);
        $clean = trim(str_replace(' ','-', $clean));
        if ($clean == '') $clean = "Alumno-$id";

        $filename = "Certificado-$clean.pdf";
        $filepath = dirname(__DIR__) . "/public/certificates/$filename";

        if (!is_dir(dirname($filepath))) mkdir(dirname($filepath), 0775, true);

        $pdf->Output($filepath, 'F');

        // URL pública
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');

        $publicUrl = "$scheme://$host$scriptDir/public/certificates/$filename";

        header('Content-Type: application/json');
        echo json_encode(['ok' => true, 'url' => $publicUrl]);

    } catch (Throwable $e) {
        error_log("Error generando PDF: ".$e->getMessage());
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['ok' => false, 'error' => "Error interno: ".$e->getMessage()]);
    }
    die();
}



        /**
         * Devuelve el nombre del mes en español a partir de su número (1-12).
         * @param int $mes Número de mes (1-12).
         * @return string Nombre del mes en español.
         */
        private function getNombreMes(int $mes) {
            $meses = [
                1 => 'Enero',
                2 => 'Febrero',
                3 => 'Marzo',
                4 => 'Abril',
                5 => 'Mayo',
                6 => 'Junio',
                7 => 'Julio',
                8 => 'Agosto',
                9 => 'Septiembre',
                10 => 'Octubre',
                11 => 'Noviembre',
                12 => 'Diciembre'
            ];
            return $meses[$mes] ?? 'Mes desconocido';
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

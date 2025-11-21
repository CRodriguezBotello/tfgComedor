<?php
require_once(dirname(__DIR__) . '/daos/daofestivos.php');

/**
 * Controlador de días festivos.
 */
class Festivos {
    /**
     * Sacar los días festivos.
     * @param array $pathParams No utilizado.
     * @param array $queryParams Puede recibir 'inicio' y 'final' en formato YYYY-MM-DD.
     * @param object $usuario Usuario que realiza el proceso. Si no hay usuario y no se pasa ?public=1 responde 401.
     */
    function get($pathParams, $queryParams, $usuario) {
        // Permitir acceso en desarrollo si se solicita explícitamente: ?public=1
        $public = isset($queryParams['public']) && ($queryParams['public'] == '1' || $queryParams['public'] === true);

        if (!$usuario && !$public) {
            header('HTTP/1.1 401 Unauthorized');
            die();
        }

        // Si se proporcionan fechas las usamos; si no, pedimos todos los festivos
        if (isset($queryParams['inicio']) && isset($queryParams['final'])) {
            try {
                $fechaInicio = (new DateTime($queryParams['inicio']))->format('Y-m-d');
                $fechaFinal  = (new DateTime($queryParams['final']))->format('Y-m-d');
            } catch (Exception $e) {
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['error' => 'Formato de fecha inválido']);
                die();
            }
        } else {
            // Rango amplio para devolver todos los registros
            $fechaInicio = '1900-01-01';
            $fechaFinal  = '9999-12-31';
        }

        $festivos = DAOFestivos::obtenerFestivos($fechaInicio, $fechaFinal);

        header('Content-type: application/json; charset=utf-8');
        header('HTTP/1.1 200 OK');
        echo json_encode($festivos);
        die();
    }

    /**
     * Crear festivo (POST)
     */
    function post($pathParams, $queryParams, $usuario) {
        $public = isset($queryParams['public']) && ($queryParams['public'] == '1' || $queryParams['public'] === true);
        if (!$usuario && !$public) {
            header('HTTP/1.1 401 Unauthorized');
            echo json_encode(['error' => 'No autorizado']);
            die();
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'JSON inválido']);
            die();
        }

        // permitir también acción borrarTodos vía POST si viene action=borrarTodos
        if (isset($data['borrarTodos']) || (isset($queryParams['action']) && $queryParams['action'] === 'borrarTodos')) {
            try {
                $res = DAOFestivos::borrarTodosFestivos();
                header('Content-type: application/json; charset=utf-8');
                echo json_encode(['ok' => true, 'borrados' => $res]);
                die();
            } catch (Exception $e) {
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['error' => $e->getMessage()]);
                die();
            }
        }

        if (empty($data['fecha'])) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Falta campo fecha']);
            die();
        }

        try {
            $fecha = (new DateTime($data['fecha']))->format('Y-m-d');
        } catch (Exception $e) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Fecha inválida (YYYY-MM-DD)']);
            die();
        }

        // tomar definicion si viene
        $definicion = isset($data['definicion']) ? $data['definicion'] : (isset($data['descripcion']) ? $data['descripcion'] : '');

        try {
            $id = DAOFestivos::crearFestivo($fecha, $definicion);
            header('Content-type: application/json; charset=utf-8');
            header('HTTP/1.1 201 Created');
            echo json_encode(['ok' => true, 'fecha' => $fecha, 'id' => $id, 'definicion' => $definicion]);
            die();
        } catch (Exception $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode(['error' => $e->getMessage()]);
            die();
        }
    }

    /**
     * Actualizar festivo (PUT)
     */
    function put($pathParams, $queryParams, $usuario) {
        $public = isset($queryParams['public']) && ($queryParams['public'] == '1' || $queryParams['public'] === true);
        if (!$usuario && !$public) {
            header('HTTP/1.1 401 Unauthorized');
            echo json_encode(['error' => 'No autorizado']);
            die();
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data) || empty($data['oldFecha']) || empty($data['fecha'])) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Se requieren oldFecha y fecha']);
            die();
        }

        try {
            $old = (new DateTime($data['oldFecha']))->format('Y-m-d');
            $new = (new DateTime($data['fecha']))->format('Y-m-d');
        } catch (Exception $e) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Formato de fecha inválido']);
            die();
        }

        // definicion puede venir (cadena vacía para borrar descripción) o no venir (null = no tocar)
        $definicion = array_key_exists('definicion', $data) ? $data['definicion'] : null;

        try {
            $ok = DAOFestivos::actualizarFestivo($old, $new, $definicion);
            header('Content-type: application/json; charset=utf-8');
            echo json_encode(['ok' => (bool)$ok, 'old' => $old, 'new' => $new]);
            die();
        } catch (Exception $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode(['error' => $e->getMessage()]);
            die();
        }
    }

    /**
     * Borrar festivo (DELETE)
     */
    function delete($pathParams, $queryParams, $usuario) {
        $public = isset($queryParams['public']) && ($queryParams['public'] == '1' || $queryParams['public'] === true);
        if (!$usuario && !$public) {
            header('HTTP/1.1 401 Unauthorized');
            echo json_encode(['error' => 'No autorizado']);
            die();
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data) || empty($data['fecha'])) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Se requiere campo fecha']);
            die();
        }

        try {
            $fecha = (new DateTime($data['fecha']))->format('Y-m-d');
        } catch (Exception $e) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Formato de fecha inválido']);
            die();
        }

        try {
            $ok = DAOFestivos::borrarFestivo($fecha);
            header('Content-type: application/json; charset=utf-8');
            echo json_encode(['ok' => (bool)$ok, 'fecha' => $fecha]);
            die();
        } catch (Exception $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode(['error' => $e->getMessage()]);
            die();
        }
    }
}
?>
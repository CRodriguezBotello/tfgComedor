<?php

header('Content-Type: application/json; charset=utf-8');

// Ruta real a la carpeta 'menus' en la raíz del proyecto
$menusDir = realpath(__DIR__ . '/../../../menus');
if ($menusDir === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Directorio menus no encontrado']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {
    case 'list':
        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $filename = $menusDir . DIRECTORY_SEPARATOR . "menu_{$m}.pdf";
            $result[$m] = is_file($filename) ? '/hugo/Comedor11-11-2025/menus/' . basename($filename) : null;
        }
        echo json_encode($result);
        break;

    case 'upload':
        $month = isset($_POST['month']) ? intval($_POST['month']) : 0;
        if ($month < 1 || $month > 12) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Mes inválido']);
            exit;
        }
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Fichero no enviado o error en upload']);
            exit;
        }
        $f = $_FILES['file'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $f['tmp_name']);
        finfo_close($finfo);
        if ($mime !== 'application/pdf') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Solo PDF permitido', 'mime' => $mime]);
            exit;
        }
        $target = $menusDir . DIRECTORY_SEPARATOR . "menu_{$month}.pdf";
        if (!is_dir($menusDir) || !is_writable($menusDir)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'No es posible escribir en carpeta menus']);
            exit;
        }
        if (!move_uploaded_file($f['tmp_name'], $target)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Error al mover fichero']);
            exit;
        }
        echo json_encode(['ok' => true, 'file' => '/hugo/Comedor11-11-2025/menus/' . basename($target)]);
        break;

    case 'delete':
        $data = json_decode(file_get_contents('php://input'), true);
        $month = isset($data['month']) ? intval($data['month']) : (isset($_POST['month']) ? intval($_POST['month']) : 0);
        if ($month < 1 || $month > 12) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Mes inválido']);
            exit;
        }
        $file = $menusDir . DIRECTORY_SEPARATOR . "menu_{$month}.pdf";
        if (is_file($file)) {
            if (!@unlink($file)) {
                http_response_code(500);
                echo json_encode(['ok' => false, 'error' => 'No se pudo borrar fichero']);
                exit;
            }
            echo json_encode(['ok' => true]);
        } else {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Fichero no encontrado']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Acción inválida']);
        break;
}
?>
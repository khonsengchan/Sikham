<?php
// api/settings.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

$action = $_GET['action'] ?? '';

// GET ALL SETTINGS
if ($action === 'get') {
    $res = $conn->query("SELECT setting_key, setting_value FROM settings");
    $settings = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
    }
    echo json_encode(['success' => true, 'data' => $settings]);
    exit;
}

// SAVE SETTINGS (Admin only)
if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'ສະຫງວນສິດສຳລັບ Admin ເທົ່ານັ້ນ']); exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    file_put_contents('debug.txt', print_r($_POST, true) . print_r($input, true));

    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    
    $successCount = 0;
    foreach ($input as $key => $val) {
        if ($key === 'action' || $key === 'user_id') continue;
        $stmt->bind_param('ss', $key, $val);
        if ($stmt->execute()) {
            $successCount++;
        }
    }

    echo json_encode(['success' => true, 'updated' => $successCount]);
    exit;
}

echo json_encode(['error' => 'Unknown action']);

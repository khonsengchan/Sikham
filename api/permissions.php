<?php
// api/permissions.php - Staff Permission Management
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    echo json_encode(['error' => 'Unauthorized']); exit;
}

$action = $_GET['action'] ?? '';

// ─── GET PERMISSIONS for a user ──────────────────────────────
function normalize_permissions($row) {
    $pages = ['dashboard','students','staff','classes','attendance','assessments','scores',
              'finance','transport','meals','health','communication','calendar','schedule',
              'inventory','reports','settings'];
    foreach ($pages as $p) {
        if (!array_key_exists($p, $row)) {
            $row[$p] = 'none';
        }
    }
    return $row;
}

if ($action === 'get') {
    $uid = intval($_GET['user_id'] ?? 0);
    if (!$uid) { echo json_encode(['error' => 'Missing user_id']); exit; }

    $stmt = $conn->prepare("SELECT * FROM user_permissions WHERE user_id = ? LIMIT 1");
    $stmt->bind_param('i', $uid);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        // Return default (all none)
        echo json_encode(['user_id' => $uid]);
    } else {
        echo json_encode(normalize_permissions($row));
    }
    exit;
}

// ─── SAVE PERMISSIONS (admin only) ───────────────────────────
if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Only admin can set permissions
    if ($_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'ສະຫງວນສິດສຳລັບ Admin ເທົ່ານັ້ນ']); exit;
    }

    $uid = intval($_POST['user_id'] ?? 0);
    if (!$uid) { echo json_encode(['success' => false, 'error' => 'Missing user_id']); exit; }

    // All permission columns
    $pages = ['dashboard','students','staff','classes','attendance','assessments','scores',
              'finance','transport','meals','health','communication','calendar','schedule',
              'inventory','reports','settings'];

    $cols = []; $vals = []; $types = ''; $params = [$uid];
    foreach ($pages as $p) {
        $v = $_POST[$p] ?? 'none';
        // Validate value
        if (!in_array($v, ['full','readonly','limited','none'])) $v = 'none';
        $cols[] = "`$p` = ?";
        $vals[] = $v;
        $types .= 's';
    }

    // Check if row exists
    $c = $conn->prepare("SELECT user_id FROM user_permissions WHERE user_id = ?");
    $c->bind_param('i', $uid);
    $c->execute();
    $exists = $c->get_result()->fetch_assoc();

    if ($exists) {
        $sql = "UPDATE user_permissions SET " . implode(', ', $cols) . " WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $bindParams = array_merge([$types . 'i'], $vals, [$uid]);
    } else {
        $colNames = implode(',', array_map(fn($p) => "`$p`", $pages));
        $placeholders = implode(',', array_fill(0, count($pages), '?'));
        $sql = "INSERT INTO user_permissions (user_id, $colNames) VALUES (?, $placeholders)";
        $stmt = $conn->prepare($sql);
        $bindParams = array_merge(['i' . $types], [$uid], $vals);
    }

    // Bind params dynamically
    $stmt->bind_param(...$bindParams);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit;
}

// ─── GET MY OWN PERMISSIONS (for current user) ────────────────
if ($action === 'mine') {
    $uid = $_SESSION['user_id'] ?? 0;
    $role = $_SESSION['role'] ?? 'staff';

    // admin & teacher use hardcoded PERMISSIONS in app.js
    if ($role !== 'staff') {
        echo json_encode(['role' => $role, 'use_default' => true]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM user_permissions WHERE user_id = ? LIMIT 1");
    $stmt->bind_param('i', $uid);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    echo json_encode(normalize_permissions($row ?: ['user_id' => $uid]));
    exit;
}

echo json_encode(['error' => 'Unknown action']);

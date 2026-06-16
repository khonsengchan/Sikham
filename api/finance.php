<?php
// api/finance.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    $type = $_GET['type'] ?? '';
    $status = $_GET['status'] ?? '';
    $sql = "SELECT f.*, s.full_name_lao as student_name, fc.name as category_name FROM finance_transactions f LEFT JOIN students s ON f.student_id=s.student_id LEFT JOIN finance_categories fc ON f.category_id=fc.cat_id WHERE 1=1";
    $params=[]; $types='';
    if ($type) { $sql.=" AND f.type=?"; $params[]=$type; $types.='s'; }
    if ($status) { $sql.=" AND f.status=?"; $params[]=$status; $types.='s'; }
    $sql .= " ORDER BY f.tx_id DESC LIMIT 100";
    $stmt=$conn->prepare($sql); if ($params) $stmt->bind_param($types,...$params); $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
} elseif ($action === 'summary') {
    $month = $_GET['month'] ?? date('Y-m');
    $income   = $conn->query("SELECT COALESCE(SUM(amount),0) t FROM finance_transactions WHERE type='income' AND status='paid'")->fetch_assoc()['t'];
    $expense  = $conn->query("SELECT COALESCE(SUM(amount),0) t FROM finance_transactions WHERE type='expense' AND status='paid'")->fetch_assoc()['t'];
    $pending  = $conn->query("SELECT COALESCE(SUM(amount),0) t FROM finance_transactions WHERE status='pending'")->fetch_assoc()['t'];
    $overdue  = $conn->query("SELECT COALESCE(SUM(amount),0) t FROM finance_transactions WHERE status='overdue'")->fetch_assoc()['t'];
    echo json_encode(['income'=>$income,'expense'=>$expense,'profit'=>$income-$expense,'pending'=>$pending,'overdue'=>$overdue]);
} elseif ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST;
    $id = intval($d['tx_id'] ?? 0);
    $title = $d['title'] ?? '';
    $amount = floatval($d['amount'] ?? 0);
    $type = $d['type'] ?? 'income';
    $status = $d['status'] ?? 'pending';
    
    $dueDate = !empty($d['due_date']) ? $d['due_date'] : null;
    $txDate = !empty($d['tx_date']) ? $d['tx_date'] : null;
    $studentId = !empty($d['student_id']) ? intval($d['student_id']) : null;
    $categoryId = !empty($d['category_id']) ? intval($d['category_id']) : null;
    $notes = $d['notes'] ?? '';

    if ($id) {
        $stmt = $conn->prepare("UPDATE finance_transactions SET title=?, amount=?, type=?, status=?, due_date=?, tx_date=?, student_id=?, category_id=?, notes=? WHERE tx_id=?");
        $stmt->bind_param('sdssssiisi', $title, $amount, $type, $status, $dueDate, $txDate, $studentId, $categoryId, $notes, $id);
    } else {
        $stmt = $conn->prepare("INSERT INTO finance_transactions (title, amount, type, status, due_date, tx_date, student_id, category_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('sdssssiis', $title, $amount, $type, $status, $dueDate, $txDate, $studentId, $categoryId, $notes);
    }
    
    if($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id=intval($_POST['tx_id']); $stmt=$conn->prepare("DELETE FROM finance_transactions WHERE tx_id=?"); $stmt->bind_param('i',$id); $stmt->execute();
    echo json_encode(['success'=>true]);
} elseif ($action === 'categories') {
    echo json_encode($conn->query("SELECT DISTINCT cat_id, type, name FROM finance_categories ORDER BY type, name")->fetch_all(MYSQLI_ASSOC));
}

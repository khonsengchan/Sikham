<?php
// api/attendance.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    $date = $_GET['date'] ?? date('Y-m-d');
    $class_id = intval($_GET['class_id'] ?? 0);
    $sql = "SELECT a.*, s.full_name_lao, s.student_code, c.class_name FROM attendance a 
            JOIN students s ON a.student_id=s.student_id
            LEFT JOIN classes c ON s.class_id=c.class_id
            WHERE a.att_date=?";
    $params = [$date]; $types = 's';
    if ($class_id) { $sql .= " AND s.class_id=?"; $params[]=$class_id; $types.='i'; }
    $stmt=$conn->prepare($sql); $stmt->bind_param($types,...$params); $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
} elseif ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST;
    $stmt=$conn->prepare("INSERT INTO attendance (student_id,att_date,status,notes) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),notes=VALUES(notes)");
    $stmt->bind_param('isss',$d['student_id'],$d['att_date'],$d['status'],$d['notes']);
    $stmt->execute(); echo json_encode(['success'=>true]);
} elseif ($action === 'today_summary') {
    $today = date('Y-m-d');
    $total = $conn->query("SELECT COUNT(*) c FROM students WHERE status='ກຳລັງຮຽນ'")->fetch_assoc()['c'];
    $present = $conn->query("SELECT COUNT(*) c FROM attendance WHERE att_date='$today' AND status='ມາຮຽນ'")->fetch_assoc()['c'];
    $absent  = $conn->query("SELECT COUNT(*) c FROM attendance WHERE att_date='$today' AND status='ຂາດຮຽນ'")->fetch_assoc()['c'];
    $late    = $conn->query("SELECT COUNT(*) c FROM attendance WHERE att_date='$today' AND status='ມາຊ້າ'")->fetch_assoc()['c'];
    $sick    = $conn->query("SELECT COUNT(*) c FROM attendance WHERE att_date='$today' AND status='ປ່ວຍ'")->fetch_assoc()['c'];
    echo json_encode(['total'=>$total,'present'=>$present,'absent'=>$absent,'late'=>$late,'sick'=>$sick]);
} elseif ($action === 'weekly') {
    $rows = $conn->query("SELECT att_date, status, COUNT(*) cnt FROM attendance WHERE att_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY att_date,status")->fetch_all(MYSQLI_ASSOC);
    echo json_encode($rows);
}

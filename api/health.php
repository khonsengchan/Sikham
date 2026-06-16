<?php
// api/health.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');

if (!is_logged_in()) { 
    echo json_encode(['error' => 'Unauthorized']); 
    exit; 
}

// Auto-provision tables if they don't exist
$conn->query("CREATE TABLE IF NOT EXISTS health_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY, 
    student_id INT, 
    allergy VARCHAR(100), 
    symptoms VARCHAR(255), 
    advice VARCHAR(255), 
    severity VARCHAR(20), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
)");
$conn->query("CREATE TABLE IF NOT EXISTS health_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY, 
    student_id INT, 
    visit_date DATE, 
    symptoms VARCHAR(255), 
    diagnosis VARCHAR(255), 
    treatment VARCHAR(255), 
    status VARCHAR(20), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
)");

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    $alerts = $conn->query("SELECT a.*, s.full_name_lao as student_name, s.student_code FROM health_alerts a JOIN students s ON a.student_id=s.student_id ORDER BY a.alert_id DESC")->fetch_all(MYSQLI_ASSOC);
    $records = $conn->query("SELECT r.*, s.full_name_lao as student_name FROM health_records r JOIN students s ON r.student_id=s.student_id ORDER BY r.visit_date DESC, r.record_id DESC LIMIT 100")->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode(['alerts' => $alerts, 'records' => $records]);
    
} elseif ($action === 'save_alert' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST;
    $id = intval($d['alert_id'] ?? 0);
    if ($id) {
        $stmt = $conn->prepare("UPDATE health_alerts SET student_id=?, allergy=?, symptoms=?, advice=?, severity=? WHERE alert_id=?");
        $stmt->bind_param('issssi', $d['student_id'], $d['allergy'], $d['symptoms'], $d['advice'], $d['severity'], $id);
    } else {
        $stmt = $conn->prepare("INSERT INTO health_alerts (student_id, allergy, symptoms, advice, severity) VALUES (?,?,?,?,?)");
        $stmt->bind_param('issss', $d['student_id'], $d['allergy'], $d['symptoms'], $d['advice'], $d['severity']);
    }
    if($stmt->execute()) echo json_encode(['success'=>true]);
    else echo json_encode(['success'=>false, 'error'=>$stmt->error]);
    
} elseif ($action === 'save_record' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST;
    $id = intval($d['record_id'] ?? 0);
    if ($id) {
        $stmt = $conn->prepare("UPDATE health_records SET student_id=?, visit_date=?, symptoms=?, diagnosis=?, treatment=?, status=? WHERE record_id=?");
        $stmt->bind_param('isssssi', $d['student_id'], $d['visit_date'], $d['symptoms'], $d['diagnosis'], $d['treatment'], $d['status'], $id);
    } else {
        $stmt = $conn->prepare("INSERT INTO health_records (student_id, visit_date, symptoms, diagnosis, treatment, status) VALUES (?,?,?,?,?,?)");
        $stmt->bind_param('isssss', $d['student_id'], $d['visit_date'], $d['symptoms'], $d['diagnosis'], $d['treatment'], $d['status']);
    }
    if($stmt->execute()) echo json_encode(['success'=>true]);
    else echo json_encode(['success'=>false, 'error'=>$stmt->error]);

} elseif ($action === 'delete_alert' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = intval($_POST['alert_id']);
    $stmt = $conn->prepare("DELETE FROM health_alerts WHERE alert_id=?"); $stmt->bind_param('i', $id); $stmt->execute();
    echo json_encode(['success'=>true]);
    
} elseif ($action === 'delete_record' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = intval($_POST['record_id']);
    $stmt = $conn->prepare("DELETE FROM health_records WHERE record_id=?"); $stmt->bind_param('i', $id); $stmt->execute();
    echo json_encode(['success'=>true]);
}

<?php
// api/classes.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    $sql = "SELECT c.*, s.full_name_lao as teacher_name,
            (SELECT COUNT(*) FROM students st WHERE st.class_id=c.class_id AND st.status='ກຳລັງຮຽນ') as student_count
            FROM classes c LEFT JOIN staff s ON c.mentor_teacher_id=s.staff_id ORDER BY c.class_id";
    echo json_encode($conn->query($sql)->fetch_all(MYSQLI_ASSOC));
} elseif ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST; $id = intval($d['class_id'] ?? 0);
    if ($id) {
        $stmt=$conn->prepare("UPDATE classes SET class_name=?,level=?,capacity=?,room_number=?,mentor_teacher_id=? WHERE class_id=?");
        $stmt->bind_param('ssissi',$d['class_name'],$d['level'],$d['capacity'],$d['room_number'],$d['mentor_teacher_id'],$id);
    } else {
        $stmt=$conn->prepare("INSERT INTO classes (class_name,level,capacity,room_number,mentor_teacher_id) VALUES (?,?,?,?,?)");
        $stmt->bind_param('ssiss',$d['class_name'],$d['level'],$d['capacity'],$d['room_number'],$d['mentor_teacher_id']);
    }
    $stmt->execute(); echo json_encode(['success'=>true]);
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id=intval($_POST['class_id']); $stmt=$conn->prepare("DELETE FROM classes WHERE class_id=?"); $stmt->bind_param('i',$id); $stmt->execute();
    echo json_encode(['success'=>true]);
}

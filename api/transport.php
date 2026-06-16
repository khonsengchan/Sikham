<?php
// api/transport.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }
$action = $_GET['action'] ?? 'list';
if ($action === 'list') {
    $sql = "SELECT v.*, (SELECT COUNT(*) FROM transport_students ts WHERE ts.vehicle_id=v.vehicle_id) as student_count FROM transport_vehicles v ORDER BY v.vehicle_id";
    echo json_encode($conn->query($sql)->fetch_all(MYSQLI_ASSOC));
} elseif ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d=$_POST; $id=intval($d['vehicle_id']??0);
    if ($id) {
        $stmt=$conn->prepare("UPDATE transport_vehicles SET vehicle_name=?,plate_number=?,type=?,capacity=?,driver_name=?,driver_phone=?,route_name=?,status=? WHERE vehicle_id=?");
        $stmt->bind_param('sssississi',$d['vehicle_name'],$d['plate_number'],$d['type'],$d['capacity'],$d['driver_name'],$d['driver_phone'],$d['route_name'],$d['status'],$id);
    } else {
        $stmt=$conn->prepare("INSERT INTO transport_vehicles (vehicle_name,plate_number,type,capacity,driver_name,driver_phone,route_name,status) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->bind_param('ssssisss',$d['vehicle_name'],$d['plate_number'],$d['type'],$d['capacity'],$d['driver_name'],$d['driver_phone'],$d['route_name'],$d['status']);
    }
    $stmt->execute(); echo json_encode(['success'=>true]);
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id=intval($_POST['vehicle_id']); $stmt=$conn->prepare("DELETE FROM transport_vehicles WHERE vehicle_id=?"); $stmt->bind_param('i',$id); $stmt->execute();
    echo json_encode(['success'=>true]);
}

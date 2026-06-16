<?php
// api/meals.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }
$action = $_GET['action'] ?? 'list';
if ($action === 'list') {
    $week = $_GET['week'] ?? date('Y-m-d', strtotime('monday this week'));
    $stmt=$conn->prepare("SELECT * FROM meals WHERE week_date=? ORDER BY FIELD(day_of_week,'ຈັນ','ອັງຄານ','ພຸດ','ພະຫັດ','ສຸກ'), FIELD(meal_time,'ອາຫານເຊົ້າ','ອາຫານວ່າງເຊົ້າ','ອາຫານທ່ຽງ','ອາຫານວ່າງບ່າຍ')");
    $stmt->bind_param('s',$week); $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
} elseif ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d=$_POST; $id=intval($d['meal_id']??0);
    if ($id) {
        $stmt=$conn->prepare("UPDATE meals SET day_of_week=?,meal_time=?,menu_description=?,week_date=? WHERE meal_id=?");
        $stmt->bind_param('ssssi',$d['day_of_week'],$d['meal_time'],$d['menu_description'],$d['week_date'],$id);
    } else {
        $stmt=$conn->prepare("INSERT INTO meals (day_of_week,meal_time,menu_description,week_date) VALUES (?,?,?,?)");
        $stmt->bind_param('ssss',$d['day_of_week'],$d['meal_time'],$d['menu_description'],$d['week_date']);
    }
    $stmt->execute(); echo json_encode(['success'=>true]);
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id=intval($_POST['meal_id']); $stmt=$conn->prepare("DELETE FROM meals WHERE meal_id=?"); $stmt->bind_param('i',$id); $stmt->execute();
    echo json_encode(['success'=>true]);
}

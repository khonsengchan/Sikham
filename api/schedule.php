<?php
// api/schedule.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

function ensure_schedule_table($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `schedule_entries` (
      `schedule_id` INT AUTO_INCREMENT PRIMARY KEY,
      `class_id` INT NULL,
      `teacher_id` INT NULL,
      `subject` VARCHAR(150) NOT NULL,
      `day_of_week` ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL DEFAULT 'Monday',
      `start_time` TIME NOT NULL,
      `end_time` TIME NOT NULL,
      `room` VARCHAR(50) DEFAULT NULL,
      `notes` TEXT DEFAULT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX `idx_schedule_day` (`day_of_week`, `start_time`),
      FOREIGN KEY (`class_id`) REFERENCES `classes`(`class_id`) ON DELETE SET NULL,
      FOREIGN KEY (`teacher_id`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    return $conn->query($sql);
}

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    if (!ensure_schedule_table($conn)) {
        echo json_encode(['error' => 'Cannot prepare schedule table: ' . $conn->error]);
        exit;
    }

    $sql = "SELECT se.*, c.class_name, c.level, s.full_name_lao AS teacher_name
            FROM schedule_entries se
            LEFT JOIN classes c ON se.class_id = c.class_id
            LEFT JOIN staff s ON se.teacher_id = s.staff_id
            ORDER BY FIELD(se.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), se.start_time ASC, se.schedule_id ASC";
    $rows = $conn->query($sql);
    if (!$rows) {
        echo json_encode(['error' => 'Cannot load schedule: ' . $conn->error]);
        exit;
    }
    echo json_encode($rows->fetch_all(MYSQLI_ASSOC));
    exit;
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!ensure_schedule_table($conn)) {
        echo json_encode(['success' => false, 'error' => 'Cannot prepare schedule table: ' . $conn->error]);
        exit;
    }

    $d = $_POST;
    $id = intval($d['schedule_id'] ?? 0);
    $subject = trim($d['subject'] ?? '');
    $day = $d['day_of_week'] ?? '';
    $start = $d['start_time'] ?? '';
    $end = $d['end_time'] ?? '';
    $classId = intval($d['class_id'] ?? 0) ?: null;
    $teacherId = intval($d['teacher_id'] ?? 0) ?: null;
    $room = trim($d['room'] ?? '');
    $notes = trim($d['notes'] ?? '');

    if ($subject === '' || $day === '' || $start === '' || $end === '') {
        echo json_encode(['success' => false, 'error' => 'Missing subject, day, or time']);
        exit;
    }

    if (!preg_match('/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/', $day)) {
        echo json_encode(['success' => false, 'error' => 'Invalid day_of_week']);
        exit;
    }
    if (!preg_match('/^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$/', $start) || !preg_match('/^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$/', $end)) {
        echo json_encode(['success' => false, 'error' => 'Invalid time format']);
        exit;
    }

    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE schedule_entries SET class_id=?, teacher_id=?, subject=?, day_of_week=?, start_time=?, end_time=?, room=?, notes=? WHERE schedule_id=?");
        $stmt->bind_param('iissssssi', $classId, $teacherId, $subject, $day, $start, $end, $room, $notes, $id);
    } else {
        $stmt = $conn->prepare("INSERT INTO schedule_entries (class_id, teacher_id, subject, day_of_week, start_time, end_time, room, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('iissssss', $classId, $teacherId, $subject, $day, $start, $end, $room, $notes);
    }

    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
        exit;
    }

    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'error' => 'Save failed: ' . $stmt->error]);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!ensure_schedule_table($conn)) {
        echo json_encode(['success' => false, 'error' => 'Cannot prepare schedule table: ' . $conn->error]);
        exit;
    }

    $id = intval($_POST['schedule_id'] ?? 0);
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Missing schedule_id']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM schedule_entries WHERE schedule_id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Unknown action']);

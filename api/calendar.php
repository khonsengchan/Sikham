<?php
// api/calendar.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

function ensure_calendar_table($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `calendar_events` (
      `event_id` INT AUTO_INCREMENT PRIMARY KEY,
      `title` VARCHAR(255) NOT NULL,
      `event_date` DATE NOT NULL,
      `color` CHAR(7) NOT NULL DEFAULT '#22c55e',
      `created_by` INT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX `idx_event_date` (`event_date`),
      FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    return $conn->query($sql);
}

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    if (!ensure_calendar_table($conn)) {
        echo json_encode(['error' => 'Cannot prepare calendar table: ' . $conn->error]);
        exit;
    }

    $sql = "SELECT event_id, title, event_date AS `date`, color
            FROM calendar_events
            ORDER BY event_date ASC, event_id ASC";
    $rows = $conn->query($sql);
    if (!$rows) {
        echo json_encode(['error' => 'Cannot load events: ' . $conn->error]);
        exit;
    }
    echo json_encode($rows->fetch_all(MYSQLI_ASSOC));
    exit;
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!ensure_calendar_table($conn)) {
        echo json_encode(['success' => false, 'error' => 'Cannot prepare calendar table: ' . $conn->error]);
        exit;
    }

    $title = trim($_POST['title'] ?? '');
    $eventDate = $_POST['event_date'] ?? '';
    $color = trim($_POST['color'] ?? '#22c55e');

    if ($title === '' || $eventDate === '') {
        echo json_encode(['success' => false, 'error' => 'Missing title or event_date']);
        exit;
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $eventDate)) {
        echo json_encode(['success' => false, 'error' => 'Invalid event_date format']);
        exit;
    }

    if (!preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
        $color = '#22c55e';
    }

    $uid = intval($_SESSION['user_id'] ?? 0);
    $eventId = intval($_POST['event_id'] ?? 0);

    if ($eventId > 0) {
        $stmt = $conn->prepare("UPDATE calendar_events SET title = ?, event_date = ?, color = ? WHERE event_id = ?");
        if (!$stmt) {
            echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param('sssi', $title, $eventDate, $color, $eventId);
    } else {
        if ($uid > 0) {
            $stmt = $conn->prepare("INSERT INTO calendar_events (title, event_date, color, created_by) VALUES (?, ?, ?, ?)");
            if (!$stmt) {
                echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param('sssi', $title, $eventDate, $color, $uid);
        } else {
            $stmt = $conn->prepare("INSERT INTO calendar_events (title, event_date, color, created_by) VALUES (?, ?, ?, NULL)");
            if (!$stmt) {
                echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param('sss', $title, $eventDate, $color);
        }
    }

    $ok = $stmt->execute();

    if (!$ok) {
        echo json_encode(['success' => false, 'error' => 'Save failed: ' . $stmt->error]);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!ensure_calendar_table($conn)) {
        echo json_encode(['success' => false, 'error' => 'Cannot prepare calendar table: ' . $conn->error]);
        exit;
    }

    $eventId = intval($_POST['event_id'] ?? 0);
    if (!$eventId) {
        echo json_encode(['success' => false, 'error' => 'Missing event_id']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM calendar_events WHERE event_id = ?");
    $stmt->bind_param('i', $eventId);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Unknown action']);

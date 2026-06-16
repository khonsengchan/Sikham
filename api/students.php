<?php
// api/students.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }

$action = $_GET['action'] ?? 'list';

function sanitize_student_profile_path($path) {
    if (!$path || !is_string($path)) return '';
    return str_starts_with($path, 'assets/uploads/students/') ? $path : '';
}

function remove_student_profile_file_if_exists($relativePath) {
    if (!$relativePath) return;
    $oldPath = realpath(__DIR__ . '/../' . $relativePath);
    $uploadsBase = realpath(__DIR__ . '/../assets/uploads/students');
    if ($oldPath && $uploadsBase && str_starts_with($oldPath, $uploadsBase) && is_file($oldPath)) {
        @unlink($oldPath);
    }
}

function handle_student_profile_upload($fileField = 'profile_picture') {
    if (empty($_FILES[$fileField]) || ($_FILES[$fileField]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return ['ok' => true, 'path' => null];
    }

    $f = $_FILES[$fileField];
    if (($f['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'ອັບໂຫຼດຮູບບໍ່ສຳເລັດ'];
    }

    $maxSize = 2 * 1024 * 1024;
    if (($f['size'] ?? 0) > $maxSize) {
        return ['ok' => false, 'error' => 'ຂະໜາດຮູບຕ້ອງນ້ອຍກວ່າ 2MB'];
    }

    $tmp = $f['tmp_name'] ?? '';
    if (!$tmp || !is_uploaded_file($tmp)) {
        return ['ok' => false, 'error' => 'ໄຟລ໌ຮູບບໍ່ຖືກຕ້ອງ'];
    }

    $mime = mime_content_type($tmp);
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($allowed[$mime])) {
        return ['ok' => false, 'error' => 'ຮອງຮັບສະເພາະ JPG, PNG, WEBP'];
    }

    $dirFs = __DIR__ . '/../assets/uploads/students';
    if (!is_dir($dirFs) && !mkdir($dirFs, 0755, true)) {
        return ['ok' => false, 'error' => 'ບໍ່ສາມາດສ້າງໂຟນເດີຮູບ'];
    }

    $filename = 'student_' . bin2hex(random_bytes(8)) . '.' . $allowed[$mime];
    $destFs = $dirFs . '/' . $filename;
    if (!move_uploaded_file($tmp, $destFs)) {
        return ['ok' => false, 'error' => 'ບໍ່ສາມາດບັນທຶກຮູບໄດ້'];
    }

    return ['ok' => true, 'path' => 'assets/uploads/students/' . $filename];
}

if ($action === 'list') {
    $search = $_GET['search'] ?? '';
    $class_id = $_GET['class_id'] ?? '';
    $level = $_GET['level'] ?? '';
    $sql = "SELECT s.*, c.class_name, c.level FROM students s LEFT JOIN classes c ON s.class_id = c.class_id WHERE 1=1";
    $params = []; $types = '';
    if ($search) { $sql .= " AND (s.full_name_lao LIKE ? OR s.full_name_eng LIKE ? OR s.student_code LIKE ?)"; $like = "%$search%"; $params = [$like,$like,$like]; $types='sss'; }
    if ($class_id) { $sql .= " AND s.class_id = ?"; $params[] = $class_id; $types .= 'i'; }
    if ($level) { $sql .= " AND c.level = ?"; $params[] = $level; $types .= 's'; }
    $sql .= " ORDER BY c.level ASC, s.class_id ASC, CASE WHEN s.gender='ຍິງ' THEN 1 ELSE 2 END, s.full_name_lao ASC";
    $stmt = $conn->prepare($sql); if ($params) $stmt->bind_param($types, ...$params); $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$r) $r['profile_picture'] = sanitize_student_profile_path($r['profile_picture'] ?? '');
    echo json_encode($rows);
} elseif ($action === 'get') {
    $id = intval($_GET['id']);
    $stmt = $conn->prepare("SELECT s.*, c.class_name, c.level FROM students s LEFT JOIN classes c ON s.class_id = c.class_id WHERE s.student_id = ?");
    $stmt->bind_param('i',$id); $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) $row['profile_picture'] = sanitize_student_profile_path($row['profile_picture'] ?? '');
    echo json_encode($row);
} elseif ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST;
    $id = intval($d['student_id'] ?? 0);
    $upload = handle_student_profile_upload('profile_picture');
    if (!$upload['ok']) {
        echo json_encode(['success' => false, 'error' => $upload['error']]);
        exit;
    }

    $newProfile = $upload['path'];
    $profilePicture = $newProfile;
    $oldProfile = '';
    if ($id) {
        $q = $conn->prepare("SELECT profile_picture FROM students WHERE student_id=?");
        $q->bind_param('i', $id);
        $q->execute();
        $old = $q->get_result()->fetch_assoc();
        $oldProfile = $old['profile_picture'] ?? '';
        if (!$profilePicture) $profilePicture = $oldProfile;
    }

    if ($id) {
        $stmt = $conn->prepare("UPDATE students SET full_name_lao=?,full_name_eng=?,gender=?,date_of_birth=?,class_id=?,parent_name=?,parent_phone=?,address=?,enrollment_date=?,status=?,profile_picture=? WHERE student_id=?");
        $stmt->bind_param('ssssissssssi',$d['full_name_lao'],$d['full_name_eng'],$d['gender'],$d['date_of_birth'],$d['class_id'],$d['parent_name'],$d['parent_phone'],$d['address'],$d['enrollment_date'],$d['status'],$profilePicture,$id);
    } else {
        $res_max = $conn->query("SELECT MAX(student_id) as max_id FROM students");
        $next_id = ($res_max->fetch_assoc()['max_id'] ?? 0) + 1;
        $code = 'ST-' . str_pad($next_id, 4, '0', STR_PAD_LEFT);
        $stmt = $conn->prepare("INSERT INTO students (student_code,full_name_lao,full_name_eng,gender,date_of_birth,class_id,parent_name,parent_phone,address,enrollment_date,status,profile_picture) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->bind_param('sssssissssss',$code,$d['full_name_lao'],$d['full_name_eng'],$d['gender'],$d['date_of_birth'],$d['class_id'],$d['parent_name'],$d['parent_phone'],$d['address'],$d['enrollment_date'],$d['status'],$profilePicture);
    }
    $stmt->execute();
    if ($newProfile && $id && $oldProfile && $oldProfile !== $newProfile) remove_student_profile_file_if_exists($oldProfile);
    echo json_encode(['success'=>true,'id'=>$conn->insert_id?:$id]);
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = intval($_POST['student_id']);
    $q = $conn->prepare("SELECT profile_picture FROM students WHERE student_id=?");
    $q->bind_param('i', $id);
    $q->execute();
    $old = $q->get_result()->fetch_assoc();
    
    // Handle related records to avoid foreign key constraints errors
    $conn->query("DELETE FROM student_scores WHERE student_id = $id");
    $conn->query("DELETE FROM attendance WHERE student_id = $id");
    $conn->query("DELETE FROM student_assessments WHERE student_id = $id");
    $conn->query("DELETE FROM transport_students WHERE student_id = $id");
    $conn->query("DELETE FROM enrollments WHERE student_id = $id");
    $conn->query("DELETE FROM fee_invoices WHERE student_id = $id");
    $conn->query("DELETE FROM payments WHERE student_id = $id");
    $conn->query("DELETE FROM health_alerts WHERE student_id = $id");
    $conn->query("DELETE FROM health_records WHERE student_id = $id");
    $conn->query("UPDATE finance_transactions SET student_id = NULL WHERE student_id = $id");
    $conn->query("UPDATE users SET student_id = NULL WHERE student_id = $id");
    
    $stmt=$conn->prepare("DELETE FROM students WHERE student_id=?"); 
    $stmt->bind_param('i',$id); 
    if ($stmt->execute()) {
        if ($old && !empty($old['profile_picture'])) remove_student_profile_file_if_exists($old['profile_picture']);
        echo json_encode(['success'=>true]);
    } else {
        echo json_encode(['success'=>false, 'error'=>"ບໍ່ສາມາດລົບໄດ້: " . $stmt->error]);
    }
} elseif ($action === 'stats') {
    $total    = $conn->query("SELECT COUNT(*) c FROM students WHERE status='ກຳລັງຮຽນ'")->fetch_assoc()['c'];
    $by_level = $conn->query("
        SELECT c.level, COUNT(s.student_id) cnt
        FROM classes c
        LEFT JOIN students s
            ON s.class_id = c.class_id
            AND s.status = 'ກຳລັງຮຽນ'
        GROUP BY c.level
        ORDER BY
            CASE c.level
                WHEN 'Nursery' THEN 1
                WHEN 'K1' THEN 2
                WHEN 'K2' THEN 3
                WHEN 'K3' THEN 4
                WHEN 'P1' THEN 5
                WHEN 'P2' THEN 6
                WHEN 'P3' THEN 7
                WHEN 'P4' THEN 8
                WHEN 'P5' THEN 9
                ELSE 99
            END,
            c.level
    ")->fetch_all(MYSQLI_ASSOC);
    $boys     = $conn->query("SELECT COUNT(*) c FROM students WHERE status='ກຳລັງຮຽນ' AND gender='ຊາຍ'")->fetch_assoc()['c'];
    $girls    = $conn->query("SELECT COUNT(*) c FROM students WHERE status='ກຳລັງຮຽນ' AND gender='ຍິງ'")->fetch_assoc()['c'];
    echo json_encode(['total'=>$total,'by_level'=>$by_level,'boys'=>$boys,'girls'=>$girls]);
} elseif ($action === 'yearly_counts') {
    $rows = $conn->query("
      SELECT YEAR(COALESCE(enrollment_date, created_at)) AS year_ad, COUNT(*) AS total
      FROM students
      GROUP BY YEAR(COALESCE(enrollment_date, created_at))
      ORDER BY year_ad ASC
    ")->fetch_all(MYSQLI_ASSOC);
    echo json_encode($rows);
}

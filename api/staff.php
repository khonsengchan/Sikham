<?php
// api/staff.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }

$action = $_GET['action'] ?? 'list';

function sanitize_profile_path($path) {
    if (!$path || !is_string($path)) return '';
    return str_starts_with($path, 'assets/uploads/staff/') ? $path : '';
}

function remove_profile_file_if_exists($relativePath) {
    if (!$relativePath) return;
    $oldPath = realpath(__DIR__ . '/../' . $relativePath);
    $uploadsBase = realpath(__DIR__ . '/../assets/uploads/staff');
    if ($oldPath && $uploadsBase && str_starts_with($oldPath, $uploadsBase) && is_file($oldPath)) {
        @unlink($oldPath);
    }
}

function handle_staff_profile_upload($fileField = 'profile_picture') {
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

    $dirFs = __DIR__ . '/../assets/uploads/staff';
    if (!is_dir($dirFs) && !mkdir($dirFs, 0755, true)) {
        return ['ok' => false, 'error' => 'ບໍ່ສາມາດສ້າງໂຟນເດີຮູບ'];
    }

    $filename = 'staff_' . bin2hex(random_bytes(8)) . '.' . $allowed[$mime];
    $destFs = $dirFs . '/' . $filename;
    if (!move_uploaded_file($tmp, $destFs)) {
        return ['ok' => false, 'error' => 'ບໍ່ສາມາດບັນທຶກຮູບໄດ້'];
    }

    return ['ok' => true, 'path' => 'assets/uploads/staff/' . $filename];
}

if ($action === 'list') {
    $search = $_GET['search'] ?? '';
    $sql = "SELECT * FROM staff WHERE 1=1";
    $params = []; $types = '';
    if ($search) { $sql .= " AND (full_name_lao LIKE ? OR full_name_eng LIKE ? OR role LIKE ?)"; $like = "%$search%"; $params=[$like,$like,$like]; $types='sss'; }
    $sql .= " ORDER BY staff_id DESC";
    $stmt = $conn->prepare($sql); if ($params) $stmt->bind_param($types,...$params); $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$r) $r['profile_picture'] = sanitize_profile_path($r['profile_picture'] ?? '');
    echo json_encode($rows);
} elseif ($action === 'get') {
    $id = intval($_GET['id']);
    $stmt = $conn->prepare("SELECT * FROM staff WHERE staff_id=?"); $stmt->bind_param('i',$id); $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) $row['profile_picture'] = sanitize_profile_path($row['profile_picture'] ?? '');
    echo json_encode($row);
} elseif ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST; $id = intval($d['staff_id'] ?? 0);
    $upload = handle_staff_profile_upload('profile_picture');
    if (!$upload['ok']) {
        echo json_encode(['success' => false, 'error' => $upload['error']]);
        exit;
    }

    $newProfile = $upload['path'];
    $profilePicture = $newProfile;
    if (!$profilePicture && $id) {
        $q = $conn->prepare("SELECT profile_picture FROM staff WHERE staff_id=?");
        $q->bind_param('i', $id);
        $q->execute();
        $old = $q->get_result()->fetch_assoc();
        $profilePicture = $old['profile_picture'] ?? '';
    }

    $oldProfile = '';
    if ($id) {
        $q = $conn->prepare("SELECT profile_picture FROM staff WHERE staff_id=?");
        $q->bind_param('i', $id);
        $q->execute();
        $old = $q->get_result()->fetch_assoc();
        $oldProfile = $old['profile_picture'] ?? '';
    }

    if ($id) {
        $stmt=$conn->prepare("UPDATE staff SET full_name_lao=?,full_name_eng=?,role=?,department=?,phone=?,email=?,gender=?,date_of_birth=?,hire_date=?,profile_picture=?,status=? WHERE staff_id=?");
        $stmt->bind_param('sssssssssssi',$d['full_name_lao'],$d['full_name_eng'],$d['role'],$d['department'],$d['phone'],$d['email'],$d['gender'],$d['date_of_birth'],$d['hire_date'],$profilePicture,$d['status'],$id);
    } else {
        $stmt=$conn->prepare("INSERT INTO staff (full_name_lao,full_name_eng,role,department,phone,email,gender,date_of_birth,hire_date,profile_picture,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->bind_param('sssssssssss',$d['full_name_lao'],$d['full_name_eng'],$d['role'],$d['department'],$d['phone'],$d['email'],$d['gender'],$d['date_of_birth'],$d['hire_date'],$profilePicture,$d['status']);
    }
    $stmt->execute();
    if ($newProfile && $id && $oldProfile && $oldProfile !== $newProfile) remove_profile_file_if_exists($oldProfile);
    echo json_encode(['success'=>true,'id'=>$id ? $id : $conn->insert_id]);
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = intval($_POST['staff_id']); 
    
    // Find associated user_id and profile path
    $q = $conn->prepare("SELECT user_id, profile_picture FROM staff WHERE staff_id=?");
    $q->bind_param('i', $id);
    $q->execute();
    $u = $q->get_result()->fetch_assoc();
    
    // Delete staff
    $stmt=$conn->prepare("DELETE FROM staff WHERE staff_id=?"); 
    $stmt->bind_param('i',$id); 
    $stmt->execute();

    // Delete associated user account if exists
    if ($u && !empty($u['user_id'])) {
        $delUser = $conn->prepare("DELETE FROM users WHERE user_id=?");
        $delUser->bind_param('i', $u['user_id']);
        $delUser->execute();
    }

    if ($u && !empty($u['profile_picture'])) {
        remove_profile_file_if_exists($u['profile_picture']);
    }
    
    echo json_encode(['success'=>true]);
} elseif ($action === 'count') {
    $r = $conn->query("SELECT COUNT(*) c FROM staff WHERE status='active'")->fetch_assoc();
    echo json_encode(['count'=>$r['c']]);
}

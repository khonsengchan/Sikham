<?php
// api/scores.php
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? 'list';

function score_filters(&$params, &$types, $alias = 'sc') {
    $where = [];
    $academic_year = trim($_GET['academic_year'] ?? '');
    $term = trim($_GET['term'] ?? '');
    $exam_type = trim($_GET['exam_type'] ?? '');
    $subject = trim($_GET['subject'] ?? '');
    $class_id = intval($_GET['class_id'] ?? 0);
    $student_id = intval($_GET['student_id'] ?? 0);

    if ($academic_year !== '') { $where[] = "$alias.academic_year = ?"; $params[] = $academic_year; $types .= 's'; }
    if ($term !== '') { $where[] = "$alias.term = ?"; $params[] = $term; $types .= 's'; }
    if ($exam_type !== '') { $where[] = "$alias.exam_type = ?"; $params[] = $exam_type; $types .= 's'; }
    if ($subject !== '') { $where[] = "$alias.subject = ?"; $params[] = $subject; $types .= 's'; }
    if ($class_id > 0) { $where[] = "$alias.class_id = ?"; $params[] = $class_id; $types .= 'i'; }
    if ($student_id > 0) { $where[] = "$alias.student_id = ?"; $params[] = $student_id; $types .= 'i'; }

    return $where ? ' WHERE ' . implode(' AND ', $where) : '';
}

function bind_if_needed($stmt, $types, $params) {
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
}

function rank_rows($rows, $score_key = 'average_percent') {
    $ranked = [];
    $rank = 0;
    $last = null;
    foreach ($rows as $idx => $row) {
        $value = round(floatval($row[$score_key] ?? 0), 2);
        if ($last === null || $value !== $last) {
            $rank = $idx + 1;
            $last = $value;
        }
        $row['rank_no'] = $rank;
        $ranked[] = $row;
    }
    return $ranked;
}

if ($action === 'list') {
    $params = [];
    $types = '';
    $where = score_filters($params, $types);
    $sql = "SELECT sc.*, s.student_code, s.full_name_lao, s.full_name_eng, s.gender,
                   c.class_name, c.level
            FROM student_scores sc
            JOIN students s ON sc.student_id = s.student_id
            LEFT JOIN classes c ON sc.class_id = c.class_id
            $where
            ORDER BY sc.score_date DESC, sc.created_at DESC, sc.score_id DESC";
    $stmt = $conn->prepare($sql);
    bind_if_needed($stmt, $types, $params);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

if ($action === 'get') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("SELECT sc.*, s.full_name_lao, s.student_code, c.class_name
                            FROM student_scores sc
                            JOIN students s ON sc.student_id = s.student_id
                            LEFT JOIN classes c ON sc.class_id = c.class_id
                            WHERE sc.score_id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_assoc() ?: ['error' => 'Not found']);
    exit;
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = $_POST;
    $score_id = intval($d['score_id'] ?? 0);
    $student_id = intval($d['student_id'] ?? 0);
    $academic_year = trim($d['academic_year'] ?? '');
    $term = trim($d['term'] ?? '');
    $exam_type = trim($d['exam_type'] ?? '');
    $subject = trim($d['subject'] ?? '');
    $score = floatval($d['score'] ?? -1);
    $max_score = floatval($d['max_score'] ?? 100);
    $score_date = trim($d['score_date'] ?? date('Y-m-d'));
    $notes = trim($d['notes'] ?? '');
    $recorded_by = intval($_SESSION['user_id'] ?? 0) ?: null;

    if (!$student_id || $academic_year === '' || $term === '' || $exam_type === '' || $subject === '') {
        echo json_encode(['success' => false, 'error' => 'ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ']);
        exit;
    }
    if ($max_score <= 0 || $score < 0 || $score > $max_score) {
        echo json_encode(['success' => false, 'error' => 'ຄະແນນຕ້ອງຢູ່ລະຫວ່າງ 0 ຫາຄະແນນເຕັມ']);
        exit;
    }

    $student_stmt = $conn->prepare("SELECT class_id FROM students WHERE student_id = ?");
    $student_stmt->bind_param('i', $student_id);
    $student_stmt->execute();
    $student = $student_stmt->get_result()->fetch_assoc();
    if (!$student) {
        echo json_encode(['success' => false, 'error' => 'ບໍ່ພົບນັກຮຽນ']);
        exit;
    }
    $class_id = intval($student['class_id'] ?? 0) ?: null;

    if ($score_id) {
        $stmt = $conn->prepare("UPDATE student_scores
                                SET student_id=?, class_id=?, academic_year=?, term=?, exam_type=?, subject=?,
                                    score=?, max_score=?, score_date=?, notes=?, recorded_by=?
                                WHERE score_id=?");
        $stmt->bind_param('iissssddssii', $student_id, $class_id, $academic_year, $term, $exam_type, $subject, $score, $max_score, $score_date, $notes, $recorded_by, $score_id);
    } else {
        $stmt = $conn->prepare("INSERT INTO student_scores
                                (student_id, class_id, academic_year, term, exam_type, subject, score, max_score, score_date, notes, recorded_by)
                                VALUES (?,?,?,?,?,?,?,?,?,?,?)
                                ON DUPLICATE KEY UPDATE
                                  class_id=VALUES(class_id), score=VALUES(score), max_score=VALUES(max_score),
                                  score_date=VALUES(score_date), notes=VALUES(notes), recorded_by=VALUES(recorded_by)");
        $stmt->bind_param('iissssddssi', $student_id, $class_id, $academic_year, $term, $exam_type, $subject, $score, $max_score, $score_date, $notes, $recorded_by);
    }
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => $score_id ?: $conn->insert_id]);
    exit;
}

if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = intval($_POST['score_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM student_scores WHERE score_id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'rankings') {
    $params = [];
    $types = '';
    $where = score_filters($params, $types);

    $class_sql = "SELECT c.class_id, c.class_name, c.level,
                         COUNT(DISTINCT sc.student_id) AS student_count,
                         COUNT(sc.score_id) AS score_count,
                         ROUND(AVG((sc.score / sc.max_score) * 100), 2) AS average_percent,
                         ROUND(SUM(sc.score), 2) AS total_score
                  FROM student_scores sc
                  LEFT JOIN classes c ON sc.class_id = c.class_id
                  $where
                  GROUP BY c.class_id, c.class_name, c.level
                  ORDER BY average_percent DESC, total_score DESC, c.class_name ASC";
    $stmt = $conn->prepare($class_sql);
    bind_if_needed($stmt, $types, $params);
    $stmt->execute();
    $class_rows = rank_rows($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

    $student_sql = "SELECT s.student_id, s.student_code, s.full_name_lao, s.full_name_eng,
                           c.class_name, c.level,
                           COUNT(sc.score_id) AS score_count,
                           ROUND(AVG((sc.score / sc.max_score) * 100), 2) AS average_percent,
                           ROUND(SUM(sc.score), 2) AS total_score
                    FROM student_scores sc
                    JOIN students s ON sc.student_id = s.student_id
                    LEFT JOIN classes c ON sc.class_id = c.class_id
                    $where
                    GROUP BY s.student_id, s.student_code, s.full_name_lao, s.full_name_eng, c.class_name, c.level
                    ORDER BY average_percent DESC, total_score DESC, s.full_name_lao ASC";
    $stmt = $conn->prepare($student_sql);
    bind_if_needed($stmt, $types, $params);
    $stmt->execute();
    $student_rows = rank_rows($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

    echo json_encode(['classes' => $class_rows, 'students' => $student_rows]);
    exit;
}

if ($action === 'options') {
    $years = $conn->query("SELECT DISTINCT academic_year FROM student_scores ORDER BY academic_year DESC")->fetch_all(MYSQLI_ASSOC);
    $terms = $conn->query("SELECT DISTINCT term FROM student_scores ORDER BY term")->fetch_all(MYSQLI_ASSOC);
    $exam_types = $conn->query("SELECT DISTINCT exam_type FROM student_scores ORDER BY exam_type")->fetch_all(MYSQLI_ASSOC);
    $subjects = $conn->query("SELECT DISTINCT subject FROM student_scores ORDER BY subject")->fetch_all(MYSQLI_ASSOC);
    echo json_encode([
        'academic_years' => array_column($years, 'academic_year'),
        'terms' => array_column($terms, 'term'),
        'exam_types' => array_column($exam_types, 'exam_type'),
        'subjects' => array_column($subjects, 'subject'),
    ]);
    exit;
}

// ── subjects_by_class: return distinct subjects for a class from schedule_entries AND student_scores ──
if ($action === 'subjects_by_class') {
    $class_id = intval($_GET['class_id'] ?? 0);
    if ($class_id > 0) {
        $stmt = $conn->prepare("
            SELECT subject FROM schedule_entries WHERE class_id = ?
            UNION
            SELECT subject FROM student_scores WHERE class_id = ?
            ORDER BY subject ASC
        ");
        $stmt->bind_param('ii', $class_id, $class_id);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    } else {
        $rows = $conn->query("
            SELECT subject FROM schedule_entries
            UNION
            SELECT subject FROM student_scores
            ORDER BY subject ASC
        ")->fetch_all(MYSQLI_ASSOC);
    }
    echo json_encode(array_column($rows, 'subject'));
    exit;
}

// ── matrix: pivot table of student scores by subject for a given class ──
if ($action === 'matrix') {
    $class_id    = intval($_GET['class_id']    ?? 0);
    $academic_year = trim($_GET['academic_year'] ?? '');
    $term        = trim($_GET['term']        ?? '');
    $exam_type   = trim($_GET['exam_type']   ?? '');

    $level_group = trim($_GET['level_group'] ?? '');

    // Class condition
    $class_id_cond = "1=1";
    $s_cond = "1=1";
    if ($class_id > 0) {
        $class_id_cond = "class_id = $class_id";
        $s_cond = "s.class_id = $class_id";
    } elseif ($level_group !== '') {
        $c_cond = "";
        if ($level_group === 'ອະນຸບານ') {
            $c_cond = "class_name LIKE '%ອະນຸບານ%' OR level LIKE '%ອະນຸບານ%'";
        } elseif ($level_group === 'ປ.1 - ປ.3') {
            $c_cond = "class_name LIKE '%ປ.1%' OR class_name LIKE '%ປ.2%' OR class_name LIKE '%ປ.3%'";
        } elseif ($level_group === 'ປ.4 - ປ.5') {
            $c_cond = "class_name LIKE '%ປ.4%' OR class_name LIKE '%ປ.5%'";
        }
        if ($c_cond) {
            $class_id_cond = "class_id IN (SELECT class_id FROM classes WHERE $c_cond)";
            $s_cond = "s.class_id IN (SELECT class_id FROM classes WHERE $c_cond)";
        }
    }

    // Get students
    $s_query = "SELECT s.student_id, s.full_name_lao, s.full_name_eng, s.gender, s.student_code, c.class_name, c.level
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.class_id
                WHERE s.status = 'ກຳລັງຮຽນ' AND $s_cond
                ORDER BY c.class_name ASC, s.full_name_lao ASC";
    $sstmt = $conn->prepare($s_query);
    $sstmt->execute();
    $students = $sstmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Get subjects
    $subj_query = "
        SELECT subject FROM schedule_entries WHERE $class_id_cond
        UNION
        SELECT subject FROM student_scores WHERE $class_id_cond
        ORDER BY subject ASC
    ";
    $subj_stmt = $conn->prepare($subj_query);
    $subj_stmt->execute();
    $subjects = array_column($subj_stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'subject');

    // Get all scores for the filter
    $score_where = [];
    $score_params = [];
    $score_types = '';
    if ($class_id > 0)      { $score_where[] = 'sc.class_id = ?'; $score_params[] = $class_id; $score_types .= 'i'; }
    if ($academic_year !== '') { $score_where[] = 'sc.academic_year = ?'; $score_params[] = $academic_year; $score_types .= 's'; }
    if ($term !== '')        { $score_where[] = 'sc.term = ?'; $score_params[] = $term; $score_types .= 's'; }
    if ($exam_type !== '')   { $score_where[] = 'sc.exam_type = ?'; $score_params[] = $exam_type; $score_types .= 's'; }

    $where_sql = $score_where ? 'WHERE ' . implode(' AND ', $score_where) : '';
    $score_sql = "SELECT sc.student_id, sc.subject, sc.score, sc.max_score
                  FROM student_scores sc $where_sql";
    $sc_stmt = $conn->prepare($score_sql);
    if ($score_params) $sc_stmt->bind_param($score_types, ...$score_params);
    $sc_stmt->execute();
    $raw_scores = $sc_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Build lookup: [student_id][subject] => {score, max_score}
    $score_map = [];
    foreach ($raw_scores as $sc) {
        $score_map[$sc['student_id']][$sc['subject']] = [
            'score'     => $sc['score'],
            'max_score' => $sc['max_score'],
        ];
    }

    // Assemble rows
    $rows = [];
    foreach ($students as $idx => $st) {
        $row = [
            'no'           => $idx + 1,
            'student_id'   => $st['student_id'],
            'full_name_lao'=> $st['full_name_lao'],
            'full_name_eng'=> $st['full_name_eng'],
            'gender'       => $st['gender'],
            'student_code' => $st['student_code'],
            'class_name'   => $st['class_name'] ?? '',
            'level'        => $st['level'] ?? '',
            'scores'       => [],
            'total'        => 0,
        ];
        $total = 0;
        foreach ($subjects as $subj) {
            $entry = $score_map[$st['student_id']][$subj] ?? null;
            $row['scores'][$subj] = $entry;
            if ($entry) $total += floatval($entry['score']);
        }
        $row['total'] = $total;
        $rows[] = $row;
    }

    echo json_encode(['subjects' => $subjects, 'rows' => $rows]);
    exit;
}

echo json_encode(['error' => 'Unknown action']);

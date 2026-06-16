<?php
// api/notifications.php  — ການແຈ້ງເຕືອນ (Notifications)
require_once '../core/db.php';
require_once '../core/session.php';
header('Content-Type: application/json');
if (!is_logged_in()) { echo json_encode(['error' => 'Unauthorized']); exit; }

$notifs = [];
$today  = new DateTime();
$todayStr = $today->format('Y-m-d');

// ─── 1. ກິດຈະກຳທີ່ຈະມາຮອດໃນ 5 ວັນ + ວັນນີ້ ────────────────────────────────
$calStmt = $conn->prepare("SELECT event_id, title, event_date FROM calendar_events WHERE event_date BETWEEN ? AND ? ORDER BY event_date ASC");
$dateMax  = (clone $today)->modify('+5 days')->format('Y-m-d');
$calStmt->bind_param('ss', $todayStr, $dateMax);
$calStmt->execute();
$calRows = $calStmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($calRows as $ev) {
    $evDate = new DateTime($ev['event_date']);
    $diff   = (int)$today->diff($evDate)->days;
    $future = $evDate >= $today;

    if ($ev['event_date'] === $todayStr) {
        $body  = '🗓️ ກິດຈະກຳ "' . $ev['title'] . '" ແມ່ນ ວັນນີ້!';
        $label = 'ວັນນີ້';
    } elseif ($diff <= 5 && $future) {
        $body  = '🗓️ ກິດຈະກຳ "' . $ev['title'] . '" ຈະມາຮອດໃນ ' . $diff . ' ວັນ';
        $label = 'ໃນ ' . $diff . ' ວັນ';
    } else {
        continue;
    }
    $notifs[] = [
        'id'    => 'cal_' . $ev['event_id'],
        'icon'  => '📅',
        'title' => 'ກິດຈະກຳ: ' . $ev['title'],
        'body'  => $body,
        'time'  => $label,
        'type'  => 'calendar',
        'read'  => false,
    ];
}

// ─── 2. ຄ່າທຳນຽມ pending/overdue ທີ່ຈະຮອດກຳນົດ ແລະ ກາຍກຳນົດ ─────────
// pending = ລໍຖ້າ, overdue = ຄ້າງ
$fStmt = $conn->prepare("
    SELECT f.tx_id, f.title, f.amount, f.status, f.due_date, s.full_name_lao as student_name
    FROM finance_transactions f
    LEFT JOIN students s ON f.student_id = s.student_id
    WHERE f.status IN ('pending','overdue')
      AND f.due_date IS NOT NULL
      AND f.due_date <= ?
    ORDER BY f.due_date ASC
    LIMIT 50
");
$dateMaxFinance = (clone $today)->modify('+1 days')->format('Y-m-d');
$fStmt->bind_param('s', $dateMaxFinance);
$fStmt->execute();
$fRows = $fStmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($fRows as $tx) {
    // ແຈ້ງຖ້າ: ກາຍກຳນົດ (ຫຼື ຄ້າງຊຳລະ), ວັນນີ້, ຫຼື ມື້ອື່ນ
    if ($tx['due_date'] < $todayStr || $tx['status'] === 'overdue') {
        $icon  = '🔴';
        $title = 'ຄ້າງຊຳລະ/ກາຍກຳນົດ!';
        $body  = ($tx['student_name'] ? $tx['student_name'] . ' — ' : '') . $tx['title'] . ' (' . number_format($tx['amount']) . ' ກີບ)';
        $time  = 'ຄ້າງຊຳລະ';
    } elseif ($tx['due_date'] === $todayStr) {
        $icon  = '🟠';
        $title = 'ວັນຈ່າຍຄ່າທຳນຽມ — ວັນນີ້!';
        $body  = ($tx['student_name'] ? $tx['student_name'] . ' — ' : '') . $tx['title'] . ' (' . number_format($tx['amount']) . ' ກີບ)';
        $time  = 'ວັນນີ້';
    } elseif ($tx['due_date'] > $todayStr) {
        $icon  = '🟡';
        $title = 'ກຳນົດຈ່າຍ — ມື້ອື່ນ';
        $body  = ($tx['student_name'] ? $tx['student_name'] . ' — ' : '') . $tx['title'] . ' (' . number_format($tx['amount']) . ' ກີບ)';
        $time  = 'ມື້ອື່ນ';
    } else {
        continue; // ບໍ່ຕ້ອງແຈ້ງ
    }

    $notifs[] = [
        'id'    => 'fin_' . $tx['tx_id'],
        'icon'  => $icon,
        'title' => $title,
        'body'  => $body,
        'time'  => $time,
        'type'  => 'finance',
        'read'  => false,
    ];
}

// ─── 3. ວັດຖຸ / ສາງ ທີ່ໃກ້ໝົດ ──────────────────────────────────────────────
// Inventory ຖືກເກັບໃນ JS frontend ຍ້ອນບໍ່ມີ API backend ເທື່ອ
// ດ້ວຍນັ້ນ, ສ່ອງ flag ໃຫ້ frontend ດຶງຈາກ JS array inventoryData ເອງ
// (ໃຊ້ item.status !== 'ພໍດີ' ເພາະ inventory ຍັງ static JS)
// ສ່ວນ backend ຂ້ອຍໃຊ້ table inventory_items ຖ້າມີ, ຖ້າບໍ່ມີ fallback ທີ່ frontend
$invCheck = $conn->query("SHOW TABLES LIKE 'inventory_items'");
if ($invCheck && $invCheck->num_rows > 0) {
    $invStmt = $conn->query("SELECT * FROM inventory_items WHERE qty <= min_qty ORDER BY qty ASC LIMIT 20");
    if ($invStmt) {
        $invRows = $invStmt->fetch_all(MYSQLI_ASSOC);
        foreach ($invRows as $inv) {
            $qty = intval($inv['qty'] ?? 0);
            $min = intval($inv['min_qty'] ?? 0);
            if ($qty === 0) {
                $status = 'ໝົດ'; $icon = '🔴';
            } else {
                $status = 'ໃກ້ໝົດ'; $icon = '📦';
            }
            $notifs[] = [
                'id'    => 'inv_' . ($inv['item_id'] ?? $inv['id']),
                'icon'  => $icon,
                'title' => 'ວັດຖຸ: ' . ($inv['name'] ?? '-') . ' ' . $status,
                'body'  => 'ຈຳນວນຄົງເຫຼືອ: ' . $qty . ' ' . ($inv['unit'] ?? '') . ' (ຂັ້ນຕ່ຳ: ' . $min . ')',
                'time'  => 'ສາງ',
                'type'  => 'inventory',
                'read'  => false,
            ];
        }
    }
}

// flag ໃຫ້ frontend ລວມ inventory static
$notifs[] = [
    'id'     => '__inv_flag__',
    'flag'   => 'check_inventory',
    'read'   => false,
];

echo json_encode(['notifications' => $notifs, 'count' => count($notifs)]);

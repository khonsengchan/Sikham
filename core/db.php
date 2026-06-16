<?php
// core/db.php - Database connection
$databaseUrl = getenv('DATABASE_URL') ?: getenv('POSTGRES_URL') ?: '';
$dbDriver = strtolower(getenv('DB_DRIVER') ?: '');

if ($databaseUrl && (str_starts_with($databaseUrl, 'postgres://') || str_starts_with($databaseUrl, 'postgresql://'))) {
    require_once __DIR__ . '/PgCompat.php';
    $conn = PgCompatConnection::fromUrl($databaseUrl);
    return;
}

if ($dbDriver === 'pgsql' || $dbDriver === 'postgres' || $dbDriver === 'postgresql') {
    require_once __DIR__ . '/PgCompat.php';
    $conn = PgCompatConnection::fromParts(
        getenv('DB_HOST') ?: 'localhost',
        (int) (getenv('DB_PORT') ?: 5432),
        getenv('DB_NAME') ?: 'school_db',
        getenv('DB_USER') ?: 'postgres',
        getenv('DB_PASS') ?: ''
    );
    return;
}

$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';
$dbName = getenv('DB_NAME') ?: 'school_db';
$dbPort = (int) (getenv('DB_PORT') ?: 3306);

$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}
$conn->set_charset('utf8mb4');

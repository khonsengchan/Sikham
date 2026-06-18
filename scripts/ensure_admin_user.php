<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only run from the command line.\n");
    exit(1);
}

$username = getenv('ADMIN_USERNAME') ?: 'admin';
$password = getenv('ADMIN_PASSWORD') ?: 'password';

if ($username === '' || $password === '') {
    fwrite(STDERR, "ADMIN_USERNAME and ADMIN_PASSWORD must not be empty.\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$pdo = connectDatabase();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

if ($driver === 'pgsql') {
    $sql = <<<'SQL'
INSERT INTO users (username, password_hash, role, is_active)
VALUES (:username, :password_hash, 'admin', 1)
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = 'admin',
    is_active = 1
SQL;
} else {
    $sql = <<<'SQL'
INSERT INTO users (username, password_hash, role, is_active)
VALUES (:username, :password_hash, 'admin', 1)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    role = 'admin',
    is_active = 1
SQL;
}

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':username' => $username,
    ':password_hash' => $hash,
]);

fwrite(STDOUT, "Ensured admin user '{$username}'.\n");

function connectDatabase(): PDO
{
    $databaseUrl = getenv('DATABASE_URL') ?: getenv('POSTGRES_URL') ?: '';
    if ($databaseUrl) {
        $parts = parse_url($databaseUrl);
        if (!$parts || empty($parts['host'])) {
            throw new RuntimeException('Invalid DATABASE_URL');
        }

        $scheme = strtolower($parts['scheme'] ?? '');
        $dbName = ltrim($parts['path'] ?? '', '/');
        $user = rawurldecode($parts['user'] ?? '');
        $pass = rawurldecode($parts['pass'] ?? '');

        if ($scheme === 'postgres' || $scheme === 'postgresql') {
            $dsn = sprintf(
                'pgsql:host=%s;port=%d;dbname=%s;sslmode=require',
                $parts['host'],
                (int) ($parts['port'] ?? 5432),
                $dbName
            );
            return new PDO($dsn, $user, $pass, pdoOptions());
        }

        if ($scheme === 'mysql' || $scheme === 'mariadb') {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                $parts['host'],
                (int) ($parts['port'] ?? 3306),
                $dbName
            );
            return new PDO($dsn, $user, $pass, pdoOptions());
        }
    }

    $driver = strtolower(getenv('DB_DRIVER') ?: 'mysql');
    if (in_array($driver, ['pgsql', 'postgres', 'postgresql'], true)) {
        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s;sslmode=require',
            getenv('DB_HOST') ?: 'localhost',
            (int) (getenv('DB_PORT') ?: 5432),
            getenv('DB_NAME') ?: 'school_db'
        );
        return new PDO($dsn, getenv('DB_USER') ?: 'postgres', getenv('DB_PASS') ?: '', pdoOptions());
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        getenv('DB_HOST') ?: 'localhost',
        (int) (getenv('DB_PORT') ?: 3306),
        getenv('DB_NAME') ?: 'school_db'
    );
    return new PDO($dsn, getenv('DB_USER') ?: 'root', getenv('DB_PASS') ?: '', pdoOptions());
}

function pdoOptions(): array
{
    return [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
}

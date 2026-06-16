<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only run from the command line.\n");
    exit(1);
}

$ifEmpty = in_array('--if-empty', $argv, true);
$dryRun = in_array('--dry-run', $argv, true);
$sqlFile = $argv[count($argv) - 1] ?? '';

if (!$sqlFile || str_starts_with($sqlFile, '--') || !is_file($sqlFile)) {
    fwrite(STDERR, "Usage: php scripts/import_mysql_dump_to_pg.php [--if-empty] school_db.sql\n");
    exit(1);
}

$dump = file_get_contents($sqlFile);
if ($dump === false) {
    fwrite(STDERR, "Cannot read SQL file: {$sqlFile}\n");
    exit(1);
}

if ($dryRun) {
    fwrite(STDOUT, sprintf(
        "Dry run OK: %d tables, %d inserts, %d primary keys, %d unique keys, %d sequences.\n",
        count(extractTableNames($dump)),
        count(extractInsertStatements($dump)),
        count(extractPrimaryKeys($dump)),
        count(extractUniqueKeys($dump)),
        count(extractAutoIncrements($dump))
    ));
    exit(0);
}

$pdo = connectPg();

if ($ifEmpty && databaseHasTables($pdo)) {
    fwrite(STDOUT, "Database already has tables; skipping import.\n");
    exit(0);
}

$pdo->exec("SET client_encoding = 'UTF8'");
$pdo->exec("SET standard_conforming_strings = off");

$tables = extractTableNames($dump);
dropTables($pdo, $tables);

foreach (extractCreateStatements($dump) as $statement) {
    execSql($pdo, convertCreateTable($statement));
}

foreach (extractInsertStatements($dump) as $statement) {
    execSql($pdo, convertInsert($statement));
}

foreach (extractPrimaryKeys($dump) as $statement) {
    execSql($pdo, $statement, true);
}

foreach (extractUniqueKeys($dump) as $statement) {
    execSql($pdo, $statement, true);
}

foreach (extractAutoIncrements($dump) as $autoIncrement) {
    [$table, $column, $nextValue] = $autoIncrement;
    $sequence = "{$table}_{$column}_seq";
    execSql($pdo, sprintf('CREATE SEQUENCE IF NOT EXISTS "%s"', $sequence), true);
    execSql($pdo, sprintf('ALTER TABLE "%s" ALTER COLUMN "%s" SET DEFAULT nextval(' . "'%s'" . ')', $table, $column, $sequence), true);
    execSql($pdo, sprintf('ALTER SEQUENCE "%s" OWNED BY "%s"."%s"', $sequence, $table, $column), true);
    execSql($pdo, sprintf(
        'SELECT setval(' . "'%s'" . ', GREATEST(COALESCE((SELECT MAX("%s") FROM "%s"), 0) + 1, %d), false)',
        $sequence,
        $column,
        $table,
        $nextValue
    ), true);
}

fwrite(STDOUT, "PostgreSQL import completed.\n");

function connectPg(): PDO
{
    $url = getenv('DATABASE_URL') ?: getenv('POSTGRES_URL') ?: '';
    if ($url) {
        $parts = parse_url($url);
        if (!$parts || empty($parts['host'])) {
            throw new RuntimeException('Invalid DATABASE_URL');
        }

        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s;sslmode=require',
            $parts['host'],
            (int) ($parts['port'] ?? 5432),
            ltrim($parts['path'] ?? '', '/')
        );

        return new PDO($dsn, rawurldecode($parts['user'] ?? ''), rawurldecode($parts['pass'] ?? ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    $dsn = sprintf(
        'pgsql:host=%s;port=%d;dbname=%s;sslmode=require',
        getenv('DB_HOST') ?: 'localhost',
        (int) (getenv('DB_PORT') ?: 5432),
        getenv('DB_NAME') ?: 'school_db'
    );

    return new PDO($dsn, getenv('DB_USER') ?: 'postgres', getenv('DB_PASS') ?: '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function databaseHasTables(PDO $pdo): bool
{
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
    return (int) $stmt->fetchColumn() > 0;
}

function extractTableNames(string $dump): array
{
    preg_match_all('/CREATE TABLE\s+`([^`]+)`/i', $dump, $matches);
    return array_values(array_unique($matches[1]));
}

function dropTables(PDO $pdo, array $tables): void
{
    if (!$tables) {
        return;
    }

    $quoted = array_map(fn($table) => '"' . str_replace('"', '""', $table) . '"', $tables);
    $pdo->exec('DROP TABLE IF EXISTS ' . implode(', ', $quoted) . ' CASCADE');
}

function extractCreateStatements(string $dump): array
{
    preg_match_all('/CREATE TABLE\s+`[^`]+`\s*\((.*?)\)\s*ENGINE=.*?;/is', $dump, $matches);
    $statements = [];
    foreach ($matches[0] as $statement) {
        $statements[] = $statement;
    }

    return $statements;
}

function extractInsertStatements(string $dump): array
{
    preg_match_all('/INSERT INTO\s+`[^`]+`\s*\([^)]+\)\s+VALUES\s+.*?;/is', $dump, $matches);
    return $matches[0] ?? [];
}

function convertCreateTable(string $statement): string
{
    preg_match('/CREATE TABLE\s+`([^`]+)`\s*\((.*)\)\s*ENGINE=/is', $statement, $matches);
    $table = $matches[1];
    $body = $matches[2];
    $columns = [];

    foreach (splitSqlLines($body) as $line) {
        $line = trim($line);
        if (!str_starts_with($line, '`')) {
            continue;
        }

        if (!preg_match('/^`([^`]+)`\s+(.+)$/s', $line, $columnMatch)) {
            continue;
        }

        $columns[] = '"' . $columnMatch[1] . '" ' . convertColumnDefinition($columnMatch[2]);
    }

    return 'CREATE TABLE "' . $table . "\" (\n  " . implode(",\n  ", $columns) . "\n)";
}

function splitSqlLines(string $body): array
{
    $lines = [];
    $current = '';
    $depth = 0;
    $inString = false;
    $length = strlen($body);

    for ($i = 0; $i < $length; $i++) {
        $char = $body[$i];
        if ($char === "'" && ($i === 0 || $body[$i - 1] !== '\\')) {
            $inString = !$inString;
        }
        if (!$inString && $char === '(') {
            $depth++;
        }
        if (!$inString && $char === ')') {
            $depth--;
        }
        if (!$inString && $char === ',' && $depth === 0) {
            $lines[] = $current;
            $current = '';
            continue;
        }
        $current .= $char;
    }

    if (trim($current) !== '') {
        $lines[] = $current;
    }

    return $lines;
}

function convertColumnDefinition(string $definition): string
{
    $definition = preg_replace('/\s+COMMENT\s+\'(?:\\\\\'|[^\'])*\'/i', '', $definition);
    $definition = preg_replace('/\s+COLLATE\s+\w+/i', '', $definition);
    $definition = preg_replace('/\s+CHARACTER SET\s+\w+/i', '', $definition);
    $definition = preg_replace('/\s+ON UPDATE\s+current_timestamp\(\)/i', '', $definition);
    $definition = preg_replace('/\bint\(\d+\)/i', 'integer', $definition);
    $definition = preg_replace('/\btinyint\(1\)/i', 'smallint', $definition);
    $definition = preg_replace('/\btinyint\(\d+\)/i', 'smallint', $definition);
    $definition = preg_replace('/\bbigint\(\d+\)/i', 'bigint', $definition);
    $definition = preg_replace('/\bdouble\b/i', 'double precision', $definition);
    $definition = preg_replace('/\bdatetime\b/i', 'timestamp', $definition);
    $definition = preg_replace('/\benum\([^)]+\)/i', 'varchar(255)', $definition);
    $definition = preg_replace('/\bAUTO_INCREMENT\b/i', '', $definition);
    $definition = preg_replace('/\bDEFAULT\s+current_timestamp\(\)/i', 'DEFAULT CURRENT_TIMESTAMP', $definition);
    $definition = preg_replace('/\bDEFAULT\s+current_timestamp\b/i', 'DEFAULT CURRENT_TIMESTAMP', $definition);

    return trim($definition);
}

function convertInsert(string $statement): string
{
    $statement = str_replace('`', '"', $statement);
    $statement = preg_replace('/\\bNULL\\b/i', 'NULL', $statement);

    return $statement;
}

function extractPrimaryKeys(string $dump): array
{
    preg_match_all('/ALTER TABLE\s+`([^`]+)`\s+(.*?);/is', $dump, $matches, PREG_SET_ORDER);
    $statements = [];

    foreach ($matches as $match) {
        $table = $match[1];
        if (preg_match('/ADD PRIMARY KEY\s+\(([^)]+)\)/i', $match[2], $pk)) {
            $columns = quoteColumnList($pk[1]);
            $statements[] = sprintf('ALTER TABLE "%s" ADD PRIMARY KEY (%s)', $table, $columns);
        }
    }

    return $statements;
}

function extractUniqueKeys(string $dump): array
{
    preg_match_all('/ALTER TABLE\s+`([^`]+)`\s+(.*?);/is', $dump, $matches, PREG_SET_ORDER);
    $statements = [];

    foreach ($matches as $match) {
        $table = $match[1];
        preg_match_all('/ADD UNIQUE KEY\s+`([^`]+)`\s+\(([^)]+)\)/i', $match[2], $uniqueMatches, PREG_SET_ORDER);
        foreach ($uniqueMatches as $unique) {
            $constraint = preg_replace('/[^a-zA-Z0-9_]/', '_', $table . '_' . $unique[1]);
            $statements[] = sprintf('ALTER TABLE "%s" ADD CONSTRAINT "%s" UNIQUE (%s)', $table, $constraint, quoteColumnList($unique[2]));
        }
    }

    return $statements;
}

function extractAutoIncrements(string $dump): array
{
    preg_match_all('/ALTER TABLE\s+`([^`]+)`\s+MODIFY\s+`([^`]+)`\s+.*?AUTO_INCREMENT(?:,\s*AUTO_INCREMENT=(\d+))?/is', $dump, $matches, PREG_SET_ORDER);
    $items = [];

    foreach ($matches as $match) {
        $items[] = [$match[1], $match[2], (int) ($match[3] ?? 1)];
    }

    return $items;
}

function quoteColumnList(string $columns): string
{
    preg_match_all('/`([^`]+)`/', $columns, $matches);
    return implode(', ', array_map(fn($column) => '"' . $column . '"', $matches[1]));
}

function execSql(PDO $pdo, string $sql, bool $ignoreFailure = false): void
{
    try {
        $pdo->exec($sql);
    } catch (Throwable $e) {
        if ($ignoreFailure) {
            fwrite(STDERR, "Warning: {$e->getMessage()}\n");
            return;
        }

        fwrite(STDERR, "SQL failed: {$e->getMessage()}\n{$sql}\n");
        exit(1);
    }
}

<?php

if (!defined('MYSQLI_ASSOC')) {
    define('MYSQLI_ASSOC', 1);
}

class PgCompatResult
{
    private array $rows;
    private int $cursor = 0;

    public int $num_rows;

    public function __construct(array $rows = [])
    {
        $this->rows = $rows;
        $this->num_rows = count($rows);
    }

    public function fetch_assoc(): ?array
    {
        if ($this->cursor >= count($this->rows)) {
            return null;
        }

        return $this->rows[$this->cursor++];
    }

    public function fetch_all(int $mode = MYSQLI_ASSOC): array
    {
        return $this->rows;
    }
}

class PgCompatStatement
{
    private PgCompatConnection $conn;
    private string $sql;
    private array $params = [];
    private ?PgCompatResult $result = null;

    public int $affected_rows = 0;
    public string $error = '';

    public function __construct(PgCompatConnection $conn, string $sql)
    {
        $this->conn = $conn;
        $this->sql = $sql;
    }

    public function bind_param(string $types, &...$params): bool
    {
        $this->params = $params;
        return true;
    }

    public function execute(): bool
    {
        try {
            [$sql, $params] = $this->conn->translatePreparedSql($this->sql, $this->params);
            $stmt = $this->conn->pdo()->prepare($sql);
            foreach ($params as $index => $value) {
                $stmt->bindValue($index + 1, $value);
            }
            $stmt->execute();
            $this->affected_rows = $stmt->rowCount();
            $this->result = str_starts_with(ltrim(strtoupper($sql)), 'SELECT')
                ? new PgCompatResult($stmt->fetchAll(PDO::FETCH_ASSOC))
                : new PgCompatResult();
            $this->conn->refreshInsertId();
            return true;
        } catch (Throwable $e) {
            $this->error = $e->getMessage();
            $this->conn->error = $this->error;
            return false;
        }
    }

    public function get_result(): PgCompatResult
    {
        return $this->result ?: new PgCompatResult();
    }
}

class PgCompatConnection
{
    private PDO $pdo;

    public string $error = '';
    public string $connect_error = '';
    public int $insert_id = 0;
    public int $affected_rows = 0;

    public static function fromUrl(string $url): self
    {
        $parts = parse_url($url);
        if (!$parts || empty($parts['host'])) {
            throw new RuntimeException('Invalid PostgreSQL DATABASE_URL');
        }

        $dbName = ltrim($parts['path'] ?? '', '/');
        return self::fromParts(
            $parts['host'],
            (int) ($parts['port'] ?? 5432),
            $dbName,
            rawurldecode($parts['user'] ?? ''),
            rawurldecode($parts['pass'] ?? '')
        );
    }

    public static function fromParts(string $host, int $port, string $dbName, string $user, string $pass): self
    {
        $dsn = "pgsql:host={$host};port={$port};dbname={$dbName};sslmode=require";
        return new self($dsn, $user, $pass);
    }

    public function __construct(string $dsn, string $user, string $pass)
    {
        try {
            $this->pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $this->pdo->exec("SET TIME ZONE 'UTC'");
        } catch (Throwable $e) {
            $this->connect_error = $e->getMessage();
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed: ' . $this->connect_error]));
        }
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    public function set_charset(string $charset): bool
    {
        return true;
    }

    public function prepare(string $sql): PgCompatStatement
    {
        return new PgCompatStatement($this, $sql);
    }

    public function query(string $sql)
    {
        try {
            $translated = $this->translateSql($sql);
            $stmt = $this->pdo->query($translated);
            $this->affected_rows = $stmt ? $stmt->rowCount() : 0;
            $this->refreshInsertId();

            if ($stmt && str_starts_with(ltrim(strtoupper($translated)), 'SELECT')) {
                return new PgCompatResult($stmt->fetchAll(PDO::FETCH_ASSOC));
            }

            return true;
        } catch (Throwable $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    public function translatePreparedSql(string $sql, array $params): array
    {
        $translated = $this->translateSql($sql);
        $out = '';
        $placeholder = 1;
        $length = strlen($translated);
        $inString = false;

        for ($i = 0; $i < $length; $i++) {
            $char = $translated[$i];
            if ($char === "'" && ($i === 0 || $translated[$i - 1] !== '\\')) {
                $inString = !$inString;
            }
            if ($char === '?' && !$inString) {
                $out .= '$' . $placeholder++;
            } else {
                $out .= $char;
            }
        }

        return [$out, array_values($params)];
    }

    public function translateSql(string $sql): string
    {
        $sql = trim($sql);
        $sql = str_replace('`', '', $sql);
        $sql = preg_replace('/\bCURDATE\(\)/i', 'CURRENT_DATE', $sql);
        $sql = preg_replace('/DATE_SUB\(\s*CURRENT_DATE\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/i', "CURRENT_DATE - INTERVAL '$1 day'", $sql);
        $sql = preg_replace('/\bcurrent_timestamp\(\)/i', 'CURRENT_TIMESTAMP', $sql);
        $sql = preg_replace('/\bNOW\(\)/i', 'CURRENT_TIMESTAMP', $sql);
        $sql = preg_replace('/\s+ENGINE\s*=\s*\w+.*$/is', '', $sql);
        $sql = preg_replace('/\s+COMMENT\s+\'(?:\\\\\'|[^\'])*\'/i', '', $sql);
        $sql = preg_replace('/\s+ON UPDATE\s+CURRENT_TIMESTAMP/i', '', $sql);
        $sql = $this->translateCreateTable($sql);
        $sql = $this->translateFieldOrder($sql);
        $sql = $this->translateUpsert($sql);

        return $sql;
    }

    private function translateCreateTable(string $sql): string
    {
        if (!preg_match('/^CREATE TABLE/i', $sql)) {
            return $sql;
        }

        $sql = preg_replace('/\bint\(\d+\)/i', 'integer', $sql);
        $sql = preg_replace('/\btinyint\(1\)/i', 'smallint', $sql);
        $sql = preg_replace('/\bdatetime\b/i', 'timestamp', $sql);
        $sql = preg_replace('/\benum\([^)]+\)/i', 'varchar(255)', $sql);
        $sql = preg_replace('/\bAUTO_INCREMENT\b/i', '', $sql);
        $sql = preg_replace('/\bDEFAULT\s+current_timestamp\b/i', 'DEFAULT CURRENT_TIMESTAMP', $sql);

        return $sql;
    }

    private function translateFieldOrder(string $sql): string
    {
        return preg_replace_callback('/FIELD\(\s*([a-zA-Z0-9_\.]+)\s*,\s*([^)]+)\)/', function ($matches) {
            $column = $matches[1];
            preg_match_all("/'((?:\\\\'|[^'])*)'/", $matches[2], $values);
            $case = "CASE {$column}";
            foreach ($values[1] as $index => $value) {
                $case .= " WHEN '" . str_replace("'", "''", $value) . "' THEN " . ($index + 1);
            }
            return $case . ' ELSE 999 END';
        }, $sql);
    }

    private function translateUpsert(string $sql): string
    {
        if (!str_contains(strtoupper($sql), 'ON DUPLICATE KEY UPDATE')) {
            return $sql;
        }

        if (preg_match('/INSERT INTO attendance/i', $sql)) {
            return preg_replace(
                '/ON DUPLICATE KEY UPDATE\s+status\s*=\s*VALUES\(status\)\s*,\s*notes\s*=\s*VALUES\(notes\)/i',
                'ON CONFLICT (student_id, att_date) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes',
                $sql
            );
        }

        if (preg_match('/INSERT INTO settings/i', $sql)) {
            return preg_replace(
                '/ON DUPLICATE KEY UPDATE\s+setting_value\s*=\s*VALUES\(setting_value\)/i',
                'ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
                $sql
            );
        }

        return preg_replace('/ON DUPLICATE KEY UPDATE.*$/is', '', $sql);
    }

    public function refreshInsertId(): void
    {
        try {
            $value = $this->pdo->query("SELECT lastval()")->fetchColumn();
            $this->insert_id = $value === false ? 0 : (int) $value;
        } catch (Throwable $e) {
            $this->insert_id = 0;
        }
    }
}

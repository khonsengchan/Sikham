param(
    [Parameter(Mandatory = $true)]
    [string] $ConnectionString,

    [Parameter(Mandatory = $true)]
    [string] $SqlFile,

    [string] $NpgsqlRoot = "C:\tmp\npgsql"
)

$ErrorActionPreference = "Stop"

$tasksDll = Join-Path $NpgsqlRoot "System.Threading.Tasks.Extensions.4.3.0\lib\portable-net45%2Bwin8%2Bwp8%2Bwpa81\System.Threading.Tasks.Extensions.dll"
$npgsqlDll = Join-Path $NpgsqlRoot "Npgsql.3.2.7\lib\net451\Npgsql.dll"

Add-Type -Path $tasksDll
Add-Type -Path $npgsqlDll

function Split-SqlStatements {
    param([string] $Sql)

    $statements = New-Object System.Collections.Generic.List[string]
    $current = New-Object System.Text.StringBuilder
    $inString = $false
    $length = $Sql.Length

    for ($i = 0; $i -lt $length; $i++) {
        $char = $Sql[$i]
        [void] $current.Append($char)

        if ($char -eq "'") {
            $prevIsBackslash = $i -gt 0 -and $Sql[$i - 1] -eq "\"
            $nextIsQuote = ($i + 1) -lt $length -and $Sql[$i + 1] -eq "'"

            if (-not $prevIsBackslash) {
                if ($inString -and $nextIsQuote) {
                    $i++
                    [void] $current.Append($Sql[$i])
                    continue
                }

                $inString = -not $inString
            }
        }

        if ($char -eq ";" -and -not $inString) {
            $statement = $current.ToString().Trim()
            if ($statement.Length -gt 1) {
                $statements.Add($statement.TrimEnd(";")) | Out-Null
            }
            $current.Clear() | Out-Null
        }
    }

    $tail = $current.ToString().Trim()
    if ($tail.Length -gt 0) {
        $statements.Add($tail) | Out-Null
    }

    return $statements
}

$sql = [System.IO.File]::ReadAllText($SqlFile, [System.Text.Encoding]::UTF8)
$statements = Split-SqlStatements -Sql $sql

$conn = New-Object Npgsql.NpgsqlConnection($ConnectionString)
$conn.Open()

try {
    $index = 0
    foreach ($statement in $statements) {
        $index++
        if ([string]::IsNullOrWhiteSpace($statement)) {
            continue
        }

        $cmd = $conn.CreateCommand()
        $cmd.CommandTimeout = 300
        $cmd.CommandText = $statement

        try {
            [void] $cmd.ExecuteNonQuery()
            Write-Output "OK $index/$($statements.Count)"
        } catch {
            Write-Error "Failed at statement $index/$($statements.Count): $($_.Exception.Message)`n$statement"
            throw
        }
    }
} finally {
    $conn.Close()
}

Write-Output "Import completed: $($statements.Count) statements."

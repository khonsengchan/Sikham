# Sikham

## Render deploy

Set `DATABASE_URL` to the Render PostgreSQL internal/external connection string.

The Docker container installs PostgreSQL PHP extensions and imports `school_db.sql`
on first startup when the database is empty. To disable this behavior, set
`IMPORT_DB_ON_START=false`.

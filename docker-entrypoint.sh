#!/bin/sh
set -e

PORT="${PORT:-10000}"

sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

if [ "${IMPORT_DB_ON_START:-true}" = "true" ] && [ -n "${DATABASE_URL:-}" ] && [ -f /var/www/import/school_db.sql ]; then
    php /var/www/html/scripts/import_mysql_dump_to_pg.php --if-empty /var/www/import/school_db.sql
fi

if [ "${ENSURE_ADMIN_ON_START:-true}" = "true" ]; then
    php /var/www/html/scripts/ensure_admin_user.php
fi

exec "$@"

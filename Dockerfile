FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev libzip-dev unzip \
    && docker-php-ext-install mysqli pdo pdo_mysql pgsql pdo_pgsql zip \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . /var/www/html/
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /var/www/import \
    && if [ -f /var/www/html/school_db.sql ]; then mv /var/www/html/school_db.sql /var/www/import/school_db.sql; fi \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/assets/uploads

EXPOSE 10000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]

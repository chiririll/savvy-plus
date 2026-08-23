FROM node:24-alpine AS frontend
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources ./resources
COPY vite.config.ts ./
RUN npm run build

FROM composer:2.8 AS backend
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader
COPY . .
RUN composer dump-autoload --optimize

FROM php:8.4-fpm-alpine
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

# hadolint ignore=DL3018
RUN apk upgrade --no-cache \
    && apk add --no-cache nginx supervisor sqlite \
    && apk add --no-cache --virtual .build-deps sqlite-dev libcap \
    && docker-php-ext-install pdo pdo_sqlite bcmath \
    && setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/* /tmp/*

WORKDIR /var/www/html

RUN chown www-data:www-data /var/www/html \
    && chown -R www-data:www-data /var/lib/nginx /var/log/nginx \
    && mkdir -p /data && chown www-data:www-data /data

COPY --chown=www-data:www-data --from=backend /app/vendor ./vendor
COPY --chown=www-data:www-data --from=backend /app/public ./public
COPY --chown=www-data:www-data --from=backend /app/bootstrap ./bootstrap
COPY --chown=www-data:www-data --from=backend /app/config ./config
COPY --chown=www-data:www-data --from=backend /app/routes ./routes
COPY --chown=www-data:www-data --from=backend /app/storage ./storage
COPY --chown=www-data:www-data --from=backend /app/resources ./resources
COPY --chown=www-data:www-data --from=backend /app/app ./app
COPY --chown=www-data:www-data --from=backend /app/artisan ./artisan
COPY --chown=www-data:www-data --from=backend /app/database ./database
COPY --chown=www-data:www-data --from=backend /app/composer.json ./composer.json

COPY --chown=www-data:www-data --from=frontend /app/public/build ./public/build

COPY docker/nginx-main.conf /etc/nginx/nginx.conf
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME /data
EXPOSE 80
USER www-data
ENTRYPOINT ["/entrypoint.sh"]

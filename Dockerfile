FROM ghcr.io/dunglas/frankenphp:latest

WORKDIR /srv/app

# Copy application files
COPY . /srv/app

# Install PHP dependencies if composer.json exists
RUN if [ -f composer.json ]; then composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist; fi

# FrankenPHP listens on this port by default in many examples
ENV FRANKENPHP_LISTEN=0.0.0.0:8080

EXPOSE 8080

CMD ["frankenphp"]

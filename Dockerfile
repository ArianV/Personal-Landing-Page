FROM php:8.2-cli

WORKDIR /srv/app

# Install system deps needed by composer / optional PHP extensions
RUN apt-get update && apt-get install -y unzip git curl libzip-dev \
  && docker-php-ext-install zip \
  && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . /srv/app

# Install PHP dependencies
RUN if [ -f composer.json ]; then composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist; fi

EXPOSE 8080

# Use PHP built-in server (sufficient for small/low-traffic apps)
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]

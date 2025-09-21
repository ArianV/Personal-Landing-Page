<?php
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();

// Don't hard-code a base path. In environments where your app is served
// from a sub-path set the BASE_PATH env var (for example: /arian/public).
// Otherwise leave it unset so Slim uses the default root path.
$basePath = getenv('BASE_PATH');
if ($basePath && is_string($basePath) && $basePath !== '') {
    $app->setBasePath($basePath);
}

// Home route
$app->get('/', function ($request, $response, $args) {
    require __DIR__ . '/../app/views/home.php';
    return $response;
});

// About route
$app->get('/about', function ($request, $response, $args) {
    require __DIR__ . '/../app/views/about.php';
    return $response;
});

// Projects route
$app->get('/projects', function ($request, $response, $args) {
    require __DIR__ . '/../app/views/projects.php';
    return $response;
});

// Skills route
$app->get('/skills', function ($request, $response, $args) {
    require __DIR__ . '/../app/views/skills.php';
    return $response;
});

// Contact route
$app->get('/contact', function ($request, $response, $args) {
    require __DIR__ . '/../app/views/contact.php';
    return $response;
});

$app->run();

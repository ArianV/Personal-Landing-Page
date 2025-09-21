<?php
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();
$app->setBasePath('/arian/public');

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

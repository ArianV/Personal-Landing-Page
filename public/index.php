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

// Contact form submission endpoint for deployed environments (forwards to Discord webhook)
$app->post('/contact', function ($request, $response, $args) {
    $body = (string) $request->getBody();
    $data = json_decode($body, true);
    if (!is_array($data)) {
        // If body wasn't JSON, attempt to parse form-encoded body
        $data = $request->getParsedBody();
        if (!is_array($data)) {
            $payload = ['error' => 'Invalid request body'];
            $response->getBody()->write(json_encode($payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    $website = isset($data['website']) ? trim($data['website']) : '';
    $name = isset($data['name']) ? trim($data['name']) : '';
    $email = isset($data['email']) ? trim($data['email']) : '';
    $message = isset($data['message']) ? trim($data['message']) : '';

    if ($website !== '') {
        $payload = ['error' => 'Bot detected'];
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }
    if ($name === '' || $email === '' || $message === '') {
        $payload = ['error' => 'Missing fields'];
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    $webhook = getenv('DISCORD_WEBHOOK_URL');
    if (!$webhook) {
        $payload = ['error' => 'Server not configured'];
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }

    $embeds = [[
        'title' => '📨 New Contact Form Submission',
        'color' => 7000000,
        'fields' => [
            ['name' => 'Name', 'value' => $name, 'inline' => true],
            ['name' => 'Email', 'value' => $email, 'inline' => true],
            ['name' => 'Message', 'value' => $message],
        ],
        'timestamp' => date('c'),
    ]];

    $payload = json_encode(['username' => 'Website Bot', 'embeds' => $embeds]);

    // send to Discord webhook using cURL
    $ch = curl_init($webhook);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($result === false) {
        $payload = ['error' => 'Failed to reach Discord'];
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(502);
    }
    if ($httpCode < 200 || $httpCode >= 300) {
        $payload = ['error' => "Discord error: HTTP {$httpCode} - {$result}"];
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($httpCode ?: 502);
    }

    $response->getBody()->write(json_encode(['status' => 'sent']));
    return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
});

$app->run();

<?php
// Simple Router for REST API
require_once 'config.php';

$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove /backend prefix if present
$path = str_replace('/backend', '', $path);
$path = trim($path, '/');

// Route to appropriate API file
if (strpos($path, 'api/accounts') === 0 || $path === 'accounts.php') {
    $_SERVER['REQUEST_URI'] = '/api/' . $path;
    require_once 'api/accounts.php';
} elseif (strpos($path, 'api/goals') === 0 || $path === 'goals.php') {
    $_SERVER['REQUEST_URI'] = '/api/' . $path;
    require_once 'api/goals.php';
} elseif (strpos($path, 'api/transactions') === 0 || $path === 'transactions.php') {
    $_SERVER['REQUEST_URI'] = '/api/' . $path;
    require_once 'api/transactions.php';
} else {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Endpoint not found'
    ]);
}


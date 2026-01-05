<?php
/**
 * CORS Headers Handler
 * Include this at the very top of API files to ensure CORS headers are set
 */

// Start output buffering to prevent any accidental output
if (!ob_get_level()) {
    ob_start();
}

// Set CORS headers - MUST be before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit();
}

// Clear output buffer (in case there was any accidental output)
ob_end_clean();


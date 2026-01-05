<?php
/**
 * Test Accounts Endpoint - CORS Verification
 * Use this to test if CORS is working correctly
 * Access: http://localhost/backend/api/test_accounts.php
 */

// Set CORS headers FIRST
require_once 'cors_headers.php';
require_once '../config.php';

// Simple test endpoint
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        echo json_encode([
            'success' => true,
            'message' => 'CORS is working! Accounts API is accessible.',
            'method' => 'GET',
            'headers_sent' => [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode([
            'success' => true,
            'message' => 'CORS is working! POST request received.',
            'method' => 'POST',
            'received_data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
        
    case 'OPTIONS':
        // Already handled by cors_headers.php, but echo confirmation
        echo json_encode([
            'success' => true,
            'message' => 'OPTIONS preflight handled correctly'
        ]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed: ' . $method
        ]);
}


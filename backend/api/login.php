<?php
// Set CORS headers FIRST - before any other code
require_once 'cors_headers.php';

// Now require config
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $conn = getDBConnection();
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit();
    }

    $username = $conn->real_escape_string($data['username']);
    $password = $data['password'];

    // Find user
    $stmt = $conn->prepare("SELECT UserID, Username, PasswordHash, FullName, Email FROM Users WHERE Username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['PasswordHash'])) {
            unset($user['PasswordHash']); // Don't send hash back
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => $user
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid password'
            ]);
        }
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
    }
    $stmt->close();
    $conn->close();
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

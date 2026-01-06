<?php
// Set CORS headers FIRST - before any other code
require_once 'cors_headers.php';

// Now require config
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $conn = getDBConnection();
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['username']) || !isset($data['password']) || !isset($data['fullName'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username, password, and full name are required'
        ]);
        exit();
    }

    $username = $conn->real_escape_string($data['username']);
    $password = $data['password'];
    $fullName = $conn->real_escape_string($data['fullName']);
    $email = isset($data['email']) ? $conn->real_escape_string($data['email']) : null;
    $phone = isset($data['phone']) ? $conn->real_escape_string($data['phone']) : null;
    $address = isset($data['address']) ? $conn->real_escape_string($data['address']) : null;

    // Check if username already exists
    $stmt = $conn->prepare("SELECT UserID FROM Users WHERE Username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists'
        ]);
        exit();
    }
    $stmt->close();

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO Users (Username, PasswordHash, FullName, Email, PhoneNumber, Address) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $username, $passwordHash, $fullName, $email, $phone, $address);

    if ($stmt->execute()) {
        $userId = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'UserID' => $userId,
                'Username' => $username,
                'FullName' => $fullName
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Registration failed: ' . $conn->error
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

<?php
require_once 'cors_headers.php';
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

if ($method === 'GET') {
    // List all users
    $result = $conn->query("SELECT UserID, Username, FullName, Email, PhoneNumber, Address, Role, CreatedAt FROM Users ORDER BY CreatedAt DESC");
    $users = [];
    while ($row = $result->fetch_assoc()) { $users[] = $row; }
    echo json_encode(['success' => true, 'data' => $users]);
} elseif ($method === 'DELETE') {
    // Delete user
    $userId = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit();
    }
    
    $stmt = $conn->prepare("DELETE FROM Users WHERE UserID = ?");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User deleted']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete user: ' . $stmt->error]);
    }
    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
$conn->close();
?>

<?php
// Set CORS headers FIRST - before any other code
require_once 'cors_headers.php';

// Now require config
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

$conn = getDBConnection();

// Parse URL to get account ID if present (support both path and query)
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$accountId = isset($pathParts[2]) ? intval($pathParts[2]) : null;

// Fallback to query parameter if path parsing fails
if (!$accountId && isset($_GET['id'])) {
    $accountId = intval($_GET['id']);
}

switch ($method) {
    case 'GET':
        if ($accountId) {
            // Get single account
            $stmt = $conn->prepare("SELECT * FROM Accounts WHERE AccountID = ?");
            $stmt->bind_param("i", $accountId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'data' => $result->fetch_assoc()
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Account not found'
                ]);
            }
            $stmt->close();
        } else {
            // Get all accounts
            $result = $conn->query("SELECT * FROM Accounts ORDER BY DateOpened DESC");
            $accounts = [];
            while ($row = $result->fetch_assoc()) {
                $accounts[] = $row;
            }
            echo json_encode([
                'success' => true,
                'data' => $accounts
            ]);
        }
        break;
        
    case 'POST':
        // Create new account
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['UserID']) || !isset($data['AccountType'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'UserID and AccountType are required'
            ]);
            break;
        }
        
        $userId = intval($data['UserID']);
        $accountType = $conn->real_escape_string($data['AccountType']);
        $allowedTypes = ['Savings', 'Current'];
        if (!in_array($accountType, $allowedTypes, true)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid AccountType. Allowed: Savings, Current'
            ]);
            break;
        }
        $currentBalance = isset($data['CurrentBalance']) ? floatval($data['CurrentBalance']) : 0.00;
        $dateOpened = isset($data['DateOpened']) ? $conn->real_escape_string($data['DateOpened']) : date('Y-m-d');
        
        $stmt = $conn->prepare("INSERT INTO Accounts (UserID, AccountType, CurrentBalance, DateOpened) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isds", $userId, $accountType, $currentBalance, $dateOpened);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Account created successfully',
                'data' => [
                    'AccountID' => $conn->insert_id,
                    'UserID' => $userId,
                    'AccountType' => $accountType,
                    'CurrentBalance' => $currentBalance,
                    'DateOpened' => $dateOpened
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create account: ' . $stmt->error
            ]);
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // Update account
        if (!$accountId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'AccountID is required'
            ]);
            break;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $updates = [];
        $params = [];
        $types = '';
        
        if (isset($data['AccountType'])) {
            $newType = $conn->real_escape_string($data['AccountType']);
            $allowedTypes = ['Savings', 'Current'];
            if (!in_array($newType, $allowedTypes, true)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid AccountType. Allowed: Savings, Current'
                ]);
                break;
            }
            $updates[] = "AccountType = ?";
            $params[] = $newType;
            $types .= 's';
        }
        
        if (isset($data['CurrentBalance'])) {
            $updates[] = "CurrentBalance = ?";
            $params[] = floatval($data['CurrentBalance']);
            $types .= 'd';
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No fields to update'
            ]);
            break;
        }
        
        $sql = "UPDATE Accounts SET " . implode(', ', $updates) . " WHERE AccountID = ?";
        $params[] = $accountId;
        $types .= 'i';
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Account updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update account: ' . $stmt->error
            ]);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete account
        if (!$accountId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'AccountID is required'
            ]);
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM Accounts WHERE AccountID = ?");
        $stmt->bind_param("i", $accountId);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Account deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete account: ' . $stmt->error
            ]);
        }
        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
}
$conn->close();


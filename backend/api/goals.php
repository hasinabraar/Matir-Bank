<?php
// Set CORS headers FIRST - before any other code
require_once 'cors_headers.php';

// Now require config
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

// Parse URL to get goal ID if present (support both path and query)
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$goalId = isset($pathParts[2]) ? intval($pathParts[2]) : null;

// Fallback to query parameter if path parsing fails
if (!$goalId && isset($_GET['id'])) {
    $goalId = intval($_GET['id']);
}

// Get accountId from query string
$accountId = isset($_GET['accountId']) ? intval($_GET['accountId']) : null;

switch ($method) {
    case 'GET':
        if ($goalId) {
            // Get single goal
            $stmt = $conn->prepare("SELECT * FROM Savings_Goals WHERE GoalID = ?");
            $stmt->bind_param("i", $goalId);
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
                    'message' => 'Goal not found'
                ]);
            }
            $stmt->close();
        } else {
            // Get goals (optionally filtered by accountId)
            if ($accountId) {
                $stmt = $conn->prepare("SELECT * FROM Savings_Goals WHERE AccountID = ? ORDER BY Deadline ASC");
                $stmt->bind_param("i", $accountId);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $conn->query("SELECT * FROM Savings_Goals ORDER BY Deadline ASC");
            }
            
            $goals = [];
            while ($row = $result->fetch_assoc()) {
                $goals[] = $row;
            }
            echo json_encode([
                'success' => true,
                'data' => $goals
            ]);
            
            if ($accountId) {
                $stmt->close();
            }
        }
        break;
        
    case 'POST':
        // Create new goal
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['AccountID']) || !isset($data['TargetAmount'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'AccountID and TargetAmount are required'
            ]);
            break;
        }
        
        $accountId = intval($data['AccountID']);
        $targetAmount = floatval($data['TargetAmount']);
        $savedAmount = isset($data['SavedAmount']) ? floatval($data['SavedAmount']) : 0.00;
        $deadline = isset($data['Deadline']) ? $conn->real_escape_string($data['Deadline']) : null;
        $status = isset($data['Status']) ? $conn->real_escape_string($data['Status']) : 'Active';
        
        $stmt = $conn->prepare("INSERT INTO Savings_Goals (AccountID, TargetAmount, SavedAmount, Deadline, Status) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iddss", $accountId, $targetAmount, $savedAmount, $deadline, $status);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Goal created successfully',
                'data' => [
                    'GoalID' => $conn->insert_id,
                    'AccountID' => $accountId,
                    'TargetAmount' => $targetAmount,
                    'SavedAmount' => $savedAmount,
                    'Deadline' => $deadline,
                    'Status' => $status
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create goal: ' . $stmt->error
            ]);
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // Update goal
        if (!$goalId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'GoalID is required'
            ]);
            break;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $updates = [];
        $params = [];
        $types = '';
        
        if (isset($data['TargetAmount'])) {
            $updates[] = "TargetAmount = ?";
            $params[] = floatval($data['TargetAmount']);
            $types .= 'd';
        }
        
        if (isset($data['SavedAmount'])) {
            $updates[] = "SavedAmount = ?";
            $params[] = floatval($data['SavedAmount']);
            $types .= 'd';
        }
        
        if (isset($data['Deadline'])) {
            $updates[] = "Deadline = ?";
            $params[] = $conn->real_escape_string($data['Deadline']);
            $types .= 's';
        }
        
        if (isset($data['Status'])) {
            $updates[] = "Status = ?";
            $params[] = $conn->real_escape_string($data['Status']);
            $types .= 's';
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No fields to update'
            ]);
            break;
        }
        
        $sql = "UPDATE Savings_Goals SET " . implode(', ', $updates) . " WHERE GoalID = ?";
        $params[] = $goalId;
        $types .= 'i';
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Goal updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update goal: ' . $stmt->error
            ]);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete goal
        if (!$goalId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'GoalID is required'
            ]);
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM Savings_Goals WHERE GoalID = ?");
        $stmt->bind_param("i", $goalId);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Goal deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete goal: ' . $stmt->error
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


<?php
// Set CORS headers FIRST - before any other code
require_once 'cors_headers.php';

// Now require config
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

// Parse URL to get transaction ID if present (support both path and query)
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$transId = isset($pathParts[2]) ? intval($pathParts[2]) : null;

// Fallback to query parameter if path parsing fails
if (!$transId && isset($_GET['id'])) {
    $transId = intval($_GET['id']);
}

// Get accountId from query string
$accountId = isset($_GET['accountId']) ? intval($_GET['accountId']) : null;

switch ($method) {
    case 'GET':
        if ($transId) {
            // Get single transaction
            $stmt = $conn->prepare("SELECT * FROM Transactions WHERE TransID = ?");
            $stmt->bind_param("i", $transId);
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
                    'message' => 'Transaction not found'
                ]);
            }
            $stmt->close();
        } else {
            // Get transactions (optionally filtered by accountId)
            if ($accountId) {
                $stmt = $conn->prepare("SELECT * FROM Transactions WHERE AccountID = ? ORDER BY Timestamp DESC");
                $stmt->bind_param("i", $accountId);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $conn->query("SELECT * FROM Transactions ORDER BY Timestamp DESC");
            }
            
            $transactions = [];
            while ($row = $result->fetch_assoc()) {
                $transactions[] = $row;
            }
            echo json_encode([
                'success' => true,
                'data' => $transactions
            ]);
            
            if ($accountId) {
                $stmt->close();
            }
        }
        break;
        
    case 'POST':
        // Create new transaction (deposit)
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['AccountID']) || !isset($data['Amount'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'AccountID and Amount are required'
            ]);
            break;
        }
        
        $accountId = intval($data['AccountID']);
        $amount = floatval($data['Amount']);
        $type = isset($data['Type']) ? $conn->real_escape_string($data['Type']) : 'Deposit';
        $referenceId = isset($data['ReferenceID']) ? $conn->real_escape_string($data['ReferenceID']) : null;
        
        // Validate amount
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Amount must be greater than 0'
            ]);
            break;
        }
        
        // Verify account exists
        $checkStmt = $conn->prepare("SELECT AccountID FROM Accounts WHERE AccountID = ?");
        $checkStmt->bind_param("i", $accountId);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Account not found'
            ]);
            $checkStmt->close();
            break;
        }
        $checkStmt->close();
        
        // Insert transaction (trigger will update balance and goals)
        $stmt = $conn->prepare("INSERT INTO Transactions (AccountID, Amount, Type, ReferenceID) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("idss", $accountId, $amount, $type, $referenceId);
        
        if ($stmt->execute()) {
            // Get updated account balance
            $balanceStmt = $conn->prepare("SELECT CurrentBalance FROM Accounts WHERE AccountID = ?");
            $balanceStmt->bind_param("i", $accountId);
            $balanceStmt->execute();
            $balanceResult = $balanceStmt->get_result();
            $account = $balanceResult->fetch_assoc();
            $balanceStmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => 'Transaction created successfully',
                'data' => [
                    'TransID' => $conn->insert_id,
                    'AccountID' => $accountId,
                    'Amount' => $amount,
                    'Type' => $type,
                    'ReferenceID' => $referenceId,
                    'UpdatedBalance' => $account['CurrentBalance']
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create transaction: ' . $stmt->error
            ]);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete transaction
        if (!$transId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'TransID is required'
            ]);
            break;
        }
        
        // Get transaction details before deletion for balance reversal
        $getStmt = $conn->prepare("SELECT AccountID, Amount FROM Transactions WHERE TransID = ?");
        $getStmt->bind_param("i", $transId);
        $getStmt->execute();
        $getResult = $getStmt->get_result();
        
        if ($getResult->num_rows === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Transaction not found'
            ]);
            $getStmt->close();
            break;
        }
        
        $trans = $getResult->fetch_assoc();
        $getStmt->close();
        
        // Delete transaction
        $stmt = $conn->prepare("DELETE FROM Transactions WHERE TransID = ?");
        $stmt->bind_param("i", $transId);
        
        if ($stmt->execute()) {
            // Manually reverse balance update (since trigger only works on INSERT)
            $reverseStmt = $conn->prepare("UPDATE Accounts SET CurrentBalance = CurrentBalance - ? WHERE AccountID = ?");
            $reverseStmt->bind_param("di", $trans['Amount'], $trans['AccountID']);
            $reverseStmt->execute();
            
            // Reverse goal progress
            $goalStmt = $conn->prepare("UPDATE Savings_Goals SET SavedAmount = SavedAmount - ? WHERE AccountID = ? AND Status = 'Active'");
            $goalStmt->bind_param("di", $trans['Amount'], $trans['AccountID']);
            $goalStmt->execute();
            $goalStmt->close();
            $reverseStmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => 'Transaction deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete transaction: ' . $stmt->error
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


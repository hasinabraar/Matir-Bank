<?php
require_once 'cors_headers.php';
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

$action = isset($_GET['action']) ? $_GET['action'] : null;

if ($method === 'GET' && !$action) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Action is required']);
    exit();
}

switch ($action) {
    case 'groups':
        switch ($method) {
            case 'GET':
                $result = $conn->query("SELECT * FROM Samity_Groups ORDER BY CreationDate DESC");
                $groups = [];
                while ($row = $result->fetch_assoc()) { $groups[] = $row; }
                echo json_encode(['success' => true, 'data' => $groups]);
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['GroupName']) || !isset($data['LeaderID'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'GroupName and LeaderID are required']);
                    break;
                }
                $stmt = $conn->prepare("INSERT INTO Samity_Groups (GroupName, LeaderID) VALUES (?, ?)");
                $stmt->bind_param("si", $data['GroupName'], $data['LeaderID']);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'data' => ['GroupID' => $conn->insert_id]]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to create group: ' . $stmt->error]);
                }
                $stmt->close();
                break;
            default:
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;

    case 'members':
        switch ($method) {
            case 'GET':
                $groupId = isset($_GET['groupId']) ? intval($_GET['groupId']) : null;
                if ($groupId) {
                    $stmt = $conn->prepare("SELECT * FROM Group_Members WHERE GroupID = ? ORDER BY JoinDate DESC");
                    $stmt->bind_param("i", $groupId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                } else {
                    $result = $conn->query("SELECT * FROM Group_Members ORDER BY JoinDate DESC");
                }
                $members = [];
                while ($row = $result->fetch_assoc()) { $members[] = $row; }
                echo json_encode(['success' => true, 'data' => $members]);
                if ($groupId) { $stmt->close(); }
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['GroupID']) || !isset($data['UserID'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'GroupID and UserID are required']);
                    break;
                }
                $role = isset($data['Role']) ? $data['Role'] : 'Member';
                $stmt = $conn->prepare("INSERT INTO Group_Members (GroupID, UserID, Role) VALUES (?, ?, ?)");
                $stmt->bind_param("iis", $data['GroupID'], $data['UserID'], $role);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'data' => ['MembershipID' => $conn->insert_id]]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to add member: ' . $stmt->error]);
                }
                $stmt->close();
                break;
            case 'DELETE':
                $membershipId = isset($_GET['id']) ? intval($_GET['id']) : null;
                if (!$membershipId) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'MembershipID is required']);
                    break;
                }
                $stmt = $conn->prepare("DELETE FROM Group_Members WHERE MembershipID = ?");
                $stmt->bind_param("i", $membershipId);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Member removed']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to remove member: ' . $stmt->error]);
                }
                $stmt->close();
                break;
            default:
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;

    case 'policies':
        switch ($method) {
            case 'GET':
                $groupId = isset($_GET['groupId']) ? intval($_GET['groupId']) : null;
                if ($groupId) {
                    $stmt = $conn->prepare("SELECT * FROM Group_Policies WHERE GroupID = ?");
                    $stmt->bind_param("i", $groupId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                } else {
                    $result = $conn->query("SELECT * FROM Group_Policies");
                }
                $policies = [];
                while ($row = $result->fetch_assoc()) { $policies[] = $row; }
                echo json_encode(['success' => true, 'data' => $policies]);
                if ($groupId) { $stmt->close(); }
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['GroupID']) || !isset($data['MaxLoanAmount']) || !isset($data['InterestRate'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'GroupID, MaxLoanAmount, InterestRate are required']);
                    break;
                }
                $groupId = intval($data['GroupID']);
                $maxLoan = floatval($data['MaxLoanAmount']);
                $rate = floatval($data['InterestRate']);
                if ($maxLoan < 0 || $rate < 0 || $rate > 100) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid policy values']);
                    break;
                }
                $stmt = $conn->prepare("INSERT INTO Group_Policies (GroupID, MaxLoanAmount, InterestRate) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE MaxLoanAmount = VALUES(MaxLoanAmount), InterestRate = VALUES(InterestRate)");
                $stmt->bind_param("idd", $groupId, $maxLoan, $rate);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Policy set']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to set policy: ' . $stmt->error]);
                }
                $stmt->close();
                break;
            default:
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;

    case 'eligibility':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['UserID']) || !isset($data['RequestedAmount']) || !isset($data['RequestedRate'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'UserID, RequestedAmount, RequestedRate are required']);
            break;
        }
        $userId = intval($data['UserID']);
        $requestedAmount = floatval($data['RequestedAmount']);
        $requestedRate = floatval($data['RequestedRate']);

        $stmt = $conn->prepare("SELECT GroupID FROM Group_Members WHERE UserID = ? LIMIT 1");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0) {
            echo json_encode(['success' => true, 'eligible' => false, 'message' => 'User not in any Samity']);
            $stmt->close();
            break;
        }
        $group = $res->fetch_assoc();
        $stmt->close();

        $groupId = intval($group['GroupID']);

        $policyStmt = $conn->prepare("SELECT MaxLoanAmount, InterestRate FROM Group_Policies WHERE GroupID = ?");
        $policyStmt->bind_param("i", $groupId);
        $policyStmt->execute();
        $policyRes = $policyStmt->get_result();
        if ($policyRes->num_rows === 0) {
            echo json_encode(['success' => true, 'eligible' => false, 'message' => 'Group policy not set']);
            $policyStmt->close();
            break;
        }
        $policy = $policyRes->fetch_assoc();
        $policyStmt->close();

        $collateralSql = "
            SELECT 1
            FROM Transactions t
            JOIN Accounts a ON a.AccountID = t.AccountID
            JOIN Group_Members gm ON gm.UserID = a.UserID
            WHERE gm.GroupID = ?
              AND t.Type = 'LoanDefault'
            LIMIT 1
        ";
        $collateralStmt = $conn->prepare($collateralSql);
        $collateralStmt->bind_param("i", $groupId);
        $collateralStmt->execute();
        $collateralHasDefault = $collateralStmt->get_result()->num_rows > 0;
        $collateralStmt->close();

        if ($collateralHasDefault) {
            echo json_encode([
                'success' => true,
                'eligible' => false,
                'blocked' => true,
                'message' => 'Group member has a defaulted loan'
            ]);
            break;
        }

        $withinPolicy = ($requestedAmount <= floatval($policy['MaxLoanAmount'])) && ($requestedRate <= floatval($policy['InterestRate']));
        echo json_encode([
            'success' => true,
            'eligible' => $withinPolicy,
            'blocked' => false,
            'policy' => $policy
        ]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

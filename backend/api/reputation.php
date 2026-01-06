<?php
require_once 'cors_headers.php';
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$userId = isset($_GET['userId']) ? intval($_GET['userId']) : null;

if ($userId) {
    $stmt = $conn->prepare("SELECT * FROM User_Reputation WHERE UserID = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $repRes = $stmt->get_result();
    $reputation = $repRes->num_rows ? $repRes->fetch_assoc() : ['UserID' => $userId, 'CreditScore' => 0];
    $stmt->close();
} else {
    $result = $conn->query("SELECT * FROM User_Reputation");
    $reputation = [];
    while ($row = $result->fetch_assoc()) { $reputation[] = $row; }
}

function getTier($conn, $score) {
    $stmt = $conn->prepare("SELECT TierLevel, MinScore, MaxLoanLimit FROM Credit_Tiers WHERE MinScore <= ? ORDER BY TierLevel DESC LIMIT 1");
    $stmt->bind_param("d", $score);
    $stmt->execute();
    $res = $stmt->get_result();
    $tier = $res->num_rows ? $res->fetch_assoc() : null;
    $stmt->close();
    return $tier;
}

if ($userId) {
    $tier = getTier($conn, floatval($reputation['CreditScore']));
    echo json_encode(['success' => true, 'data' => ['reputation' => $reputation, 'tier' => $tier]]);
} else {
    $withTier = [];
    foreach ($reputation as $row) {
        $row['tier'] = getTier($conn, floatval($row['CreditScore']));
        $withTier[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $withTier]);
}

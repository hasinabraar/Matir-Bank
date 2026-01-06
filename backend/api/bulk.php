<?php
require_once 'cors_headers.php';
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();
$action = isset($_GET['action']) ? $_GET['action'] : null;

switch ($action) {
    case 'suppliers':
        if ($method === 'GET') {
            $result = $conn->query("SELECT * FROM Suppliers ORDER BY SupplierID DESC");
            $data = [];
            while ($row = $result->fetch_assoc()) { $data[] = $row; }
            echo json_encode(['success' => true, 'data' => $data]);
        } elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['Name']) || !isset($data['MinOrderQty']) || !isset($data['Category'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Name, MinOrderQty, Category are required']);
                break;
            }
            $stmt = $conn->prepare("INSERT INTO Suppliers (Name, MinOrderQty, Category) VALUES (?, ?, ?)");
            $minOrderQty = intval($data['MinOrderQty']);
            $stmt->bind_param("sis", $data['Name'], $minOrderQty, $data['Category']);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'data' => ['SupplierID' => $conn->insert_id]]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create supplier: ' . $stmt->error]);
            }
            $stmt->close();
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
    case 'requests':
        if ($method === 'GET') {
            $supplierId = isset($_GET['supplierId']) ? intval($_GET['supplierId']) : null;
            if ($supplierId) {
                $stmt = $conn->prepare("SELECT * FROM Individual_Requests WHERE SupplierID = ? ORDER BY ReqID DESC");
                $stmt->bind_param("i", $supplierId);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $conn->query("SELECT * FROM Individual_Requests ORDER BY ReqID DESC");
            }
            $data = [];
            while ($row = $result->fetch_assoc()) { $data[] = $row; }
            echo json_encode(['success' => true, 'data' => $data]);
            if ($supplierId) { $stmt->close(); }
        } elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['SupplierID']) || !isset($data['UserID']) || !isset($data['ReqQty']) || !isset($data['EstCost'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'SupplierID, UserID, ReqQty, EstCost are required']);
                break;
            }
            $stmt = $conn->prepare("INSERT INTO Individual_Requests (SupplierID, UserID, ReqQty, EstCost) VALUES (?, ?, ?, ?)");
            $supplierId = intval($data['SupplierID']);
            $userId = intval($data['UserID']);
            $reqQty = intval($data['ReqQty']);
            $estCost = floatval($data['EstCost']);
            $stmt->bind_param("iiid", $supplierId, $userId, $reqQty, $estCost);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'data' => ['ReqID' => $conn->insert_id]]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create request: ' . $stmt->error]);
            }
            $stmt->close();
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
    case 'create_master':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['SupplierID']) || !isset($data['WholesalePrice'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'SupplierID and WholesalePrice are required']);
            break;
        }
        $supplierId = intval($data['SupplierID']);
        $wholesalePrice = floatval($data['WholesalePrice']);

        $thStmt = $conn->prepare("
            SELECT SupplierID, SUM(ReqQty) AS total_qty
            FROM Individual_Requests
            WHERE SupplierID = ?
            GROUP BY SupplierID
            HAVING SUM(ReqQty) >= (SELECT MinOrderQty FROM Suppliers WHERE SupplierID = ?)
        ");
        $thStmt->bind_param("ii", $supplierId, $supplierId);
        $thStmt->execute();
        $thRes = $thStmt->get_result();
        if ($thRes->num_rows === 0) {
            echo json_encode(['success' => true, 'created' => false, 'message' => 'Threshold not met']);
            $thStmt->close();
            break;
        }
        $row = $thRes->fetch_assoc();
        $totalQty = intval($row['total_qty']);
        $thStmt->close();

        $conn->begin_transaction();
        try {
            $mstmt = $conn->prepare("INSERT INTO Bulk_Master_Orders (SupplierID, TotalQty, WholesalePrice, Status) VALUES (?, ?, ?, 'PENDING')");
            $mstmt->bind_param("iid", $supplierId, $totalQty, $wholesalePrice);
            if (!$mstmt->execute()) { throw new Exception('Failed to create master order: ' . $mstmt->error); }
            $masterId = $conn->insert_id;
            $mstmt->close();

            $ustmt = $conn->prepare("UPDATE Individual_Requests SET MasterID = ? WHERE SupplierID = ?");
            $ustmt->bind_param("ii", $masterId, $supplierId);
            if (!$ustmt->execute()) { throw new Exception('Failed to assign requests: ' . $ustmt->error); }
            $ustmt->close();

            $conn->commit();
            echo json_encode(['success' => true, 'created' => true, 'data' => ['MasterID' => $masterId, 'TotalQty' => $totalQty]]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

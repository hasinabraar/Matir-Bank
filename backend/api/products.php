<?php
require_once 'cors_headers.php';
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$prodId = isset($_GET['id']) ? intval($_GET['id']) : (isset($pathParts[2]) ? intval($pathParts[2]) : null);

switch ($method) {
    case 'GET':
        if ($prodId) {
            $stmt = $conn->prepare("SELECT * FROM Products WHERE ProdID = ?");
            $stmt->bind_param("i", $prodId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows > 0) {
                echo json_encode(['success' => true, 'data' => $result->fetch_assoc()]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
            }
            $stmt->close();
        } else {
            $result = $conn->query("SELECT * FROM Products ORDER BY ProdID DESC");
            $items = [];
            while ($row = $result->fetch_assoc()) { $items[] = $row; }
            echo json_encode(['success' => true, 'data' => $items]);
        }
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['SellerID']) || !isset($data['Category']) || !isset($data['PricePerUnit'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'SellerID, Category, PricePerUnit are required']);
            break;
        }
        $sellerId = intval($data['SellerID']);
        $category = $conn->real_escape_string($data['Category']);
        $price = floatval($data['PricePerUnit']);
        $stock = isset($data['StockQty']) ? intval($data['StockQty']) : 0;
        if ($price <= 0 || $stock < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid price or stock']);
            break;
        }
        $stmt = $conn->prepare("INSERT INTO Products (SellerID, Category, PricePerUnit, StockQty) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isdi", $sellerId, $category, $price, $stock);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'data' => ['ProdID' => $conn->insert_id]]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create product: ' . $stmt->error]);
        }
        $stmt->close();
        break;
    case 'PUT':
        if (!$prodId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ProdID is required']);
            break;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $updates = [];
        $params = [];
        $types = '';
        if (isset($data['Category'])) {
            $updates[] = "Category = ?";
            $params[] = $conn->real_escape_string($data['Category']);
            $types .= 's';
        }
        if (isset($data['PricePerUnit'])) {
            $updates[] = "PricePerUnit = ?";
            $params[] = floatval($data['PricePerUnit']);
            $types .= 'd';
        }
        if (isset($data['StockQty'])) {
            $updates[] = "StockQty = ?";
            $params[] = intval($data['StockQty']);
            $types .= 'i';
        }
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            break;
        }
        $sql = "UPDATE Products SET " . implode(', ', $updates) . " WHERE ProdID = ?";
        $params[] = $prodId;
        $types .= 'i';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Product updated']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update product: ' . $stmt->error]);
        }
        $stmt->close();
        break;
    case 'DELETE':
        if (!$prodId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ProdID is required']);
            break;
        }
        $stmt = $conn->prepare("DELETE FROM Products WHERE ProdID = ?");
        $stmt->bind_param("i", $prodId);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Product deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete product: ' . $stmt->error]);
        }
        $stmt->close();
        break;
    case 'DELETE':
        if (!$prodId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ProdID is required']);
            break;
        }
        $stmt = $conn->prepare("DELETE FROM Products WHERE ProdID = ?");
        $stmt->bind_param("i", $prodId);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Product deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete product: ' . $stmt->error]);
        }
        $stmt->close();
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

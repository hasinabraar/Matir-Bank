<?php
require_once 'cors_headers.php';
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'GET':
        $result = $conn->query("SELECT * FROM Orders ORDER BY OrderDate DESC");
        $orders = [];
        while ($row = $result->fetch_assoc()) { $orders[] = $row; }
        echo json_encode(['success' => true, 'data' => $orders]);
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['BuyerID']) || !isset($data['Items']) || !is_array($data['Items'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'BuyerID and Items are required']);
            break;
        }
        $buyerId = intval($data['BuyerID']);
        $items = $data['Items'];

        $conn->begin_transaction();
        try {
            $totalAmount = 0.0;
            foreach ($items as $item) {
                if (!isset($item['ProdID']) || !isset($item['Quantity'])) {
                    throw new Exception('Invalid item payload');
                }
                $prodId = intval($item['ProdID']);
                $qty = intval($item['Quantity']);
                if ($qty <= 0) { throw new Exception('Invalid quantity'); }

                $pstmt = $conn->prepare("SELECT PricePerUnit, StockQty FROM Products WHERE ProdID = ? FOR UPDATE");
                $pstmt->bind_param("i", $prodId);
                $pstmt->execute();
                $presult = $pstmt->get_result();
                if ($presult->num_rows === 0) { throw new Exception('Product not found'); }
                $prod = $presult->fetch_assoc();
                $pstmt->close();

                if (intval($prod['StockQty']) < $qty) { throw new Exception('Insufficient stock'); }
                $lineTotal = floatval($prod['PricePerUnit']) * $qty;
                $totalAmount += $lineTotal;
            }

            $stmt = $conn->prepare("INSERT INTO Orders (BuyerID, TotalAmount, Status) VALUES (?, ?, 'PENDING')");
            $stmt->bind_param("id", $buyerId, $totalAmount);
            if (!$stmt->execute()) { throw new Exception('Failed to create order: ' . $stmt->error); }
            $orderId = $conn->insert_id;
            $stmt->close();

            foreach ($items as $item) {
                $prodId = intval($item['ProdID']);
                $qty = intval($item['Quantity']);

                $pstmt = $conn->prepare("SELECT PricePerUnit FROM Products WHERE ProdID = ?");
                $pstmt->bind_param("i", $prodId);
                $pstmt->execute();
                $presult = $pstmt->get_result();
                $prod = $presult->fetch_assoc();
                $pstmt->close();
                $lineTotal = floatval($prod['PricePerUnit']) * $qty;

                $istmt = $conn->prepare("INSERT INTO Order_Items (OrderID, ProdID, Quantity, LineTotal) VALUES (?, ?, ?, ?)");
                $istmt->bind_param("iiid", $orderId, $prodId, $qty, $lineTotal);
                if (!$istmt->execute()) { throw new Exception('Failed to insert order item: ' . $istmt->error); }
                $istmt->close();

                $ustmt = $conn->prepare("UPDATE Products SET StockQty = StockQty - ? WHERE ProdID = ?");
                $ustmt->bind_param("ii", $qty, $prodId);
                if (!$ustmt->execute()) { throw new Exception('Failed to update stock: ' . $ustmt->error); }
                $ustmt->close();
            }

            $conn->commit();
            echo json_encode(['success' => true, 'data' => ['OrderID' => $orderId, 'TotalAmount' => $totalAmount]]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

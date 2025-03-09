<?php
// Set headers to allow AJAX requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Constants
define('SLICES_PER_PIZZA', 12);
define('COST_PER_PIZZA', 10.53);
define('ORDERS_FILE', 'orders.json');

// Function to read orders from JSON file
function readOrders() {
    if (file_exists(ORDERS_FILE)) {
        $json = file_get_contents(ORDERS_FILE);
        return json_decode($json, true);
    }
    return [];
}

// Function to write orders to JSON file
function writeOrders($orders) {
    file_put_contents(ORDERS_FILE, json_encode($orders));
}

// Function to calculate pizza distribution and costs
function calculatePizzas($orders) {
    // Calculate totals
    $total_cheese_slices = array_sum(array_column($orders, 'cheese_slices'));
    $total_pepperoni_slices = array_sum(array_column($orders, 'pepperoni_slices'));

    // Calculate pizzas needed
    $cheese_pizzas_needed = ceil($total_cheese_slices / SLICES_PER_PIZZA);
    $pepperoni_pizzas_needed = ceil($total_pepperoni_slices / SLICES_PER_PIZZA);

    // Calculate leftover slices
    $leftover_cheese_slices = ($cheese_pizzas_needed * SLICES_PER_PIZZA) - $total_cheese_slices;
    $leftover_pepperoni_slices = ($pepperoni_pizzas_needed * SLICES_PER_PIZZA) - $total_pepperoni_slices;

    // Half pizza optimization
    $half_pizzas = 0;

    if (($leftover_cheese_slices <= 6 && $leftover_pepperoni_slices <= 6) ||
        ($leftover_cheese_slices >= 6 && $leftover_pepperoni_slices >= 6)) {
        if ($cheese_pizzas_needed > 0 && $pepperoni_pizzas_needed > 0) {
            $cheese_pizzas_needed -= 1;
            $pepperoni_pizzas_needed -= 1;
            $half_pizzas += 2;
        }
    }

    // Calculate total pizzas and cost
    $total_pizzas = $cheese_pizzas_needed + $pepperoni_pizzas_needed + ($half_pizzas * 0.5);
    $total_cost = $total_pizzas * COST_PER_PIZZA;

    // Calculate cost per slice
    $total_slices = $total_cheese_slices + $total_pepperoni_slices;
    $cost_per_slice = $total_slices > 0 ? $total_cost / $total_slices : 0;

    return [
        'total_cheese_slices' => $total_cheese_slices,
        'total_pepperoni_slices' => $total_pepperoni_slices,
        'cheese_pizzas_needed' => $cheese_pizzas_needed,
        'pepperoni_pizzas_needed' => $pepperoni_pizzas_needed,
        'leftover_cheese_slices' => $leftover_cheese_slices,
        'leftover_pepperoni_slices' => $leftover_pepperoni_slices,
        'half_pizzas' => $half_pizzas,
        'total_pizzas' => $total_pizzas,
        'total_cost' => $total_cost,
        'cost_per_slice' => $cost_per_slice,
    ];
}

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all orders and calculations
        $orders = readOrders();
        $calculations = calculatePizzas($orders);

        echo json_encode([
            'success' => true,
            'orders' => $orders,
            'calculations' => $calculations
        ]);
        break;

    case 'POST':
        // Add a new order
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['name']) ||
            !isset($data['cheese_slices']) ||
            !isset($data['pepperoni_slices'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        $orders = readOrders();

        $order = [
            'id' => time(),
            'name' => $data['name'],
            'cheese_slices' => (int)$data['cheese_slices'],
            'pepperoni_slices' => (int)$data['pepperoni_slices'],
            'paid' => isset($data['paid']) ? (bool)$data['paid'] : false
        ];

        $orders[] = $order;
        writeOrders($orders);

        $calculations = calculatePizzas($orders);

        echo json_encode([
            'success' => true,
            'order' => $order,
            'orders' => $orders,
            'calculations' => $calculations
        ]);
        break;

    case 'DELETE':
        // Delete an order
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing order ID']);
            exit;
        }

        $orders = readOrders();
        $filtered_orders = [];

        foreach ($orders as $order) {
            if ($order['id'] != $data['id']) {
                $filtered_orders[] = $order;
            }
        }

        writeOrders($filtered_orders);
        $calculations = calculatePizzas($filtered_orders);

        echo json_encode([
            'success' => true,
            'orders' => $filtered_orders,
            'calculations' => $calculations
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
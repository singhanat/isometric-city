<?php
header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_echo_error("Method Not Allowed");
    exit;
}

// Get raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input);

if (!$data || !isset($data->size) || !isset($data->tiles)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
    exit;
}

// Write to city.json
$file_path = __DIR__ . '/city.json';
$result = file_put_contents($file_path, json_encode($data, JSON_PRETTY_PRINT));

if ($result === false) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to write to city.json."]);
    exit;
}

echo json_encode(["status" => "success", "message" => "Map saved successfully!"]);
?>

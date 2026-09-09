<?php
// Simple CORS Proxy for audio streaming and API in Laragon PHP
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, HEAD, OPTIONS");
header("Access-Control-Allow-Headers: Range, Content-Type, Accept, Accept-Language");
header("Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$url = $_GET['url'] ?? '';
if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo "Missing or invalid url";
    exit;
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'SadaQuranPlayer/1.0');

$headers = [];
if (isset($_SERVER['HTTP_RANGE'])) {
    curl_setopt($ch, CURLOPT_RANGE, str_replace('bytes=', '', $_SERVER['HTTP_RANGE']));
}
if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
    $headers[] = 'Accept-Language: ' . $_SERVER['HTTP_ACCEPT_LANGUAGE'];
}
if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) {
    $len = strlen($header);
    $headerParts = explode(':', $header, 2);
    if (count($headerParts) == 2) {
        $name = strtolower(trim($headerParts[0]));
        if (in_array($name, ['content-type', 'content-length', 'content-range', 'accept-ranges'])) {
            header($header, true);
        }
    }
    return $len;
});

curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($httpCode) {
    http_response_code($httpCode);
}
curl_close($ch);

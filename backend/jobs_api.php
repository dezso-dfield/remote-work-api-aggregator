<?php
// jobs_api.php  — unlimited results support (limit=all or no limit)
// GET: /jobs_api.php?q=react&category=frontend&source=Greenhouse&limit=all&order=recent
declare(strict_types=1);

const DB_PATH = __DIR__ . '/jobs.sqlite';

function db(): PDO {
  $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}
function json_out($data, int $code=200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
  exit;
}

$pdo = db();

$q        = trim($_GET['q'] ?? '');
$source   = trim($_GET['source'] ?? '');
$category = trim($_GET['category'] ?? '');
$limitRaw = $_GET['limit'] ?? null;
$offset   = max(0, (int)($_GET['offset'] ?? 0));
$orderKey = ($_GET['order'] ?? 'recent');
$order    = $orderKey === 'alpha' ? 'company ASC, title ASC' : 'posted_at DESC, id DESC';

// unlimited if limit=all or limit omitted
$useLimit = true;
if ($limitRaw === null || (is_string($limitRaw) && strtolower($limitRaw) === 'all')) {
  $useLimit = false;
} else {
  $limit = max(1, (int)$limitRaw);
}

$sql  = "SELECT title, company, url, source, category, location, salary, posted_at FROM jobs WHERE 1=1";
$args = [];

if ($q !== '') {
  $sql .= " AND (LOWER(title) LIKE :q OR LOWER(company) LIKE :q OR LOWER(category) LIKE :q)";
  $args[':q'] = '%' . mb_strtolower($q) . '%';
}
if ($source !== '') {
  $sql .= " AND source LIKE :src";
  $args[':src'] = $source . '%';
}
if ($category !== '') {
  $sql .= " AND LOWER(category) LIKE :cat";
  $args[':cat'] = '%' . mb_strtolower($category) . '%';
}

// count first
$sqlCount = "SELECT COUNT(*) FROM ($sql) t";
$stmtC = $pdo->prepare($sqlCount);
$stmtC->execute($args);
$total = (int)$stmtC->fetchColumn();

// ordering
$sql .= " ORDER BY $order";

// apply limit/offset only if requested
if ($useLimit) {
  $sql .= " LIMIT :limit OFFSET :offset";
}

$stmt = $pdo->prepare($sql);
foreach ($args as $k=>$v) $stmt->bindValue($k, $v, PDO::PARAM_STR);
if ($useLimit) {
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
}
$stmt->execute();

$rows = $stmt->fetchAll();
json_out([
  'total' => $total,
  'count' => count($rows),
  'jobs'  => $rows,
  'generatedAt' => gmdate('c'),
]);

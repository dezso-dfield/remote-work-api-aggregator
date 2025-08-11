<?php
// fetch_jobs.php
// CLI: php fetch_jobs.php [--only=ids] [--skip=ids] [--no-throttle] [--max-per-source=N] [--since-days=D] [--print-sources] [--dry-run] [--no-prune]
declare(strict_types=1);

/* =======================
   Config (defaults)
   ======================= */
const DB_PATH                 = __DIR__ . '/jobs.sqlite';
const USER_AGENT              = 'Mozilla/5.0 (JobsAggregator/1.0)';
const MIN_INTERVAL_SEC        = 600;   // throttle all-source run (10 min)
const DEFAULT_SINCE_DAYS      = 365;   // trim postings older than this when ingesting (0 = no filter)
const DEFAULT_MAX_PER_SOURCE  = 0;     // 0 = unlimited
const PRUNE_OLDER_THAN_DAYS   = 0;     // 0 = keep forever; else delete older created_at

/* =======================
   CLI options
   ======================= */
function cli_opts(): array {
  $opts = [
    'only'            => null,  // comma sep ids
    'skip'            => null,  // comma sep ids
    'no-throttle'     => false,
    'max-per-source'  => DEFAULT_MAX_PER_SOURCE,
    'since-days'      => DEFAULT_SINCE_DAYS,
    'print-sources'   => false,
    'dry-run'         => false,
    'prune'           => true,  // default ON; use --no-prune to disable
  ];
  foreach ($GLOBALS['argv'] ?? [] as $arg) {
    if (preg_match('/^--only=(.+)$/', $arg, $m))        $opts['only'] = $m[1];
    elseif (preg_match('/^--skip=(.+)$/', $arg, $m))    $opts['skip'] = $m[1];
    elseif ($arg === '--no-throttle')                   $opts['no-throttle'] = true;
    elseif (preg_match('/^--max-per-source=(\d+)$/', $arg, $m)) $opts['max-per-source'] = (int)$m[1];
    elseif (preg_match('/^--since-days=(\d+)$/', $arg, $m))     $opts['since-days'] = (int)$m[1];
    elseif ($arg === '--print-sources')                 $opts['print-sources'] = true;
    elseif ($arg === '--dry-run')                       $opts['dry-run'] = true;
    elseif ($arg === '--no-prune')                      $opts['prune'] = false;
    elseif ($arg === '--prune')                         $opts['prune'] = true;
  }
  return $opts;
}

/* =======================
   DB
   ======================= */
function db(): PDO {
  $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  $pdo->exec('PRAGMA journal_mode=WAL;');
  init_db($pdo);
  return $pdo;
}
function init_db(PDO $pdo): void {
  $pdo->exec("
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source TEXT,
      category TEXT,
      location TEXT,
      salary TEXT,
      posted_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      hash TEXT
    );
  ");
  $pdo->exec("CREATE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(hash);");
  $pdo->exec("CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);");
  $pdo->exec("CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);");
  $pdo->exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);");
}

/* =======================
   HTTP (cURL)
   ======================= */
function curl_get(string $url, int $timeout=25): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_CONNECTTIMEOUT => 12,
    CURLOPT_TIMEOUT => $timeout,
    CURLOPT_USERAGENT => USER_AGENT,
    CURLOPT_ENCODING => '',
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
  ]);
  $body = curl_exec($ch);
  $err  = curl_error($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($body === false || $code >= 400) throw new RuntimeException("HTTP $code $err ($url)");
  return [$body, $code];
}
function fetch_json(string $url): array {
  [$txt, ] = curl_get($url);
  $j = json_decode($txt, true);
  if (!is_array($j)) throw new RuntimeException("Invalid JSON: $url");
  return $j;
}
function fetch_rss(string $url): array {
  [$xml, ] = curl_get($url);
  libxml_use_internal_errors(true);
  $sx = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
  if (!$sx) throw new RuntimeException("Invalid XML: $url");
  $items = [];
  if (isset($sx->channel->item)) {
    foreach ($sx->channel->item as $it) {
      $items[] = [
        'title'   => trim((string)$it->title),
        'link'    => trim((string)$it->link),
        'pubDate' => (string)$it->pubDate ?: null,
        'guid'    => (string)$it->guid ?: (string)$it->link,
        'author'  => (string)($it->author ?? $it->children('dc', true)->creator ?? ''),
        'category'=> array_map('strval', (array)$it->category ?? []),
      ];
    }
    return $items;
  }
  if (isset($sx->entry)) {
    foreach ($sx->entry as $e) {
      $link = '';
      foreach ($e->link as $lnk) {
        $attrs = $lnk->attributes();
        if (isset($attrs['href'])) { $link = (string)$attrs['href']; break; }
      }
      $items[] = [
        'title'   => trim((string)$e->title),
        'link'    => $link,
        'pubDate' => (string)$e->updated ?: (string)$e->published ?: null,
        'guid'    => (string)$e->id ?: $link,
        'author'  => (string)$e->author->name ?? '',
        'category'=> [],
      ];
    }
  }
  return $items;
}

/* =======================
   Normalize + insert
   ======================= */
function iso(?string $dt): ?string {
  if (!$dt) return null;
  $t = strtotime($dt);
  return $t ? gmdate('c', $t) : null;
}
function norm(array $o): array {
  return [
    'title'     => $o['title']     ?? 'Untitled',
    'company'   => $o['company']   ?? 'Unknown',
    'url'       => $o['url']       ?? '',
    'source'    => $o['source']    ?? 'Unknown',
    'category'  => $o['category']  ?? 'Unknown',
    'location'  => $o['location']  ?? 'Remote',
    'salary'    => $o['salary']    ?? null,
    'posted_at' => $o['posted_at'] ?? null,
  ];
}
function ins(PDO $pdo, array $job, bool $dryRun=false): void {
  $u = trim($job['url']);
  if ($u === '') return;
  $hash = sha1(mb_strtolower($job['title']).'|'.mb_strtolower($job['company']));
  if ($dryRun) { echo "[dry-run] would insert: {$job['source']} | {$job['title']} @ {$job['company']}\n"; return; }
  $stmt = $pdo->prepare("
    INSERT OR IGNORE INTO jobs (title, company, url, source, category, location, salary, posted_at, hash)
    VALUES (:title,:company,:url,:source,:category,:location,:salary,:posted_at,:hash)
  ");
  $stmt->execute([
    ':title' => $job['title'], ':company' => $job['company'], ':url' => $u,
    ':source' => $job['source'], ':category' => $job['category'], ':location' => $job['location'],
    ':salary' => $job['salary'], ':posted_at' => $job['posted_at'], ':hash' => $hash
  ]);
}

/* =======================
   Per-source pruning (delete jobs missing from latest snapshot)
   ======================= */
function prune_missing_for_source(PDO $pdo, string $source, array $urls): int {
  // Unique, non-empty URLs
  $urls = array_values(array_unique(array_filter(array_map('trim', $urls))));
  // Create temp table once per connection
  $pdo->exec("CREATE TEMP TABLE IF NOT EXISTS tmp_seen_urls(url TEXT PRIMARY KEY)");
  $pdo->exec("DELETE FROM tmp_seen_urls");
  $ins = $pdo->prepare("INSERT OR IGNORE INTO tmp_seen_urls(url) VALUES (:u)");
  foreach ($urls as $u) {
    if ($u === '') continue;
    $ins->execute([':u' => $u]);
  }
  $del = $pdo->prepare("DELETE FROM jobs WHERE source = :src AND url NOT IN (SELECT url FROM tmp_seen_urls)");
  $del->execute([':src' => $source]);
  $pdo->exec("DELETE FROM tmp_seen_urls");
  return $del->rowCount();
}

/* =======================
   Mappers
   ======================= */
function map_jobicy(array $j): array {
  return norm([
    'title' => $j['jobTitle'] ?? null,
    'company' => $j['companyName'] ?? null,
    'url' => $j['url'] ?? null,
    'source' => 'Jobicy',
    'category' => $j['jobIndustry'] ?? 'Unknown',
    'location' => $j['jobGeo'] ?? 'Remote',
    'salary' => (isset($j['salaryMin'],$j['salaryMax'])) ? ($j['salaryMin'].'-'.$j['salaryMax'].' '.($j['salaryCurrency'] ?? '')) : null,
    'posted_at' => iso($j['pubDate'] ?? null),
  ]);
}
function map_remoteok(array $j): array {
  return norm([
    'title' => $j['position'] ?? $j['title'] ?? null,
    'company' => $j['company'] ?? 'Unknown',
    'url' => $j['url'] ?? null,
    'source' => 'Remote OK',
    'category' => !empty($j['tags']) && is_array($j['tags']) ? implode(', ', $j['tags']) : 'Unknown',
    'location' => $j['location'] ?? 'Remote',
    'salary' => (isset($j['salary_min'],$j['salary_max'])) ? ($j['salary_min'].'-'.$j['salary_max'].' '.($j['salary_currency'] ?? '')) : ($j['salary'] ?? null),
    'posted_at' => iso($j['date'] ?? $j['created_at'] ?? null),
  ]);
}
function map_remotive(array $j): array {
  return norm([
    'title' => $j['title'] ?? null,
    'company' => $j['company_name'] ?? 'Unknown',
    'url' => $j['url'] ?? '',
    'source' => 'Remotive',
    'category' => $j['category'] ?? 'Unknown',
    'location' => $j['job_type'] ?? 'Remote',
    'salary' => $j['salary'] ?? null,
    'posted_at' => iso($j['publication_date'] ?? null),
  ]);
}
function map_arbeitnow(array $j): array {
  return norm([
    'title' => $j['title'] ?? null,
    'company' => $j['company_name'] ?? 'Unknown',
    'url' => $j['url'] ?? '',
    'source' => 'Arbeitnow',
    'category' => !empty($j['tags']) ? implode(', ', $j['tags']) : 'Unknown',
    'location' => $j['location'] ?? 'Remote',
    'salary' => $j['salary'] ?? null,
    'posted_at' => iso($j['created_at'] ?? null),
  ]);
}
function map_workingnomads(array $j): array {
  return norm([
    'title' => $j['title'] ?? null,
    'company' => $j['company'] ?? ($j['company_name'] ?? 'Unknown'),
    'url' => $j['url'] ?? '',
    'source' => 'Working Nomads',
    'category' => $j['category'] ?? (!empty($j['tags']) ? implode(', ', $j['tags']) : 'Unknown'),
    'location' => $j['location'] ?? 'Remote',
    'salary' => $j['salary'] ?? null,
    'posted_at' => iso($j['pub_date'] ?? null),
  ]);
}
function map_rss(array $it, string $src): array {
  return norm([
    'title' => $it['title'] ?? 'Untitled',
    'company' => !empty($it['author']) ? trim($it['author']) : $src,
    'url' => $it['link'] ?? '',
    'source' => $src,
    'category' => !empty($it['category'])
      ? (is_array($it['category']) ? implode(', ', $it['category']) : $it['category'])
      : 'Unknown',
    'location' => 'Remote',
    'posted_at' => iso($it['pubDate'] ?? null),
  ]);
}
function map_greenhouse(array $j, string $board): array {
  $company = $j['company']['name'] ?? $board;
  return norm([
    'title' => $j['title'] ?? 'Untitled',
    'company' => $company,
    'url' => $j['absolute_url'] ?? $j['hosted_url'] ?? '',
    'source' => "Greenhouse:$board",
    'category' => !empty($j['departments']) ? implode(', ', array_map(fn($d)=>$d['name']??'', $j['departments'])) : 'Unknown',
    'location' => $j['location']['name'] ?? 'Remote',
    'posted_at' => iso($j['updated_at'] ?? $j['created_at'] ?? null),
  ]);
}
function map_lever(array $j, string $company): array {
  return norm([
    'title' => $j['text'] ?? 'Untitled',
    'company' => $j['categories']['department'] ?? $company,
    'url' => $j['hostedUrl'] ?? '',
    'source' => "Lever:$company",
    'category' => implode(', ', array_filter([$j['categories']['team'] ?? null, $j['categories']['department'] ?? null])) ?: 'Unknown',
    'location' => $j['categories']['location'] ?? 'Remote',
    'posted_at' => isset($j['createdAt']) ? gmdate('c', (int)($j['createdAt']/1000)) : null,
  ]);
}
function map_hn(array $hit): array {
  return norm([
    'title' => $hit['title'] ?? 'HN Job',
    'company' => 'Hacker News',
    'url' => $hit['url'] ?? $hit['story_url'] ?? ('https://news.ycombinator.com/item?id=' . ($hit['objectID'] ?? '')),
    'source' => 'HN:WhoIsHiring',
    'category' => 'Discussion',
    'location' => 'Remote (varies)',
    'posted_at' => iso($hit['created_at'] ?? null),
  ]);
}

/* =======================
   Source registry (BIG)
   id = short unique handle for CLI filters
   ======================= */
function sources(): array {
  return [
    // JSON boards
    ['id'=>'jobicy',   'type'=>'json','name'=>'Jobicy',         'url'=>'https://jobicy.com/api/v2/remote-jobs','json'=>'jobicy'],
    ['id'=>'remotive', 'type'=>'json','name'=>'Remotive',       'url'=>'https://remotive.com/api/remote-jobs', 'json'=>'remotive'],
    ['id'=>'remoteok', 'type'=>'json','name'=>'Remote OK',      'url'=>'https://remoteok.com/api',             'json'=>'remoteok'],
    ['id'=>'arbeitnow','type'=>'json','name'=>'Arbeitnow',      'url'=>'https://www.arbeitnow.com/api/job-board-api','json'=>'arbeitnow'],
    ['id'=>'wnomads',  'type'=>'json','name'=>'Working Nomads', 'url'=>'https://www.workingnomads.com/api/jobs','json'=>'workingnomads'],

    // WWR + categories (RSS)
    ['id'=>'wwr-all','type'=>'rss','name'=>'We Work Remotely (All)','url'=>'https://weworkremotely.com/remote-jobs.rss'],
    ['id'=>'wwr-prog','type'=>'rss','name'=>'WWR: Programming','url'=>'https://weworkremotely.com/categories/remote-programming-jobs.rss'],
    ['id'=>'wwr-fs','type'=>'rss','name'=>'WWR: Full-Stack','url'=>'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss'],
    ['id'=>'wwr-be','type'=>'rss','name'=>'WWR: Back-End','url'=>'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss'],
    ['id'=>'wwr-fe','type'=>'rss','name'=>'WWR: Front-End','url'=>'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss'],
    ['id'=>'wwr-devops','type'=>'rss','name'=>'WWR: DevOps & SysAdmin','url'=>'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss'],
    ['id'=>'wwr-design','type'=>'rss','name'=>'WWR: Design','url'=>'https://weworkremotely.com/categories/remote-design-jobs.rss'],
    ['id'=>'wwr-product','type'=>'rss','name'=>'WWR: Product','url'=>'https://weworkremotely.com/categories/remote-product-jobs.rss'],
    ['id'=>'wwr-sales','type'=>'rss','name'=>'WWR: Sales & Marketing','url'=>'https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss'],
    ['id'=>'wwr-mgmt','type'=>'rss','name'=>'WWR: Management & Finance','url'=>'https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss'],
    ['id'=>'wwr-other','type'=>'rss','name'=>'WWR: All Other','url'=>'https://weworkremotely.com/categories/all-other-remote-jobs.rss'],

    // Other RSS boards
    ['id'=>'remotive-rss','type'=>'rss','name'=>'Remotive (RSS)','url'=>'https://remotive.com/remote-jobs/rss-feed'],
    ['id'=>'remoteok-rss','type'=>'rss','name'=>'Remote OK (RSS)','url'=>'https://remoteok.com/remote-jobs.rss'],
    ['id'=>'jobspresso','type'=>'rss','name'=>'Jobspresso','url'=>'https://jobspresso.co/remote-work-rss-feed/'],
    ['id'=>'nodesk','type'=>'rss','name'=>'Nodesk','url'=>'https://nodesk.co/remote-jobs/feed/'],
    ['id'=>'remoteco','type'=>'rss','name'=>'Remote.co','url'=>'https://remote.co/remote-jobs/feed/'],
    ['id'=>'eu-remote','type'=>'rss','name'=>'EU Remote Jobs','url'=>'https://euremotejobs.com/feed/?post_type=job_listing'],
    ['id'=>'remotees','type'=>'rss','name'=>'Remotees','url'=>'https://remotees.com/remote-jobs.rss'],
    ['id'=>'justremote','type'=>'rss','name'=>'JustRemote','url'=>'https://justremote.co/remote-jobs.rss'],
    ['id'=>'hn-jobs','type'=>'rss','name'=>'HN Jobs (RSS)','url'=>'https://hnrss.org/jobs'],
    ['id'=>'golangproj','type'=>'rss','name'=>'Golang Projects','url'=>'https://www.golangprojects.com/rss.xml'],
    ['id'=>'python-org','type'=>'rss','name'=>'Python.org Jobs','url'=>'https://www.python.org/jobs/feed/rss/'],
    ['id'=>'androidjobs','type'=>'rss','name'=>'Android Jobs','url'=>'https://androidjobs.io/rss'],
    ['id'=>'reactjobs','type'=>'rss','name'=>'React Jobs Board','url'=>'https://reactjobsboard.com/feed'],
    ['id'=>'vuejobs','type'=>'rss','name'=>'VueJobs','url'=>'https://vuejobs.com/feed'],

    // Greenhouse boards (big list; failures are logged)
    ['id'=>'gh-gitlab','type'=>'greenhouse','board'=>'gitlab'],
    ['id'=>'gh-canonical','type'=>'greenhouse','board'=>'canonical'],
    ['id'=>'gh-stripe','type'=>'greenhouse','board'=>'stripe'],
    ['id'=>'gh-hashicorp','type'=>'greenhouse','board'=>'hashicorp'],
    ['id'=>'gh-datadog','type'=>'greenhouse','board'=>'datadog'],
    ['id'=>'gh-zapier','type'=>'greenhouse','board'=>'zapier'],
    ['id'=>'gh-sourcegraph','type'=>'greenhouse','board'=>'sourcegraph'],
    ['id'=>'gh-cloudflare','type'=>'greenhouse','board'=>'cloudflare'],
    ['id'=>'gh-github','type'=>'greenhouse','board'=>'github'],
    ['id'=>'gh-coinbase','type'=>'greenhouse','board'=>'coinbase'],
    ['id'=>'gh-figma','type'=>'greenhouse','board'=>'figma'],
    ['id'=>'gh-elastic','type'=>'greenhouse','board'=>'elastic'],
    ['id'=>'gh-vercel','type'=>'greenhouse','board'=>'vercel'],
    ['id'=>'gh-notion','type'=>'greenhouse','board'=>'notion'],
    ['id'=>'gh-dropbox','type'=>'greenhouse','board'=>'dropbox'],
    ['id'=>'gh-atlassian','type'=>'greenhouse','board'=>'atlassian'],
    ['id'=>'gh-airbnb','type'=>'greenhouse','board'=>'airbnb'],
    ['id'=>'gh-digitalocean','type'=>'greenhouse','board'=>'digitalocean'],
    ['id'=>'gh-snyk','type'=>'greenhouse','board'=>'snyk'],
    ['id'=>'gh-miro','type'=>'greenhouse','board'=>'miro'],
    ['id'=>'gh-confluent','type'=>'greenhouse','board'=>'confluent'],
    ['id'=>'gh-airtale','type'=>'greenhouse','board'=>'airtable'], // may 404; logged
    ['id'=>'gh-airtable','type'=>'greenhouse','board'=>'airtable'],

    // Lever (public postings)
    ['id'=>'lv-netlify','type'=>'lever','company'=>'netlify'],
    ['id'=>'lv-doist','type'=>'lever','company'=>'doist'],
    ['id'=>'lv-leverdemo','type'=>'lever','company'=>'leverdemo'],
    ['id'=>'lv-linear','type'=>'lever','company'=>'linear'],      // may 404
    ['id'=>'lv-loom','type'=>'lever','company'=>'loom'],          // may 404
    ['id'=>'lv-plaidsandbox','type'=>'lever','company'=>'plaid'], // may 404

    // HN via Algolia
    ['id'=>'hn-whoishiring','type'=>'hn','query'=>'Who is hiring?'],
  ];
}

/* =======================
   Ingest
   ======================= */
function filter_since(?string $isoDate, int $sinceDays): bool {
  if ($sinceDays <= 0 || !$isoDate) return true;
  $ts = strtotime($isoDate);
  if (!$ts) return true;
  return $ts >= (time() - $sinceDays * 86400);
}
function prune_old(PDO $pdo, int $days): void {
  if ($days <= 0) return;
  $stmt = $pdo->prepare("DELETE FROM jobs WHERE created_at < datetime('now', :off)");
  $stmt->execute([':off' => "-{$days} days"]);
}

function ingest_all(PDO $pdo, array $opts): int {
  $only = $opts['only'] ? array_filter(array_map('trim', explode(',', strtolower($opts['only'])))) : [];
  $skip = $opts['skip'] ? array_filter(array_map('trim', explode(',', strtolower($opts['skip'])))) : [];
  $noThrottle = (bool)$opts['no-throttle'];
  $maxPerSrc  = (int)$opts['max-per-source'];
  $sinceDays  = (int)$opts['since-days'];
  $dryRun     = (bool)$opts['dry-run'];
  $doPrune    = (bool)$opts['prune'];

  if ($opts['print-sources']) {
    echo "Sources:\n";
    foreach (sources() as $s) echo " - {$s['id']}  [{$s['type']}]  " . ($s['name'] ?? ($s['board'] ?? $s['company'] ?? $s['query'])) . "\n";
    if ($dryRun) echo "(dry-run active)\n";
    if (!empty($only)) echo "ONLY: ".implode(', ',$only)."\n";
    if (!empty($skip)) echo "SKIP: ".implode(', ',$skip)."\n";
  }

  // throttle
  if (!$noThrottle) {
    $st = $pdo->query("SELECT value FROM meta WHERE key='last_fetch_at'");
    $last = (int)($st->fetchColumn() ?: 0);
    if (time() - $last < MIN_INTERVAL_SEC) {
      echo "Skipped: throttled (" . (time() - $last) . "s since last).\n";
      return 0;
    }
  }

  $total = 0;
  if (!$dryRun) $pdo->beginTransaction();

  foreach (sources() as $s) {
    $id = strtolower($s['id']);
    if (!empty($only) && !in_array($id, $only, true)) continue;
    if (!empty($skip) && in_array($id, $skip, true))   continue;

    $inserted = 0;
    $label = $s['name'] ?? $s['board'] ?? $s['company'] ?? $s['query'] ?? $id;
    // Determine the exact "source" string stored in DB for this source
    $sourceKey = $s['type'] === 'greenhouse' ? "Greenhouse:{$s['board']}" :
                 ($s['type'] === 'lever' ? "Lever:{$s['company']}" :
                 ($s['type'] === 'hn' ? 'HN:WhoIsHiring' :
                 ($s['name'] ?? $label)));

    $seen = []; // track URLs seen for this source

    try {
      switch ($s['type']) {
        case 'json': {
          $data = fetch_json($s['url']);
          if (($s['json'] ?? '') === 'jobicy') {
            foreach ($data['jobs'] ?? [] as $j) {
              $job = map_jobicy($j);
              if (!empty($job['url'])) $seen[] = $job['url'];
              if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
              if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
            }
          } elseif (($s['json'] ?? '') === 'remoteok') {
            $arr = is_array($data) ? array_slice($data, 1) : [];
            foreach ($arr as $j) {
              $job = map_remoteok($j);
              if (!empty($job['url'])) $seen[] = $job['url'];
              if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
              if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
            }
          } elseif (($s['json'] ?? '') === 'remotive') {
            foreach ($data['jobs'] ?? [] as $j) {
              $job = map_remotive($j);
              if (!empty($job['url'])) $seen[] = $job['url'];
              if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
              if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
            }
          } elseif (($s['json'] ?? '') === 'arbeitnow') {
            foreach ($data['data'] ?? [] as $j) {
              $job = map_arbeitnow($j);
              if (!empty($job['url'])) $seen[] = $job['url'];
              if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
              if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
            }
          } elseif (($s['json'] ?? '') === 'workingnomads') {
            $arr = is_array($data) ? $data : [];
            foreach ($arr as $j) {
              $job = map_workingnomads($j);
              if (!empty($job['url'])) $seen[] = $job['url'];
              if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
              if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
            }
          }
          break;
        }
        case 'rss': {
          foreach (fetch_rss($s['url']) as $it) {
            $job = map_rss($it, $s['name']);
            if (!empty($job['url'])) $seen[] = $job['url'];
            if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
            if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
          }
          break;
        }
        case 'greenhouse': {
          $data = fetch_json("https://boards.greenhouse.io/v1/boards/{$s['board']}/jobs");
          foreach ($data['jobs'] ?? [] as $j) {
            $job = map_greenhouse($j, $s['board']);
            if (!empty($job['url'])) $seen[] = $job['url'];
            if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
            if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
          }
          break;
        }
        case 'lever': {
          $data = fetch_json("https://api.lever.co/v0/postings/{$s['company']}?mode=json");
          foreach ((is_array($data) ? $data : []) as $j) {
            $job = map_lever($j, $s['company']);
            if (!empty($job['url'])) $seen[] = $job['url'];
            if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
            if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
          }
          break;
        }
        case 'hn': {
          $data = fetch_json("https://hn.algolia.com/api/v1/search?query=" . rawurlencode($s['query']) . "&tags=story");
          foreach ($data['hits'] ?? [] as $hit) {
            $job = map_hn($hit);
            if (!empty($job['url'])) $seen[] = $job['url'];
            if (filter_since($job['posted_at'], $sinceDays)) { ins($pdo, $job, $dryRun); $total++; $inserted++; }
            if ($maxPerSrc>0 && $inserted >= $maxPerSrc) break;
          }
          break;
        }
      }

      $pruned = 0;
      if ($doPrune && !$dryRun && $inserted > 0) {
        $pruned = prune_missing_for_source($pdo, $sourceKey, $seen);
      }
      echo sprintf("[%s] +%d%s\n", $label, $inserted, ($doPrune && !$dryRun ? " / -$pruned pruned" : ""));
    } catch (Throwable $e) {
      error_log("[fetch] Source failed ".json_encode($s)." : ".$e->getMessage());
      echo sprintf("[%s] FAILED: %s\n", $label, $e->getMessage());
    }
  }

  if (!$dryRun) {
    $up = $pdo->prepare("INSERT INTO meta(key,value) VALUES('last_fetch_at',:v) ON CONFLICT(key) DO UPDATE SET value=:v");
    $up->execute([':v' => (string)time()]);
    if (PRUNE_OLDER_THAN_DAYS > 0) prune_old($pdo, PRUNE_OLDER_THAN_DAYS);
    $pdo->commit();
  }

  return $total;
}

/* =======================
   Main (CLI only)
   ======================= */
if (PHP_SAPI !== 'cli') {
  http_response_code(405);
  header('Content-Type: text/plain; charset=utf-8');
  echo "CLI only\n"; exit;
}
$opts = cli_opts();
$pdo = db();

if ($opts['print-sources']) {
  foreach (sources() as $s) echo $s['id']."\n";
  if (in_array('--print-sources', $argv, true) && !in_array('--dry-run',$argv,true)) exit(0);
}

$cnt = ingest_all($pdo, $opts);
echo "Inserted up to $cnt jobs @ ".gmdate('c')."\n";

/*
Examples:
  php fetch_jobs.php --print-sources
  php fetch_jobs.php --only=remoteok,jobicy,gh-github --max-per-source=50 --since-days=90
  php fetch_jobs.php --skip=hn-whoishiring,wwr-all --no-throttle
  php fetch_jobs.php --dry-run --only=gh-gitlab
  php fetch_jobs.php --no-prune   # disable pruning
*/

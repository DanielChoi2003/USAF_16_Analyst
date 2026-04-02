# Logstash Integration Contract

This file is the authoritative handoff for connecting the Logstash work to Elasticsearch and Kibana.

It is written so a teammate or an AI agent can use it directly without needing to infer the data shape.

## Purpose

Connor's part is the ingestion and normalization layer.

The Logstash pipeline:

1. Reads SIEM package JSON files from `data/samples/`
2. Parses each full package
3. Splits the package `events` array into one record per event
4. Preserves package-level metadata on every event
5. Writes normalized event records
6. Optionally ships those normalized records to Elasticsearch

Everything downstream should treat the normalized Logstash output as the source of truth.

Do not build Elasticsearch mappings or Kibana dashboards from the raw package JSON shape.

## Source Files

These are the files that define the Logstash contract:

- [logstash/pipeline/16af_ingest.conf](/Users/connor/Downloads/USAF_16_Analyst/logstash/pipeline/16af_ingest.conf)
- [logstash/docker-compose.yml](/Users/connor/Downloads/USAF_16_Analyst/logstash/docker-compose.yml)
- [logstash/.env.example](/Users/connor/Downloads/USAF_16_Analyst/logstash/.env.example)

## Runtime Inputs

Logstash reads all JSON files from:

- `/Users/connor/Downloads/USAF_16_Analyst/data/samples`

Current example input files include:

- [data/samples/ex1-baseline.json](/Users/connor/Downloads/USAF_16_Analyst/data/samples/ex1-baseline.json)
- [data/samples/ex1-enriched.json](/Users/connor/Downloads/USAF_16_Analyst/data/samples/ex1-enriched.json)

## Runtime Outputs

### Always Produced

Normalized NDJSON file:

- [logstash/output/normalized-events.ndjson](/Users/connor/Downloads/USAF_16_Analyst/logstash/output/normalized-events.ndjson)

Container stdout:

- JSON lines for each normalized record

### Optionally Produced

If `LOGSTASH_ENABLE_ES_OUTPUT=true`, Logstash writes to Elasticsearch index:

- `16af-events-dev` by default

Elasticsearch target is controlled by:

- `ELASTICSEARCH_HOSTS`
- `LOGSTASH_INDEX`

## Environment Variables

The Logstash module uses these environment variables:

- `LOGSTASH_API_PORT`
  Default: `9600`
- `LOGSTASH_INDEX`
  Default: `16af-events-dev`
- `LOGSTASH_ENABLE_ES_OUTPUT`
  Default: `false`
- `ELASTICSEARCH_HOSTS`
  Default: `http://host.docker.internal:9200`

Recommended `.env` for full ELK integration:

```bash
LOGSTASH_API_PORT=9600
LOGSTASH_INDEX=16af-events-dev
LOGSTASH_ENABLE_ES_OUTPUT=true
ELASTICSEARCH_HOSTS=http://host.docker.internal:9200
```

## Exact Normalized Output Contract

Each output record is one event document.

### Top-Level Fields

- `@timestamp`
- `package_id`
- `alert_id`
- `title`
- `severity`
- `detected_at`
- `source_system`
- `scope`
- `entities`
- `enrichment`
- `report`
- `meta`
- `host`
- `user`
- `process`
- `event`
- `observer`
- `tags`
- `message`
- `raw_excerpt`
- `ioc_matches`

### Nested Field Contract

#### `event`

- `event.id`
- `event.category`
- `event.action`
- `event.subtype`
- `event.kind`
- `event.dataset`

Expected values added by Logstash:

- `event.kind = event`
- `event.dataset = 16af.siem`

#### `observer`

- `observer.type = logstash`
- `observer.name = analyst-copilot`

#### `host`

- `host.name`
- `host.ip`

#### `user`

- `user.name`

#### `process`

- `process.name`
- `process.pid`
- `process.ppid`
- `process.cmdline`

#### `scope`

- `scope.network_zone`
- `scope.org_unit`
- `scope.time_window.start`
- `scope.time_window.end`

#### `entities`

- `entities.hosts`
- `entities.users`
- `entities.ips`
- `entities.domains`
- `entities.hashes`

#### `enrichment`

- `enrichment.misp_matches`
- `enrichment.hostname_reputation`
- `enrichment.file_hash_lookup`
- `enrichment.misp_match_count`

#### `report`

- `report.summary`
- `report.observations`
- `report.confidence`
- `report.raw_links.kibana_search`
- `report.raw_links.ticket_reference`

#### `meta`

- `meta.author`
- `meta.created_at`
- `meta.schema_version`
- `meta.exported_from`
- `meta.export_info`

### Important Transformations Performed By Logstash

These are not guesses. This is what the pipeline explicitly does.

- Each item in the raw `events` array becomes one separate output event.
- Raw `events` is renamed internally to `event_detail` and then flattened into normalized fields.
- `event_detail.timestamp` becomes `@timestamp`.
- `event_detail.raw_excerpt` becomes both `message` and `raw_excerpt`.
- `event_detail.id` becomes `event.id`.
- `event_detail.category` becomes `event.category`.
- `event_detail.action` becomes `event.action`.
- `event_detail.subtype` becomes `event.subtype`.
- `event_detail.host` becomes `host`.
- `event_detail.user` becomes `user`.
- `event_detail.process` becomes `process`.
- `event_detail.iocs.matches` becomes `ioc_matches`.
- `enrichment.misp_match_count` is computed as the count of `enrichment.misp_matches`.

### Fields Removed Before Output

These fields are intentionally removed by the pipeline:

- `event_detail`
- `log`
- `@version`
- `path`

## Example Output Shape

This is the shape downstream systems should expect:

```json
{
  "@timestamp": "2025-09-21T13:42:18Z",
  "package_id": "pkg-2025-09-21-af-raw-001",
  "alert_id": "af-2025-0912-raw-001",
  "title": "Suspicious Host Activity - SIEM export (raw)",
  "severity": "unknown",
  "detected_at": "2025-09-21T13:45:00Z",
  "source_system": {
    "name": "Elastic Security (ELK)",
    "query": "host.name: HOST-A OR host.name: HOST-B"
  },
  "scope": {
    "network_zone": "NIPR",
    "org_unit": "16AF",
    "time_window": {
      "start": "2025-09-21T13:40:00Z",
      "end": "2025-09-21T13:50:00Z"
    }
  },
  "entities": {
    "hosts": ["HOST-A", "HOST-B"],
    "users": ["DOM\\jdoe"],
    "ips": ["10.0.0.5", "10.0.0.6"],
    "domains": [],
    "hashes": []
  },
  "event": {
    "id": "elastic_doc_0AXv87dfjS2a9",
    "category": "host",
    "action": "execute",
    "subtype": "process_create",
    "kind": "event",
    "dataset": "16af.siem"
  },
  "host": {
    "name": "HOST-A",
    "ip": "10.0.0.5"
  },
  "user": {
    "name": "DOM\\jdoe"
  },
  "process": {
    "name": "psexec.exe",
    "pid": 5012,
    "ppid": 448,
    "cmdline": "C:\\Windows\\psexec.exe \\\\HOST-B cmd.exe"
  },
  "raw_excerpt": "Sysmon EID 1 ...",
  "message": "Sysmon EID 1 ...",
  "ioc_matches": [],
  "enrichment": {
    "misp_matches": [],
    "hostname_reputation": [],
    "file_hash_lookup": [],
    "misp_match_count": 0
  },
  "observer": {
    "type": "logstash",
    "name": "analyst-copilot"
  },
  "tags": ["16af", "siem", "logstash"]
}
```

## Elasticsearch Instructions For Karthik

### Goal

Accept Logstash normalized documents without changing field names.

### Required Elasticsearch Connection Assumptions

- Elasticsearch is reachable from the Logstash container at:
  `http://host.docker.internal:9200`
- Logstash writes to:
  `16af-events-dev`

If Karthik changes the index name, he must update:

- `LOGSTASH_INDEX` in `logstash/.env`

### Required Mapping Types

Use these mappings or equivalent:

- `@timestamp`: `date`
- `detected_at`: `date`
- `scope.time_window.start`: `date`
- `scope.time_window.end`: `date`
- `severity`: `keyword`
- `package_id`: `keyword`
- `alert_id`: `keyword`
- `title`: `text` with optional `keyword` subfield
- `source_system.name`: `keyword`
- `source_system.query`: `text`
- `event.id`: `keyword`
- `event.category`: `keyword`
- `event.action`: `keyword`
- `event.subtype`: `keyword`
- `event.kind`: `keyword`
- `event.dataset`: `keyword`
- `host.name`: `keyword`
- `host.ip`: `ip`
- `user.name`: `keyword`
- `process.name`: `keyword`
- `process.pid`: `integer`
- `process.ppid`: `integer`
- `process.cmdline`: `text`
- `raw_excerpt`: `text`
- `message`: `text`
- `scope.network_zone`: `keyword`
- `scope.org_unit`: `keyword`
- `entities.hosts`: `keyword`
- `entities.users`: `keyword`
- `entities.ips`: `ip`
- `entities.domains`: `keyword`
- `entities.hashes`: `keyword`
- `tags`: `keyword`
- `ioc_matches`: `nested` or `object`
- `enrichment.misp_matches`: `nested` or `object`
- `enrichment.misp_match_count`: `integer`
- `observer.type`: `keyword`
- `observer.name`: `keyword`
- `meta.author`: `keyword`
- `meta.created_at`: `date`
- `meta.schema_version`: `keyword`
- `meta.exported_from`: `keyword`

### Recommended Index Pattern

- `16af-events-*`

### Recommended Initial Index

- `16af-events-dev`

### Elasticsearch Validation Checklist

Karthik or an AI agent should verify:

1. Logstash can connect to Elasticsearch.
2. Documents are created in `16af-events-dev`.
3. `@timestamp` is indexed as a date.
4. `host.ip` and `entities.ips` are indexed as IP fields.
5. `process.cmdline` is searchable as text.
6. Filtering by `event.subtype` works.
7. Filtering by `severity` works.
8. Documents with MISP matches have `enrichment.misp_match_count > 0`.

### Minimal Query Expectations

Elasticsearch should support these exact use cases:

- filter by `host.name`
- filter by `host.ip`
- filter by `user.name`
- filter by `severity`
- filter by `event.subtype`
- filter by `scope.org_unit`
- free-text search on `process.cmdline`
- free-text search on `raw_excerpt`
- filter by time using `@timestamp`

## Kibana Instructions For Nethra

### Goal

Create Kibana visualizations against the Elasticsearch index receiving Logstash-normalized events.

### Required Data View

Create a Kibana data view using:

- `16af-events-dev`

or:

- `16af-events-*`

Time field:

- `@timestamp`

### Required Dashboard Assumptions

Kibana should assume one document equals one event.

Do not build visualizations from package-level counts unless intentionally aggregating event documents.

### Recommended Fields For Filters

- `severity`
- `event.category`
- `event.subtype`
- `event.action`
- `host.name`
- `host.ip`
- `user.name`
- `scope.org_unit`
- `scope.network_zone`
- `tags`

### Recommended Fields For Tables

- `@timestamp`
- `title`
- `severity`
- `host.name`
- `host.ip`
- `user.name`
- `event.category`
- `event.subtype`
- `event.action`
- `process.name`
- `process.cmdline`
- `enrichment.misp_match_count`
- `raw_excerpt`

### Recommended Visualizations

- Event volume over time by `@timestamp`
- Event count by `event.subtype`
- Event count by `host.name`
- Event count by `user.name`
- Event count by `severity`
- Count of events where `enrichment.misp_match_count > 0`
- Search table for suspicious command lines from `process.cmdline`

### Kibana Validation Checklist

Nethra or an AI agent should verify:

1. Kibana data view resolves the index.
2. `@timestamp` is accepted as the time field.
3. Event subtype filters work.
4. Host filters work.
5. Severity filters work.
6. A table can show `raw_excerpt` and `process.cmdline`.
7. Events with enrichment can be isolated.

## AI-Agent Instructions

If an AI agent is asked to connect Elasticsearch and Kibana to Connor's Logstash work, it should do exactly this:

1. Read [logstash/pipeline/16af_ingest.conf](/Users/connor/Downloads/USAF_16_Analyst/logstash/pipeline/16af_ingest.conf).
2. Treat the normalized output shape in this document as the schema contract.
3. Create Elasticsearch mappings that preserve the field names exactly as listed here.
4. Do not rename fields unless Logstash is updated first.
5. Point Elasticsearch ingestion to index `16af-events-dev` or update `LOGSTASH_INDEX` to match.
6. Create a Kibana data view for `16af-events-dev` or `16af-events-*`.
7. Use `@timestamp` as the Kibana time field.
8. Build dashboards around event-level documents, not raw package files.

## Team Coordination Rule

If any downstream teammate wants different field names, the change should happen in Logstash first.

That keeps one contract for ingestion, search, and dashboards instead of three inconsistent versions.

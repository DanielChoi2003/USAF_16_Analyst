# Logstash Module

This folder contains the Logstash portion of the 16th Air Force analyst workflow prototype.

It is designed to do Connor's part of the ELK stack:

- Read SIEM-style package JSON from the repository sample data
- Split each package into one event per output record
- Normalize the event fields into a consistent document shape
- Write normalized records to NDJSON for validation
- Optionally forward those records to Elasticsearch

## Folder Layout

- `docker-compose.yml` - starts Logstash locally
- `config/logstash.yml` - Logstash runtime settings
- `config/pipelines.yml` - pipeline registration
- `pipeline/16af_ingest.conf` - main Logstash ingest pipeline
- `output/` - normalized NDJSON written by the pipeline

## What This Pipeline Does

The sample files in `../data/samples/` contain alert packages with:

- Package metadata
- Scope metadata
- Entity lists
- An `events` array

Logstash reads each package, splits the `events` array, and outputs one normalized event document at a time.

Each normalized record keeps package-level context such as:

- `package_id`
- `alert_id`
- `title`
- `severity`
- `scope`
- `entities`

It also promotes event-level details into searchable fields such as:

- `@timestamp`
- `event.id`
- `event.category`
- `event.action`
- `event.subtype`
- `host`
- `user`
- `process`
- `raw_excerpt`
- `ioc_matches`

## Prerequisites

- Docker

## Quick Start

From the repository root:

```bash
cd logstash
cp .env.example .env
docker compose up
```

By default, the pipeline writes normalized events to:

```bash
logstash/output/normalized-events.ndjson
```

## Elasticsearch Output

Elasticsearch output is disabled by default so this module can still be demonstrated on its own.

To enable shipping to Elasticsearch, set this in `.env`:

```bash
LOGSTASH_ENABLE_ES_OUTPUT=true
ELASTICSEARCH_HOSTS=http://host.docker.internal:9200
LOGSTASH_INDEX=16af-events-dev
```

Then rerun:

```bash
docker compose up
```

## Why This Is Useful For The Project

This gives the team a concrete Logstash ingest layer that already:

- Parses the project's sample JSON format
- Preserves analyst context from the alert package
- Splits package-level exports into event-level records
- Produces a stable document shape for Elasticsearch and Kibana

That means the Elasticsearch and Kibana work can be built on top of a known input format instead of everyone inventing a different schema.

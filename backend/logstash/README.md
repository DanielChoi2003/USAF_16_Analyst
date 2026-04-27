# Logstash Module

This folder contains the Logstash and Kibana support for the current local ELK workflow.

Logstash reads SIEM-style package JSON from `data/samples/`, splits each package into one event document per item in `events[]`, normalizes the fields, writes NDJSON output for inspection, and sends the same normalized events to Elasticsearch.

## Files

- `docker-compose.yml`: starts Kibana and Logstash.
- `config/logstash.yml`: Logstash runtime settings.
- `config/pipelines.yml`: pipeline registration.
- `config/kibana.yml`: local Kibana configuration.
- `pipeline/16af_ingest.conf`: ingest and normalization pipeline.
- `output/normalized-events.ndjson`: generated local output.
- `TEAM_HANDOFF.md`: normalized event schema contract.

## Current Defaults

- Input directory in container: `/usr/share/logstash/ingest`
- Mounted input on host: `data/samples/`
- NDJSON output: `backend/logstash/output/normalized-events.ndjson`
- Elasticsearch index: `investigation-events`
- Elasticsearch URL from container: `https://host.docker.internal:9200`
- Logstash API port: `9600`
- Kibana URL: `http://localhost:5601`

## Run Through Root Launcher

Preferred:

```bash
make up
```

The root launcher starts Elasticsearch first, creates a Kibana service token, then starts Kibana and Logstash with the expected environment.

## Manual Run

From the repo root, make sure `.env` contains Elasticsearch settings, then:

```bash
cd backend/logstash
docker compose up -d kibana logstash
```

To watch logs:

```bash
docker logs -f analyst-copilot-logstash
```

## Environment

The compose file reads root `.env`.

Relevant variables:

```env
LOGSTASH_API_PORT=9600
LOGSTASH_INDEX=investigation-events
LOGSTASH_ENABLE_ES_OUTPUT=true
ELASTICSEARCH_HOSTS=https://host.docker.internal:9200
ELASTICSEARCH_USERNAME=elastic
ELASTIC_PASSWORD=replace-me
```

## Kibana Data View

Create a data view:

- Index pattern: `investigation-events`
- Time field: `@timestamp`

One document equals one normalized event.

## Contract Rule

Downstream Elasticsearch mappings, backend retrieval, and Kibana dashboards should use the normalized field names from `TEAM_HANDOFF.md`.

If a field name needs to change, update the Logstash pipeline and the handoff document together.

# Host Execution JSON Baseline Notes

This file explains the guiding JSON object we are using for Host Execution/Change events.  
Right now, it is meant to be **empty placeholders only** — just a structure for us to build on.

---

## Purpose
- Give the team a **consistent JSON envelope** to work with.
- Show the **core sections** (package header, events, enrichment, derived mapping, report).
- Keep subtype details (`ext`) **blank for now** — we will fill them later when we normalize real SIEM logs.

---

## Key Sections

### 1. Package Metadata
- `package_id`, `alert_id`, `title`, `severity`, `detected_at`  
- High-level context about the bundle of events the analyst or SIEM hands to us.

### 2. Scope
- Where/when this data slice came from.  
- Example: `network_zone`, `org_unit`, `time_window`.

### 3. Entities
- Aggregated unique items mentioned across events.  
- Hosts, users, IPs, domains, hashes.

### 4. Events
- **Core fields** are always present: `id`, `timestamp`, `category`, `subtype`, `host`, `user`, `process`, `raw_excerpt`.  
- **Dynamic section**: `ext` has placeholders for different sub-archetypes (`process_create`, `service_change`, `registry_set`, `scheduled_task_change`).  
  - Right now, these are **empty objects**.  
  - Later, we’ll populate only the one that applies to the subtype (perhaps using an LLM).

### 5. Enrichment
- Blank lists for `misp_matches`, `hostname_reputation`, and `file_hash_lookup`.  
- These will be filled in by deterministic enrichment steps (not by the LLM).

### 6. Derived
- `attack_candidates`: where ATT&CK mappings will go.  
- Initially empty; the LLM or mapping logic will populate it.

### 7. Recommendations
- Empty list now.  
- Later will hold suggested analyst actions (e.g., isolate host, block IP).

### 8. Report
- Fields for `summary`, `observations`, `confidence`, and `raw_links`.  
- These start blank but give the LLM a consistent structure to fill.

### 9. Meta
- Metadata about who/when created the package.  
- Includes `schema_version` so we can track revisions.

---

## Why This Matters
- Everyone on the team will be working with the same **shape of data**.  
- Even if fields are blank now, we won’t have to redesign the schema later.  
- The LLM always gets predictable input, which reduces errors.  
- Sub-archetype details can be added incrementally without breaking the rest of the pipeline.

---

## Next Steps
1. Use this JSON as a **template** for any host execution slice we test.  
2. Don’t worry about filling every field — just populate what you have.  
3. Later, we will:
   - Build a small mapping layer (SIEM EventID → `subtype`).  
   - Fill the right `ext` object with fields from Sysmon/Windows logs.  
   - Add MISP enrichment.  
   - Test LLM prompts that generate `report.summary` and `derived.attack_candidates`.

---

## Final Note
This object is intentionally lightweight and empty.  
Think of it as the scaffolding for our capstone: consistent structure first, real data second.

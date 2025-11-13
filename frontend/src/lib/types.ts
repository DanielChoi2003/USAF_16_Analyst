/**
 * TypeScript type definitions for Package JSON Schema
 * 
 * These types match the baseline.json and enriched.json schemas.
 * They ensure type safety across the entire application.
 * 
 * Generated from: /data/samples/baseline.json
 * Author: Ethan Curb
 * Last Updated: 2025-10-11
 */

// ── Core Package Structure ──────────────────────────────────────────────────

export interface Package {
  package_id: string
  alert_id: string
  title: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  detected_at: string  // ISO 8601 timestamp
  source_system: SourceSystem
  scope: Scope
  entities: Entities
  events: Event[]
  enrichment: Enrichment
  derived: Derived
  recommendations: string[]
  report: Report
  meta: Meta
}

// ── Source System ───────────────────────────────────────────────────────────

export interface SourceSystem {
  name: string  // e.g., "Elastic", "Splunk", "Sentinel"
  query: string  // Original SIEM query
}

// ── Scope ───────────────────────────────────────────────────────────────────

export interface Scope {
  network_zone: string  // e.g., "NIPR", "SIPR", "DMZ"
  org_unit: string      // e.g., "16AF", "ACC"
  time_window: TimeWindow
}

export interface TimeWindow {
  start: string  // ISO 8601
  end: string    // ISO 8601
}

// ── Entities ────────────────────────────────────────────────────────────────

export interface Entities {
  hosts: string[]
  users: string[]
  ips: string[]
  domains: string[]
  hashes: string[]
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface Event {
  id: string
  timestamp: string  // ISO 8601
  category: 'host' | 'network' | 'cloud' | 'application'
  subtype: string    // e.g., "process_create", "service_change"
  action: string
  host?: Host
  user?: User
  process?: Process
  network?: Network
  iocs: IOCs
  raw_excerpt: string  // Short preview
  ext: EventExtensions
}

export interface Host {
  name: string
  ip: string
}

export interface User {
  name: string
  domain?: string
}

export interface Process {
  name: string
  pid: number | null
  ppid: number | null
  cmdline: string
  hash?: string
}

export interface Network {
  src_ip?: string
  dst_ip?: string
  src_port?: number
  dst_port?: number
  protocol?: string
}

export interface IOCs {
  matched: boolean
  matches: IOCMatch[]
}

export interface IOCMatch {
  type: 'hash' | 'ip' | 'domain' | 'filename'
  value: string
  confidence: 'Low' | 'Medium' | 'High'
}

export interface EventExtensions {
  process_create?: Record<string, any>
  service_change?: Record<string, any>
  registry_set?: Record<string, any>
  scheduled_task_change?: Record<string, any>
}

// ── Enrichment ──────────────────────────────────────────────────────────────

export interface Enrichment {
  misp_matches: MISPMatch[]
  hostname_reputation: any[]  // TODO: Define schema
  file_hash_lookup: any[]     // TODO: Define schema
}

export interface MISPMatch {
  match_id: string
  ioc: string
  type: 'hash' | 'ip' | 'domain' | 'filename'
  misp_event_id: string
  misp_event_title: string
  first_seen: string  // ISO 8601
  last_seen: string   // ISO 8601
  tags: string[]
  related_techniques: string[]  // MITRE ATT&CK IDs (e.g., "T1569.002")
  related_actors: string[]
  confidence: 'Low' | 'Medium' | 'High'
  evidence_event_ids: string[]
  source: string
  reference: string  // URL
}

// ── Derived Data (from RAG/LLM) ─────────────────────────────────────────────

export interface Derived {
  attack_candidates: AttackCandidate[]
}

export interface AttackCandidate {
  technique_id: string      // e.g., "T1569.002"
  technique_name: string    // e.g., "Remote Service (PsExec)"
  tactic: string            // e.g., "Lateral Movement"
  confidence: number        // 0.0 to 1.0
  rationale: string         // Brief explanation
  evidence_event_ids: string[]
  mitre_description?: string  // From MITRE ATT&CK
  mitre_detection?: string
  mitre_mitigation?: string
}

// ── Report (LLM-generated) ──────────────────────────────────────────────────

export interface Report {
  summary: string  // Editable rich text
  observations: Observation[]
  confidence: 'Low' | 'Medium' | 'High'
  raw_links: RawLinks
}

export interface Observation {
  text: string
  evidence_event_ids: string[]
}

export interface RawLinks {
  kibana_search: string
  ticket_reference: string
}

// ── Metadata ────────────────────────────────────────────────────────────────

export interface Meta {
  author: string     // Analyst username
  created_at: string // ISO 8601
  schema_version: string
  llm_calls?: LLMCall[]  // Provenance tracking
}

export interface LLMCall {
  id: string
  timestamp: string  // ISO 8601
  operation: 'generate_summary' | 'regenerate_section' | 'ask_question'
  prompt: string     // Redacted in some views
  response: string
  model: string      // e.g., "gpt-4-turbo-preview"
  references_used: string[]  // Event IDs, MISP IDs, technique IDs
  token_count: number
}

// ── UI State Types (Frontend-only) ──────────────────────────────────────────

export interface PackageFilters {
  severity: ('Low' | 'Medium' | 'High' | 'Critical')[]
  hosts: string[]
  subtypes: string[]
  date_range?: TimeWindow
}

export interface UIState {
  selected_event_id: string | null
  selected_technique_id: string | null
  show_provenance: boolean
  show_raw_json: boolean
}

// ── API Response Types ──────────────────────────────────────────────────────

export interface PackageListResponse {
  packages: PackageSummary[]
  total: number
  page: number
  page_size: number
}

export interface PackageSummary {
  package_id: string
  title: string
  severity: Package['severity']
  detected_at: string
  status: 'draft' | 'reviewed' | 'exported'
}

export interface LLMActionRequest {
  package_id: string
  operation: LLMCall['operation']
  context?: string  // User input for "ask_question"
  section?: string  // For "regenerate_section"
}

export interface LLMActionResponse {
  operation: LLMCall['operation']
  result: string
  references: string[]
  llm_call_id: string
}

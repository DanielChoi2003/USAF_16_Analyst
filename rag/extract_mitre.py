"""
extract_mitre.py

Downloads the MITRE ATT&CK enterprise dataset and extracts techniques,
tactics, groups (APTs), software, mitigations, and relationships into
clean .txt files ready for incremental_rag.py ingestion.

Usage:
    python extract_mitre.py

    # Use a locally cached JSON instead of downloading:
    python extract_mitre.py --json path/to/enterprise-attack.json

    # Change output directory (default: ./mitre_data):
    python extract_mitre.py --out ./my_output_dir

Requirements:
    pip install mitreattack-python requests
"""

import argparse
import json
import os
import requests

from mitreattack.stix20 import MitreAttackData


# ── config ────────────────────────────────────────────────────────────────────

MITRE_JSON_URL = (
    "https://raw.githubusercontent.com/mitre/cti/master/"
    "enterprise-attack/enterprise-attack.json"
)
DEFAULT_JSON_PATH = "./enterprise-attack.json"
DEFAULT_OUT_DIR   = "./mitre_data"


# ── download ──────────────────────────────────────────────────────────────────

def download_mitre_json(dest_path: str) -> None:
    if os.path.exists(dest_path):
        print(f"[skip] MITRE JSON already exists at {dest_path}")
        return

    print(f"Downloading MITRE ATT&CK JSON from GitHub...")
    response = requests.get(MITRE_JSON_URL, stream=True)
    response.raise_for_status()

    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=65536):
            f.write(chunk)
    print(f"[ok] Saved to {dest_path}")


# ── formatters ────────────────────────────────────────────────────────────────

def format_techniques(mitre: MitreAttackData) -> str:
    lines = []
    techniques = mitre.get_techniques(remove_revoked_deprecated=True)

    for t in techniques:
        props = t.get("object", t)
        tid        = _get_external_id(props)
        name       = props.get("name", "Unknown")
        desc       = _clean(props.get("description", ""))
        platforms  = ", ".join(props.get("x_mitre_platforms", []))
        detection  = _clean(props.get("x_mitre_detection", ""))
        is_sub     = props.get("x_mitre_is_subtechnique", False)
        tactic_phases = [p["phase_name"] for p in props.get("kill_chain_phases", [])]
        tactics    = ", ".join(tactic_phases)

        entry = (
            f"TECHNIQUE: {tid} - {name}\n"
            f"Type: {'Sub-technique' if is_sub else 'Technique'}\n"
            f"Tactics: {tactics}\n"
            f"Platforms: {platforms}\n"
            f"Description: {desc}\n"
        )
        if detection:
            entry += f"Detection: {detection}\n"
        entry += "\n" + "-" * 60 + "\n"
        lines.append(entry)

    return "\n".join(lines)


def format_tactics(mitre: MitreAttackData) -> str:
    lines = []
    tactics = mitre.get_tactics()

    for t in tactics:
        props = t.get("object", t)
        tid   = _get_external_id(props)
        name  = props.get("name", "Unknown")
        desc  = _clean(props.get("description", ""))

        entry = (
            f"TACTIC: {tid} - {name}\n"
            f"Description: {desc}\n"
            f"\n" + "-" * 60 + "\n"
        )
        lines.append(entry)

    return "\n".join(lines)


def format_groups(mitre: MitreAttackData) -> str:
    """Groups = APTs / threat actors."""
    lines = []
    groups = mitre.get_groups(remove_revoked_deprecated=True)

    for g in groups:
        props   = g.get("object", g)
        gid     = _get_external_id(props)
        name    = props.get("name", "Unknown")
        aliases = ", ".join(props.get("aliases", []))
        desc    = _clean(props.get("description", ""))

        entry = (
            f"APT GROUP: {gid} - {name}\n"
            f"Aliases: {aliases}\n"
            f"Description: {desc}\n"
            f"\n" + "-" * 60 + "\n"
        )
        lines.append(entry)

    return "\n".join(lines)


def format_software(mitre: MitreAttackData) -> str:
    """Malware and tools."""
    lines = []
    software = mitre.get_software(remove_revoked_deprecated=True)

    for s in software:
        props     = s.get("object", s)
        sid       = _get_external_id(props)
        name      = props.get("name", "Unknown")
        sw_type   = props.get("type", "unknown")
        platforms = ", ".join(props.get("x_mitre_platforms", []))
        aliases   = ", ".join(props.get("x_mitre_aliases", []))
        desc      = _clean(props.get("description", ""))

        entry = (
            f"SOFTWARE: {sid} - {name}\n"
            f"Type: {sw_type}\n"
            f"Platforms: {platforms}\n"
            f"Aliases: {aliases}\n"
            f"Description: {desc}\n"
            f"\n" + "-" * 60 + "\n"
        )
        lines.append(entry)

    return "\n".join(lines)


def format_mitigations(mitre: MitreAttackData) -> str:
    lines = []
    mitigations = mitre.get_mitigations(remove_revoked_deprecated=True)

    for m in mitigations:
        props = m.get("object", m)
        mid   = _get_external_id(props)
        name  = props.get("name", "Unknown")
        desc  = _clean(props.get("description", ""))

        entry = (
            f"MITIGATION: {mid} - {name}\n"
            f"Description: {desc}\n"
            f"\n" + "-" * 60 + "\n"
        )
        lines.append(entry)

    return "\n".join(lines)


def format_relationships(mitre: MitreAttackData) -> str:
    lines = []

    # Groups -> Techniques
    try:
        group_technique_map = mitre.get_techniques_used_by_all_groups()
        for group_stix_id, entries in group_technique_map.items():
            group_obj = mitre.get_object_by_stix_id(group_stix_id)
            group_name = f"{_get_external_id(group_obj)} {group_obj.get('name', '')}" if group_obj else group_stix_id
            for entry in entries:
                tech = entry.get("object", {})
                tech_name = f"{_get_external_id(tech)} {tech.get('name', '')}"
                desc = _clean(entry.get("relationships", [{}])[0].get("description", "") if entry.get("relationships") else "")
                line = f"RELATIONSHIP: {group_name} --[uses]--> {tech_name}\n"
                if desc:
                    line += f"Description: {desc}\n"
                lines.append(line)
    except Exception as e:
        lines.append(f"# Could not extract group->technique relationships: {e}\n")

    # Groups -> Software
    try:
        group_software_map = mitre.get_software_used_by_all_groups()
        for group_stix_id, entries in group_software_map.items():
            group_obj = mitre.get_object_by_stix_id(group_stix_id)
            group_name = f"{_get_external_id(group_obj)} {group_obj.get('name', '')}" if group_obj else group_stix_id
            for entry in entries:
                soft = entry.get("object", {})
                soft_name = f"{_get_external_id(soft)} {soft.get('name', '')}"
                desc = _clean(entry.get("relationships", [{}])[0].get("description", "") if entry.get("relationships") else "")
                line = f"RELATIONSHIP: {group_name} --[uses]--> {soft_name}\n"
                if desc:
                    line += f"Description: {desc}\n"
                lines.append(line)
    except Exception as e:
        lines.append(f"# Could not extract group->software relationships: {e}\n")

    # Software -> Techniques
    try:
        software_technique_map = mitre.get_techniques_used_by_all_software()
        for software_stix_id, entries in software_technique_map.items():
            soft_obj = mitre.get_object_by_stix_id(software_stix_id)
            soft_name = f"{_get_external_id(soft_obj)} {soft_obj.get('name', '')}" if soft_obj else software_stix_id
            for entry in entries:
                tech = entry.get("object", {})
                tech_name = f"{_get_external_id(tech)} {tech.get('name', '')}"
                desc = _clean(entry.get("relationships", [{}])[0].get("description", "") if entry.get("relationships") else "")
                line = f"RELATIONSHIP: {soft_name} --[uses]--> {tech_name}\n"
                if desc:
                    line += f"Description: {desc}\n"
                lines.append(line)
    except Exception as e:
        lines.append(f"# Could not extract software->technique relationships: {e}\n")

    # Mitigations -> Techniques
    try:
        mitigation_technique_map = mitre.get_techniques_mitigated_by_all_mitigations()
        for mit_stix_id, entries in mitigation_technique_map.items():
            mit_obj = mitre.get_object_by_stix_id(mit_stix_id)
            mit_name = f"{_get_external_id(mit_obj)} {mit_obj.get('name', '')}" if mit_obj else mit_stix_id
            for entry in entries:
                tech = entry.get("object", {})
                tech_name = f"{_get_external_id(tech)} {tech.get('name', '')}"
                desc = _clean(entry.get("relationships", [{}])[0].get("description", "") if entry.get("relationships") else "")
                line = f"RELATIONSHIP: {mit_name} --[mitigates]--> {tech_name}\n"
                if desc:
                    line += f"Description: {desc}\n"
                lines.append(line)
    except Exception as e:
        lines.append(f"# Could not extract mitigation->technique relationships: {e}\n")

    return "\n".join(lines)


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_external_id(props: dict) -> str:
    for ref in props.get("external_references", []):
        if ref.get("source_name") in ("mitre-attack", "mitre-mobile-attack", "mitre-ics-attack"):
            return ref.get("external_id", "")
    return ""


def _clean(text: str) -> str:
    """Strip excessive whitespace and citation markers like (Citation: ...)."""
    import re
    text = re.sub(r"\(Citation:[^)]+\)", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def write(path: str, content: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    size_kb = os.path.getsize(path) / 1024
    print(f"[ok] {path}  ({size_kb:.1f} KB)")


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Extract MITRE ATT&CK data into .txt files for RAG ingestion."
    )
    parser.add_argument(
        "--json",
        metavar="PATH",
        default=DEFAULT_JSON_PATH,
        help=f"Path to enterprise-attack.json (default: {DEFAULT_JSON_PATH}). "
             "Downloaded automatically if not present.",
    )
    parser.add_argument(
        "--out",
        metavar="DIR",
        default=DEFAULT_OUT_DIR,
        help=f"Output directory for .txt files (default: {DEFAULT_OUT_DIR}).",
    )
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)

    # 1. Ensure JSON is available
    download_mitre_json(args.json)

    # 2. Load dataset
    print(f"\nLoading MITRE ATT&CK data from {args.json}...")
    mitre = MitreAttackData(args.json)
    print("[ok] Dataset loaded.\n")

    # 3. Extract and write each category
    print("Extracting and writing files...")

    write(os.path.join(args.out, "techniques.txt"),    format_techniques(mitre))
    write(os.path.join(args.out, "tactics.txt"),       format_tactics(mitre))
    write(os.path.join(args.out, "groups.txt"),        format_groups(mitre))
    write(os.path.join(args.out, "software.txt"),      format_software(mitre))
    write(os.path.join(args.out, "mitigations.txt"),   format_mitigations(mitre))
    write(os.path.join(args.out, "relationships.txt"), format_relationships(mitre))

    print(f"\nAll files written to: {args.out}/")
    print("\nNext step — ingest into RAG:")
    print(f"  python incremental_rag.py --dir {args.out}")


if __name__ == "__main__":
    main()

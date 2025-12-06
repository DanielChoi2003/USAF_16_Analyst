import json
from pymisp import PyMISP
import datetime
import re
import urllib3
import ipaddress
import sys
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
        return not (addr.is_private or addr.is_loopback or addr.is_link_local)
    except ValueError:
        return False



def extract_ioc(alert_json):
    """
    Extract common IoCs directly from the JSON structure.
    Assumes alert_json is a Python dict (already parsed from JSON).
    """
    entities = {
        "hosts": [],
        "users": [],
        "ips": [],
        "domains": [],
        "hashes": []
    }

    ioc = []

    # Define simple regex validators
    ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    domain_pattern = re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b')
    sha256_pattern = re.compile(r'\b[a-fA-F0-9]{64}\b')
    # TODO: Add TTP Extraction
    ttp_pattern = re.compile(r'\bT\d{4}(?:\.\d{3})?\b')


    # Helper to recursively find string values
    def recurse(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                recurse(v)
        elif isinstance(obj, list):
            for item in obj:
                recurse(item)
        elif isinstance(obj, str):
            if ip_pattern.fullmatch(obj) and is_public_ip(obj):
                ioc.append(obj)
                # entities["ips"].append(obj)
            elif sha256_pattern.fullmatch(obj):
                ioc.append(obj)
                # entities["hashes"].append(obj)
            elif domain_pattern.fullmatch(obj) and not ip_pattern.fullmatch(obj):
                ioc.append(obj)
                # entities["domains"].append(obj)
            elif ttp_pattern.fullmatch(obj):
                ioc.append(obj)

    recurse(alert_json)
    return ioc


def enrich_alert(alert_json, misp_instance):
    """
    Query MISP for IoC matches and enrich the alert JSON.
    Populates alert_json["enrichment"]["misp_matches"]
    """
    enrichment = {
        "misp_matches": [],
        "hostname_reputation": [],
        "file_hash_lookup": []
    }

    entities = alert_json.get("entities", {})
    all_iocs = entities.get("ips", []) + entities.get("domains", []) + entities.get("hashes", [])

    for ioc in all_iocs:
        results = misp_instance.search(controller='attributes', value=ioc)
        print(f"Querying: {ioc}")

        for event in results.get('response', []):
            event_info = event.get('Event', {})
            attrs = event_info.get('Attribute', [])

            match = {
                "match_id": event_info.get("uuid", ""),
                "ioc": ioc,
                "type": attrs[0].get("type") if attrs else "",
                "misp_event_id": event_info.get("id", ""),
                "misp_event_title": event_info.get("info", ""),
                "first_seen": event_info.get("date", ""),
                "last_seen": event_info.get("timestamp", ""),
                "tags": [t["name"] for t in event_info.get("Tag", [])],
                "related_techniques": [
                    g["name"] for g in event_info.get("Galaxy", [])
                    if "attack-pattern" in g.get("type", "")
                ],
                "related_actors": [
                    g["name"] for g in event_info.get("Galaxy", [])
                    if "threat-actor" in g.get("type", "")
                ],
                "confidence": event_info.get("threat_level_id", ""),
                "evidence_event_ids": [event_info.get("id")],
                "source": "MISP",
                "reference": event_info.get("Orgc", {}).get("name", "")
            }

            enrichment["misp_matches"].append(match)

    alert_json["enrichment"] = enrichment
    return alert_json



def query_misp(ioc):
    print(f"Querying: {ioc}")
    results = misp.search(controller='attributes', value=ioc)
    return results.get('response', [])

def query_ip(ip):
    results = misp.search(controller='attributes', value=ip)
    return results








if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_path> <output_path>")
        sys.exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2]

    # set up connection to MISP instance
    URL = "https://localhost"
    SSL = False
    API_KEY = "Brl6dZnv3vspXIWjMUBYsSNfLRf41sXbyYIN1ViX"     # KEY FOR TESTING PURPOSES ON LOCALHOST ONLY, CHANGE KEY IF SETTING UP LIVE SERVER
    misp = PyMISP(URL, API_KEY, SSL)

    with open(input_path, "r") as f:
        raw_alert = json.load(f)

    ioc = extract_ioc(raw_alert)
    # print(f"IOCs:\n{ioc}")

    enrichment = []
    for i in ioc:
        enrichment.append(misp.search(controller='attributes', value=i))
    with open(output_path, "w") as f:
        json.dump(enrichment,f, indent=2)
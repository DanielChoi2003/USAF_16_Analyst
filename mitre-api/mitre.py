from taxii2client import Server
import sys
import pickle
import json

# Change this to the URL your TAXII server exposes
TAXII_URL = "https://attack-taxii.mitre.org/taxii2/"  
TACTICS_PATH = "tactics.pkl"
TECHNIQUES_PATH = "techniques.pkl"
RELATIONSHIPS_PATH = "relationships.pkl"

def update_info():
    server = Server(TAXII_URL, verify=True)  
    api_roots = server.api_roots
    if not api_roots:
        print("No API roots from TAXII server", file=sys.stderr)
        sys.exit(1)
    api_root = api_roots[0]

    print("Using API root:", api_root.url)
    for coll in api_root.collections:
        print("Collection:", coll.title, " — ID:", coll.id)

    # Suppose you know the “Enterprise ATT&CK” collection
    collection = next((c for c in api_root.collections if "Enterprise" in c.title), api_root.collections[0])
    objs = collection.get_objects().get("objects", [])

    # Extract techniques, tactics
    tactics    = [o for o in objs if o.get("type") == "x-mitre-tactic"]
    techniques = [o for o in objs if o.get("type") == "attack-pattern"]
    relationships = [o for o in objs if o.get("type") == "relationship"]

    print("Tactics:", len(tactics))
    print("Techniques:", len(techniques))
    print("Relationships:", len(relationships))

    tactics_path = "tactics.pkl"
    techniques_path = "techniques.pkl"
    relationships_path = "relationships.pkl"

    with open(tactics_path, 'wb') as f:
        pickle.dump(tactics, f)
    with open(techniques_path, 'wb') as f:
        pickle.dump(techniques, f)
    with open(relationships_path, 'wb') as f:
        pickle.dump(relationships, f)

def unpickle():
    with open(TECHNIQUES_PATH, 'rb') as f:
        techniques = pickle.load(f)
    with open(TACTICS_PATH, 'rb') as f:
        tactics = pickle.load(f)
    with open(RELATIONSHIPS_PATH, 'rb') as f:
        relationships = pickle.load(f)
    return techniques, tactics, relationships


def main(): 

    techniques, tactics, relationships = unpickle()
    print(json.dumps(techniques [0], indent=4))
    # Print sample technique
    # for t in techniques:
        # pretty_json_string = json.dumps(t, indent=4)
        # print(pretty_json_string)
        # break
        # extid = None
        # for ref in t.get("external_references", []):
        #     if ref.get("source_name") == "mitre-attack":
        #         extid = ref.get("external_id")
        # print(f"{extid or 'N/A'} – {t.get('name')}")

if __name__ == "__main__":
    main()

"""
Inspect the structure and contents of LightRAG's vdb_*.json files.
Prints a sample record (without vector) and summary stats for each.
"""
import json
import os

WORKING_DIR = "./rag_data"

FILES = {
    "Entities":      "vdb_entities.json",
    "Relationships": "vdb_relationships.json",
}

def load(filename: str) -> dict:
    path = os.path.join(WORKING_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def strip_vector(record: dict) -> dict:
    return {k: v for k, v in record.items() if k != "vector"}

def inspect(label: str, filename: str):
    print(f"\n{'='*60}")
    print(f"  {label.upper()}  ({filename})")
    print(f"{'='*60}")

    try:
        data = load(filename)
    except FileNotFoundError:
        print(f"  [FILE NOT FOUND]")
        return

    # Top-level keys (e.g. "embedding_dim", "data")
    top_keys = list(data.keys())
    print(f"\nTop-level keys: {top_keys}")

    if "embedding_dim" in data:
        print(f"Embedding dim:  {data['embedding_dim']}")

    records = data.get("data", [])
    print(f"Total records:  {len(records)}")

    if not records:
        print("  [NO RECORDS FOUND]")
        return

    # Show all keys present across first 5 records
    all_keys = set()
    for r in records[:5]:
        all_keys.update(r.keys())
    print(f"Record keys:    {sorted(all_keys)}")

    # Sample: first record without vector
    print(f"\n--- Sample record [0] ---")
    print(json.dumps(strip_vector(records[0]), indent=2, ensure_ascii=False))

    # Sample: second record without vector (to spot patterns)
    if len(records) > 1:
        print(f"\n--- Sample record [1] ---")
        print(json.dumps(strip_vector(records[1]), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    for label, filename in FILES.items():
        inspect(label, filename)
    print(f"\n{'='*60}\nDone.\n")
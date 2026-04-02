from dotenv import load_dotenv
import os
import json
import requests
import urllib3

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ELASTIC_URL = "https://localhost:9200"
USERNAME = "elastic"
PASSWORD = os.getenv("ELASTIC_PASSWORD")
INDEX_NAME = "investigation-events"

ALLOWED_FIELDS = ["source_ip", "user", "event_type"]


def build_query(field: str, value: str) -> dict:
    return {
        "query": {
            "match": {
                field: value
            }
        }
    }


def main() -> None:
    print("Searchable fields:")
    for field in ALLOWED_FIELDS:
        print(f"- {field}")

    field = input("\nEnter a field to search by: ").strip()
    if field not in ALLOWED_FIELDS:
        print(f"Invalid field. Choose one of: {', '.join(ALLOWED_FIELDS)}")
        return

    value = input(f"Enter the value for '{field}': ").strip()
    if not value:
        print("Search value cannot be empty.")
        return

    query = build_query(field, value)
    url = f"{ELASTIC_URL}/{INDEX_NAME}/_search"

    try:
        response = requests.get(
            url,
            json=query,
            auth=(USERNAME, PASSWORD),
            verify=False,
            timeout=10
        )

        print("\nStatus code:", response.status_code)

        if response.status_code != 200:
            print("Error response:")
            print(response.text)
            return

        data = response.json()
        hits = data.get("hits", {}).get("hits", [])

        print(f"\nFound {len(hits)} matching event(s):\n")

        if not hits:
            print("No matching events found.")
            return

        for i, hit in enumerate(hits, start=1):
            print(f"Result {i}:")
            print(json.dumps(hit["_source"], indent=2))
            print("-" * 50)

    except Exception as e:
        print("Search failed:")
        print(e)


if __name__ == "__main__":
    main()
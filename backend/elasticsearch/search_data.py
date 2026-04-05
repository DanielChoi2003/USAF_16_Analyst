import requests
import json
from config import ELASTIC_URL, INDEX_NAME, PASSWORD, USERNAME

query = {
    "query": {
        "match": {
            "source_ip": "203.0.113.45"
        }
    }
}

def main():
    url = f"{ELASTIC_URL}/{INDEX_NAME}/_search"

    response = requests.get(
        url,
        json=query,
        auth=(USERNAME, PASSWORD),
        verify=False
    )

    print("Status code:", response.status_code)

    data = response.json()
    hits = data.get("hits", {}).get("hits", [])

    print(f"\nFound {len(hits)} matching events:\n")

    for hit in hits:
        print(json.dumps(hit["_source"], indent=2))
        print("-" * 50)

if __name__ == "__main__":
    main()

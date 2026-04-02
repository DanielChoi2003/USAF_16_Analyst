from dotenv import load_dotenv
import os
import requests
import urllib3
import json

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ELASTIC_URL = "https://localhost:9200"
USERNAME = "elastic"
PASSWORD = os.getenv("ELASTIC_PASSWORD")

INDEX_NAME = "investigation-events"

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
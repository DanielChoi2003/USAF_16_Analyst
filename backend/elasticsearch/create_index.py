from dotenv import load_dotenv
import os
import requests
import urllib3

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ELASTIC_URL = "https://localhost:9200"
USERNAME = "elastic"
PASSWORD = os.getenv("ELASTIC_PASSWORD")

INDEX_NAME = "investigation-events"

def main():
    url = f"{ELASTIC_URL}/{INDEX_NAME}"

    response = requests.put(
        url,
        auth=(USERNAME, PASSWORD),
        verify=False
    )

    print("Status code:", response.status_code)
    print(response.text)

if __name__ == "__main__":
    main()
from dotenv import load_dotenv
import os
import requests
import urllib3

load_dotenv()
# Disable SSL warning (since ES uses self-signed cert)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ELASTIC_URL = "https://localhost:9200"
USERNAME = "elastic"
PASSWORD = os.getenv("ELASTIC_PASSWORD")

def main():
    try:
        response = requests.get(
            ELASTIC_URL,
            auth=(USERNAME, PASSWORD),
            verify=False  # ignore self-signed cert
        )

        print("Status code:", response.status_code)
        print(response.json())

    except Exception as e:
        print("Connection failed:", e)

if __name__ == "__main__":
    main()
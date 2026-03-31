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

sample_docs = [
    {
        "alert_id": "A-1001",
        "event_type": "failed_login",
        "user": "jsmith",
        "source_ip": "203.0.113.45",
        "hostname": "host-22",
        "timestamp": "2026-03-31T14:20:00Z",
        "severity": "medium",
        "attack_technique": "T1110",
        "message": "Multiple failed logins detected"
    },
    {
        "alert_id": "A-1002",
        "event_type": "successful_login",
        "user": "jsmith",
        "source_ip": "203.0.113.45",
        "hostname": "host-22",
        "timestamp": "2026-03-31T14:24:00Z",
        "severity": "high",
        "attack_technique": "T1078",
        "message": "Successful login after repeated failures"
    },
    {
        "alert_id": "A-1003",
        "event_type": "powershell_execution",
        "user": "admin",
        "source_ip": "198.51.100.12",
        "hostname": "host-31",
        "timestamp": "2026-03-31T15:00:00Z",
        "severity": "high",
        "attack_technique": "T1059",
        "message": "Suspicious PowerShell execution observed"
    }
]

def main():
    for doc in sample_docs:
        url = f"{ELASTIC_URL}/{INDEX_NAME}/_doc"
        response = requests.post(
            url,
            json=doc,
            auth=(USERNAME, PASSWORD),
            verify=False
        )

        print(response.status_code, response.json())

if __name__ == "__main__":
    main()
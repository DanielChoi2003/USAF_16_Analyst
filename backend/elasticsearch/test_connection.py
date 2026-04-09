import requests
from config import ELASTIC_URL, PASSWORD, USERNAME

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

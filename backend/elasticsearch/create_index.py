import requests
from config import ELASTIC_URL, INDEX_NAME, PASSWORD, USERNAME

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

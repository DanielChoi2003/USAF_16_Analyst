from dotenv import load_dotenv
import os
import urllib3

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ELASTIC_URL = os.getenv("ELASTIC_URL") or os.getenv("ELASTICSEARCH_URL") or "https://localhost:9200"
USERNAME = os.getenv("ELASTIC_USERNAME") or os.getenv("ELASTICSEARCH_USERNAME") or "elastic"
PASSWORD = os.getenv("ELASTIC_PASSWORD")
INDEX_NAME = os.getenv("ELASTIC_INDEX_NAME") or os.getenv("ELASTICSEARCH_INDEX") or "investigation-events"

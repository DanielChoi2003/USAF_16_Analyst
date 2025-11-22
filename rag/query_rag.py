import asyncio
import os
import inspect
import logging
import logging.config
from lightrag import LightRAG, QueryParam
from lightrag.llm.ollama import ollama_model_complete, ollama_embed
from lightrag.utils import EmbeddingFunc, logger, set_verbose_debug
from lightrag.kg.shared_storage import initialize_pipeline_status
import pickle


from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env", override=True)

WORKING_DIR = os.path.join(os.path.dirname(__file__), "rag_data")



def configure_logging():
    """Configure logging for the application"""

    # Reset any existing handlers to ensure clean configuration
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error", "lightrag"]:
        logger_instance = logging.getLogger(logger_name)
        logger_instance.handlers = []
        logger_instance.filters = []

    # Get log directory path from environment variable or use current directory
    log_dir = os.getenv("LOG_DIR", os.getcwd())
    log_file_path = os.path.abspath(os.path.join(log_dir, "lightrag_ollama_demo.log"))

    print(f"\nLightRAG compatible demo log file: {log_file_path}\n")
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    # Get log file max size and backup count from environment variables
    log_max_bytes = int(os.getenv("LOG_MAX_BYTES", 10485760))  # Default 10MB
    log_backup_count = int(os.getenv("LOG_BACKUP_COUNT", 5))  # Default 5 backups

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(levelname)s: %(message)s",
                },
                "detailed": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "console": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stderr",
                },
                "file": {
                    "formatter": "detailed",
                    "class": "logging.handlers.RotatingFileHandler",
                    "filename": log_file_path,
                    "maxBytes": log_max_bytes,
                    "backupCount": log_backup_count,
                    "encoding": "utf-8",
                },
            },
            "loggers": {
                "lightrag": {
                    "handlers": ["console", "file"],
                    "level": "INFO",
                    "propagate": False,
                },
            },
        }
    )

    # Set the logger level to INFO
    logger.setLevel(logging.INFO)
    # Enable verbose debug if needed
    set_verbose_debug(os.getenv("VERBOSE_DEBUG", "false").lower() == "true")


if not os.path.exists(WORKING_DIR):
    os.mkdir(WORKING_DIR)


async def initialize_rag():
    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=ollama_model_complete,
        llm_model_name=os.getenv("LLM_MODEL", "gemma3:latest"),
        graph_storage="Neo4JStorage",
        llm_model_kwargs={
            "host": os.getenv("LLM_HOST", "http://localhost:11434"),
            "options": {"num_ctx": 131072, "temperature": 0.7},
            "timeout": int(os.getenv("TIMEOUT", "300")),
        },
        embedding_func=EmbeddingFunc(
            embedding_dim=int(os.getenv("EMBEDDING_DIM", "1024")),
            max_token_size=int(os.getenv("MAX_EMBED_TOKENS", "131072")),
            func=lambda texts: ollama_embed(
                texts,
                embed_model=os.getenv("EMBEDDING_MODEL", "mxbai-embed-large:latest"),
                host=os.getenv("EMBEDDING_HOST", "http://localhost:11434"),
            ),
        ),
    )

    await rag.initialize_storages()
    await initialize_pipeline_status()

    return rag


async def print_stream(stream):
    async for chunk in stream:
        print(chunk, end="", flush=True)


async def query_rag(query: str, qmode: str):
    rag = None
    try:
        # Clear old data files
        # files_to_delete = [
        #     "graph_chunk_entity_relation.graphml",
        #     "kv_store_doc_status.json",
        #     "kv_store_full_docs.json",
        #     "kv_store_text_chunks.json",
        #     "vdb_chunks.json",
        #     "vdb_entities.json",
        #     "vdb_relationships.json",
        # ]

        # for file in files_to_delete:
        #     file_path = os.path.join(WORKING_DIR, file)
        #     if os.path.exists(file_path):
        #         os.remove(file_path)
        #         print(f"Deleting old file:: {file_path}")

        # Initialize RAG instance
        rag = await initialize_rag()

        # Test embedding function
        # test_text = ["This is a test string for embedding."]
        # embedding = await rag.embedding_func(test_text)
        # embedding_dim = embedding.shape[1]
        # print("\n=======================")
        # print("Test embedding function")
        # print("========================")
        # print(f"Test dict: {test_text}")
        # print(f"Detected embedding dimension: {embedding_dim}\n\n")

        # pickle_files = ["../mitre-api/relationships.txt", "../mitre-api/tactics.txt", "../mitre-api/techniques.txt"]
        # def chunk_text(text, chunk_size=200):
        #     """Split text into chunks of ~chunk_size words (or tokens)."""
        #     words = text.split()
        #     chunks = []
        #     for i in range(0, len(words), chunk_size):
        #         chunks.append(" ".join(words[i:i+chunk_size]))
        #     return chunks

        # Load pickle and split
        # for pkl_file in pickle_files:
        #     with open(pkl_file, "rb") as f:
        #         data = pickle.load(f)
        #         text = str(data)

        #         for chunk in chunk_text(text):
        #             await rag.ainsert(chunk)
        
        # for pkl_file in pickle_files:
        #     with open(pkl_file, "rb") as f:
        #         data = pickle.load(f)
        #         await rag.ainsert(str(data))

        # with open("../mitre-api/relationships.txt", "r", encoding="utf-8") as f:
        #     print("Inserting relationships...")
        #     await rag.ainsert(f.read())
        #     print("Inserted relationships.")

        # with open("../mitre-api/techniques.txt", "r", encoding="utf-8") as f:
        #     print("Inserting techniques...")
        #     await rag.ainsert(f.read())
        #     print("Inserted techniques.")
        
        # with open("../mitre-api/tactics.txt", "r", encoding="utf-8") as f:
        #     print("Inserting tactics...")
        #     await rag.ainsert(f.read())
        #     print("Inserted tactics.")

        # with open("./test.txt", "r", encoding="utf-8") as f:
        #     await rag.ainsert(f.read())

        # with open("test_data.pkl", "rb") as f:
        #     data = pickle.load(f)
        #     await rag.ainsert(str(data))

        # with open("../mitre-api/relationships.pkl", "rb") as f:
        #     data = pickle.load(f)
        #     await rag.ainsert(str(data))

        # Perform naive search
        # print("\n=====================")
        # print("Query mode: naive")
        # print("=====================")
        # resp = await rag.aquery(
        #         "How old is Alice?",
        #     param=QueryParam(mode="naive", stream=True),
        # )
        # if inspect.isasyncgen(resp):
        #     await print_stream(resp)
        # else:
        #     print(resp)

        # # Perform local search
        # print("\n=====================")
        # print("Query mode: local")
        # print("=====================")
        # resp = await rag.aquery(
        #         "How old is Alice?",
        #     param=QueryParam(mode="local", stream=True),
        # )
        # if inspect.isasyncgen(resp):
        #     await print_stream(resp)
        # else:
        #     print(resp)

        # # Perform global search
        # print("\n=====================")
        # print("Query mode: global")
        # print("=====================")
        # resp = await rag.aquery(
        #         "How old is Alice?",
        #     param=QueryParam(mode="global", stream=True),
        # )
        # if inspect.isasyncgen(resp):
        #     await print_stream(resp)
        # else:
        #     print(resp)

        # Perform hybrid search
        print("\n=====================")
        print(f"Query mode: {qmode}")
        print("=====================")
        resp = await rag.aquery(
                query,
            param=QueryParam(mode=qmode, 
                             stream=True,
                             user_prompt = "You are an expert in cybersecurity, assisting with threat detection through the MITRE ATT&CK framework. " \
                             "Give me specifc APTs, TTPs, techniques, tactics, and relationships you see in the logs. Be sure to include TTPs and ATPs in the report." \
                             "You are going to be recieving logs and you will derive what is going on through these logs. " \
                             "Please note any MITRE TTPs or APTs you see in the logs and any relationships between them. " \
                             "If you see any techniques, tactics, or relationships that are relevant to the query, please include them in your response. " \
                             "If you don't see any relevant information, please say so. Respond as if this was a SOC Report. Exclude your thought process, just respond with the report." \
                            #  "Please respond in a JSON Object using the EXACT following schema. Do not add any other variables:" \
                            #  "{" \
                            #  "Log_Name: ," \
                            #  "Severity: ," \
                            #  "APTs/TTPs" \
                            #  "Summary: ," \
                            #  "Recommendations: ," \
                            #  "Sources/References: ," \
                            #  "}",),
            )
        )
        if inspect.isasyncgen(resp):
            await print_stream(resp)
        else:
            print(resp)

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if rag:
            await rag.llm_response_cache.index_done_callback()
            await rag.finalize_storages()


if __name__ == "__main__":
    import argparse
    configure_logging()

    parser = argparse.ArgumentParser(description="Query LightRAG with text or a file input.")
    parser.add_argument("query", nargs="+", help="The text query or one or more file paths (if using -f).")
    parser.add_argument("-f", "--file", action="store_true", help="Treat the input as a file path instead of plain text.")
    parser.add_argument("-m", "--mode", default="hybrid", choices=["naive", "local", "global", "mix"],
                        help="Query mode for LightRAG (default: mix).")
    # parser.add_argument("-mo", "--misp_output", type=str, help="MISP output to be included in the query.")

    args = parser.parse_args()

    if args.query:
        if args.file:
            contents = []
            for file_path in args.query:
                if not os.path.exists(file_path):
                    print(f"Error: file '{file_path}' not found.")
                    exit(1)
                with open(file_path, "r", encoding="utf-8") as f:
                    contents.append(f.read())
            query_text = "\n".join(contents)
        else:
            query_text = " ".join(args.query)

        asyncio.run(query_rag(query_text, args.mode))
    else:
        print("Please provide a query or file path.")
    
    print("\nDone!")

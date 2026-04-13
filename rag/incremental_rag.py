"""
incremental_rag.py

Incrementally insert documents into LightRAG WITHOUT re-processing files
that have already been ingested.

A small manifest file (rag_data/ingested_manifest.json) tracks which files
have been inserted (by path + content hash). Only new or changed files are
sent to rag.ainsert().

Usage:
    python incremental_rag.py path/to/file1.txt path/to/file2.txt ...
    python incremental_rag.py --dir path/to/folder          # all .txt files in a dir
    python incremental_rag.py --force path/to/file.txt      # re-ingest even if seen

Environment variables (same as before, loaded from .env):
    LLM_MODEL, LLM_BINDING_HOST, EMBEDDING_MODEL, EMBEDDING_BINDING_HOST,
    EMBEDDING_DIM, MAX_EMBED_TOKENS, TIMEOUT, NEO4J_URI, NEO4J_USERNAME,
    NEO4J_PASSWORD, LOG_DIR, LOG_MAX_BYTES, LOG_BACKUP_COUNT, VERBOSE_DEBUG
"""

import asyncio
import argparse
import hashlib
import json
import logging
import logging.config
import os
from pathlib import Path

from dotenv import load_dotenv
from lightrag import LightRAG, QueryParam
from lightrag.llm.ollama import ollama_model_complete, ollama_embed
from lightrag.utils import EmbeddingFunc, logger, set_verbose_debug
from lightrag.kg.shared_storage import initialize_pipeline_status

# ── config ────────────────────────────────────────────────────────────────────

ROOT_ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=ROOT_ENV_PATH, override=True)

WORKING_DIR = os.path.join(os.path.dirname(__file__), "rag_data")
MANIFEST_PATH = os.path.join(WORKING_DIR, "ingested_manifest.json")

os.makedirs(WORKING_DIR, exist_ok=True)


# ── manifest helpers ──────────────────────────────────────────────────────────

def load_manifest() -> dict:
    """
    Returns a dict mapping absolute file path -> sha256 hex digest of its
    contents at the time it was last successfully ingested.
    """
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_manifest(manifest: dict) -> None:
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)


def file_hash(path: str) -> str:
    """SHA-256 of the file's contents."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def files_needing_ingest(paths: list[str], manifest: dict, force: bool) -> list[str]:
    """
    Return only the files that are new or whose content has changed since the
    last successful ingest. If force=True, return all paths unconditionally.
    """
    if force:
        return paths

    pending = []
    for p in paths:
    	abs_p = os.path.abspath(p)
    	current_hash = file_hash(abs_p)
    	if manifest.get(abs_p) != current_hash:
    		pending.append(abs_p)
    	else:
    		print(f"  [skip] already ingested: {abs_p}")
    return pending


# ── logging ───────────────────────────────────────────────────────────────────

def configure_logging() -> None:
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error", "lightrag"]:
        inst = logging.getLogger(logger_name)
        inst.handlers = []
        inst.filters = []

    log_dir = os.getenv("LOG_DIR", os.getcwd())
    log_file_path = os.path.abspath(os.path.join(log_dir, "incremental_rag.log"))
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {"format": "%(levelname)s: %(message)s"},
                "detailed": {"format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"},
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
                    "maxBytes": int(os.getenv("LOG_MAX_BYTES", 10485760)),
                    "backupCount": int(os.getenv("LOG_BACKUP_COUNT", 5)),
                    "encoding": "utf-8",
                },
            },
            "loggers": {
                "lightrag": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
            },
        }
    )

    logger.setLevel(logging.INFO)
    set_verbose_debug(os.getenv("VERBOSE_DEBUG", "false").lower() == "true")


# ── LightRAG init ─────────────────────────────────────────────────────────────

async def initialize_rag() -> LightRAG:
    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=ollama_model_complete,
        llm_model_name=os.getenv("LLM_MODEL", "gemma3:latest"),
        graph_storage="Neo4JStorage",
        llm_model_kwargs={
            "host": os.getenv("LLM_BINDING_HOST", "http://localhost:11434"),
            "options": {"num_ctx": 65536},
            "timeout": int(os.getenv("TIMEOUT", "300")),
        },
        embedding_func=EmbeddingFunc(
            embedding_dim=int(os.getenv("EMBEDDING_DIM", "1024")),
            max_token_size=int(os.getenv("MAX_EMBED_TOKENS", "65536")),
            func=lambda texts: ollama_embed(
                texts,
                embed_model=os.getenv("EMBEDDING_MODEL", "mxbai-embed-large:latest"),
                host=os.getenv("EMBEDDING_BINDING_HOST", "http://localhost:11434"),
            ),
        ),
    )
    await rag.initialize_storages()
    await initialize_pipeline_status()
    return rag


# ── core ingest logic ─────────────────────────────────────────────────────────

async def ingest_files(file_paths: list[str], force: bool = False) -> None:
    """
    Insert each file in file_paths into LightRAG if it hasn't been ingested
    yet (or if force=True). Updates the manifest on success.
    """
    manifest = load_manifest()
    pending = files_needing_ingest(file_paths, manifest, force)

    if not pending:
        print("Nothing new to ingest. All files are up to date in the manifest.")
        return

    print(f"\n{len(pending)} file(s) to ingest (out of {len(file_paths)} provided).")

    rag = None
    try:
        rag = await initialize_rag()

        for abs_path in pending:
            print(f"\n  [ingest] {abs_path}")
            try:
                with open(abs_path, "r", encoding="utf-8") as f:
                    content = f.read()

                await rag.ainsert(content)

                # Only update manifest after a successful insert
                manifest[abs_path] = file_hash(abs_path)
                save_manifest(manifest)
                print(f"  [ok]     {abs_path}")

            except Exception as e:
                # Leave this file out of the manifest so it retries next run
                print(f"  [error]  {abs_path}: {type(e).__name__}: {e}")

    finally:
        if rag:
            await rag.llm_response_cache.index_done_callback()
            await rag.finalize_storages()


# ── CLI ───────────────────────────────────────────────────────────────────────

def collect_files(raw_paths: list[str], from_dir: str | None) -> list[str]:
    """Resolve all target files from CLI arguments."""
    files = []

    if from_dir:
        dir_path = Path(from_dir)
        if not dir_path.is_dir():
            raise ValueError(f"--dir path is not a directory: {from_dir}")
        files += [str(p.resolve()) for p in sorted(dir_path.glob("*.txt"))]

    for p in raw_paths:
        resolved = Path(p).resolve()
        if not resolved.exists():
            raise FileNotFoundError(f"File not found: {p}")
        files.append(str(resolved))

    return files


if __name__ == "__main__":
    configure_logging()

    parser = argparse.ArgumentParser(
        description="Incrementally ingest text files into LightRAG (skips already-ingested files)."
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="One or more .txt file paths to ingest.",
    )
    parser.add_argument(
        "--dir",
        metavar="DIRECTORY",
        help="Ingest all .txt files in this directory.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-ingest files even if they are already in the manifest.",
    )
    args = parser.parse_args()

    try:
        targets = collect_files(args.files, args.dir)
    except (ValueError, FileNotFoundError) as e:
        print(f"Error: {e}")
        exit(1)

    if not targets:
        print("No files specified. Use positional args or --dir.")
        exit(0)

    asyncio.run(ingest_files(targets, force=args.force))
    print("\nDone!")

"""
Populate Neo4j from vdb_entities.json and vdb_relationships.json
without re-running the LLM or embedding model.

Uses the Neo4j driver directly with the same Cypher that LightRAG
uses internally, bypassing upsert_node/upsert_edge entirely.
"""
import asyncio
import json
import os

from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env", override=False)

WORKING_DIR = "./rag_data"
NEO4J_URI      = os.getenv("NEO4J_URI",      "bolt://localhost:7687")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
WORKSPACE      = os.getenv("NEO4J_WORKSPACE", "base")   # LightRAG default label


# ── parsers ───────────────────────────────────────────────────────────────────

def parse_entity(record: dict) -> dict:
    """
    content format:
        line 0: entity_name
        line 1+: description sentences joined by <SEP>
    """
    lines = record["content"].split("\n", 1)
    description = lines[1].replace("<SEP>", " ").strip() if len(lines) > 1 else ""
    return {
        "entity_id":   record["entity_name"],
        "entity_type": "UNKNOWN",
        "description": description,
        "source_id":   record.get("source_id", ""),
        "file_path":   record.get("file_path", ""),
    }


def parse_relation(record: dict) -> dict:
    """
    content format:
        line 0: src_id <TAB> tgt_id
        line 1: keywords (comma-separated)
        line 2+: description sentences joined by <SEP>
    """
    lines = record["content"].split("\n", 2)
    keywords    = lines[1].strip() if len(lines) > 1 else ""
    description = lines[2].replace("<SEP>", " ").strip() if len(lines) > 2 else ""
    return {
        "src_id":      record["src_id"],
        "tgt_id":      record["tgt_id"],
        "keywords":    keywords,
        "description": description,
        "source_id":   record.get("source_id", ""),
        "file_path":   record.get("file_path", ""),
        "weight":      1.0,
    }


# ── neo4j writers ─────────────────────────────────────────────────────────────

async def upsert_nodes(session, nodes: list[dict], workspace: str):
    """
    Mirrors LightRAG's internal Cypher for node upsert:
        MERGE (n:base {entity_id: $entity_id})
        SET n += $properties
        SET n:`<workspace>`
    """
    query = (
        f"MERGE (n:{workspace} {{entity_id: $entity_id}}) "
        f"SET n += $properties "
        f"SET n:`{workspace}`"
    )
    ok, failed = 0, 0
    for node in nodes:
        try:
            await session.run(
                query,
                entity_id=node["entity_id"],
                properties=node,
            )
            ok += 1
        except Exception as e:
            print(f"  WARN node '{node['entity_id']}': {type(e).__name__}: {e}")
            failed += 1
    return ok, failed


async def upsert_edges(session, edges: list[dict], workspace: str):
    """
    Mirrors LightRAG's internal Cypher for edge upsert:
        MATCH (source:base {entity_id: $source_entity_id})
        MATCH (target:base {entity_id: $target_entity_id})
        MERGE (source)-[r:DIRECTED]-(target)
        SET r += $properties
    """
    query = (
        f"MATCH (source:{workspace} {{entity_id: $src_id}}) "
        f"MATCH (target:{workspace} {{entity_id: $tgt_id}}) "
        f"MERGE (source)-[r:DIRECTED]-(target) "
        f"SET r += $properties"
    )
    ok, failed = 0, 0
    for edge in edges:
        try:
            await session.run(
                query,
                src_id=edge["src_id"],
                tgt_id=edge["tgt_id"],
                properties=edge,
            )
            ok += 1
        except Exception as e:
            print(f"  WARN edge '{edge['src_id']}' -> '{edge['tgt_id']}': {type(e).__name__}: {e}")
            failed += 1
    return ok, failed


# ── main ──────────────────────────────────────────────────────────────────────

async def main():
    # Load JSON files
    with open(os.path.join(WORKING_DIR, "vdb_entities.json"), encoding="utf-8") as f:
        raw_entities = json.load(f)["data"]

    with open(os.path.join(WORKING_DIR, "vdb_relationships.json"), encoding="utf-8") as f:
        raw_relations = json.load(f)["data"]

    entities = [parse_entity(r) for r in raw_entities]
    relations = [parse_relation(r) for r in raw_relations]

    print(f"Loaded {len(entities)} entities and {len(relations)} relationships.")
    print(f"Connecting to Neo4j at {NEO4J_URI} (workspace: '{WORKSPACE}')...")

    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

    async with driver.session() as session:
        print(f"\nUpserting {len(entities)} nodes...")
        ok, failed = await upsert_nodes(session, entities, WORKSPACE)
        print(f"  Nodes done — {ok} ok, {failed} failed.")

        print(f"\nUpserting {len(relations)} edges...")
        ok, failed = await upsert_edges(session, relations, WORKSPACE)
        print(f"  Edges done — {ok} ok, {failed} failed.")

    await driver.close()
    print("\nNeo4j population complete.")


if __name__ == "__main__":
    asyncio.run(main())
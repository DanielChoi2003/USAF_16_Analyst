import json
import os
import sys
import urllib.request

from dotenv import load_dotenv

ROOT_ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=ROOT_ENV_PATH, override=True)

OLLAMA_HOST = os.getenv("LLM_HOST", "http://localhost:11434").rstrip("/")
LLM_MODEL = os.getenv("LLM_MODEL", "gemma3:latest")


def build_prompt(payload: dict, reason: str) -> str:
    workflow = payload.get("workflow", {})
    original_input = payload.get("original_input", {})
    elasticsearch_events = payload.get("elasticsearch_events", [])
    misp_output = payload.get("misp_output")
    used_elasticsearch = len(elasticsearch_events) > 0

    source_instruction = (
        "State that the report was generated from normalized Elasticsearch/Logstash events plus the uploaded JSON."
        if used_elasticsearch
        else "State that Elasticsearch/Logstash context was unavailable and the report was generated from the uploaded JSON only."
    )

    return (
        "You are a cybersecurity analyst writing a SOC incident report.\n"
        "Always provide a concrete report from the JSON input, even if retrieval context is missing.\n"
        f"{source_instruction}\n"
        "Do not contradict the provided source information.\n"
        "Write clearly for an analyst who needs to make the next decision quickly.\n"
        "Be concise, evidence-driven, and avoid generic filler.\n"
        "Use exactly these section headers and this order:\n"
        "Summary\n"
        "Key Findings\n"
        "MITRE ATT&CK Assessment\n"
        "Recommended Actions\n\n"
        "Formatting rules:\n"
        "- Summary: 2 to 4 sentences.\n"
        "- Key Findings: 3 to 6 bullet points focused on observed evidence, affected hosts/users, suspicious behavior, and confidence caveats.\n"
        "- MITRE ATT&CK Assessment: 2 to 5 bullet points naming likely tactics/techniques only when supported by the data; say when confidence is low.\n"
        "- Recommended Actions: 3 to 6 bullet points. Start each bullet with one priority tag: [Immediate], [Next], or [Monitor]. Make each action specific and operational.\n"
        "- If MISP or Elasticsearch context is missing, mention that briefly instead of inventing detail.\n"
        "- Do not output JSON, markdown tables, or extra sections.\n\n"
        f"Fallback reason: {reason}\n"
        f"Workflow metadata: {json.dumps(workflow, indent=2)}\n"
        f"Elasticsearch event count: {len(elasticsearch_events)}\n"
        f"MISP output present: {'yes' if misp_output else 'no'}\n\n"
        "Uploaded package JSON:\n"
        f"{json.dumps(original_input, indent=2)}\n\n"
        "Elasticsearch events (if any):\n"
        f"{json.dumps(elasticsearch_events, indent=2)}\n\n"
        "MISP output (if any):\n"
        f"{json.dumps(misp_output, indent=2)}"
    )


def generate(prompt: str) -> str:
    body = json.dumps(
        {
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.2, "num_ctx": 32768},
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        f"{OLLAMA_HOST}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=int(os.getenv("TIMEOUT", "300"))) as response:
        payload = json.loads(response.read().decode("utf-8"))
        return payload.get("response", "").strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: fallback_report.py <context_file> [reason]", file=sys.stderr)
        sys.exit(1)

    context_file = sys.argv[1]
    reason = sys.argv[2] if len(sys.argv) > 2 else "Primary retrieval path did not produce usable context."

    with open(context_file, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    print(generate(build_prompt(payload, reason)))


if __name__ == "__main__":
    main()

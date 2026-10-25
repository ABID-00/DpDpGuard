import json
import os
import platform

import requests


CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "config.json"
)


def load_config():
    with open(CONFIG_PATH, "r") as file:
        return json.load(file)


def build_payload(evidence):
    # Only these sections leave the PC. The collector's other sections
    # (personal_data, access_control, retention, readiness) stay local.
    return {
        "machine": evidence.get("machine", {}),
        "securityChecks": evidence.get("security", {}),
        "collectedAt": evidence.get("collectedAt"),
    }


def send_evidence(evidence):
    config = load_config()

    if not config.get("apiKey"):
        raise RuntimeError(
            "No apiKey in config.json. Run register_agent.py first."
        )

    url = config["backendUrl"].rstrip("/") + "/api/agents/evidence"

    headers = {
        "x-api-key": config["apiKey"],
        "Content-Type": "application/json",
    }

    payload = {
        "agentId": config["agentId"],
        "os": platform.system(),
        "osVersion": platform.version(),
        "evidence": build_payload(evidence),
    }

    response = requests.post(url, json=payload, headers=headers, timeout=10)
    response.raise_for_status()

    return response.json()
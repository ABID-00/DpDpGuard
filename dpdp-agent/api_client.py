import requests
import json
import os


def load_config():
    config_path = os.path.join(
        os.path.dirname(__file__),
        "config.json"
    )

    with open(config_path, "r") as file:
        return json.load(file)


def send_evidence(evidence):

    config = load_config()

    backend_url = config["backendUrl"]
    agent_id = config["agentId"]
    agent_token = config["agentToken"]

    url = backend_url + "/api/agents/evidence"

    headers = {
        "Authorization": f"Bearer {agent_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "agentId": agent_id,
        "agentVersion": config["agentVersion"],
        "evidence": evidence
    }

    try:

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        print("Evidence sent successfully.")

        return response.json()

    except requests.exceptions.RequestException as error:

        print("Failed to send evidence:")
        print(error)

        return None
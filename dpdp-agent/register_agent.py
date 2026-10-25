import json
import os
import platform
import socket
import sys

import requests


CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "config.json"
)


def main():
    registration_key = input("Registration key from your organization: ").strip()

    with open(CONFIG_PATH, "r") as file:
        config = json.load(file)

    payload = {
        "agentId": config["agentId"],
        "hostname": socket.gethostname(),
        "registrationKey": registration_key,
        "os": platform.system(),
        "osVersion": platform.version()
    }

    response = requests.post(
        config["backendUrl"].rstrip("/") + "/api/agents/register",
        json=payload,
        timeout=10
    )

    if response.status_code != 201:
        print("Registration failed:", response.status_code, response.text)
        sys.exit(1)

    config["apiKey"] = response.json()["data"]["apiKey"]

    with open(CONFIG_PATH, "w") as file:
        json.dump(config, file, indent=4)

    print("Registered. API key saved to config.json.")


if __name__ == "__main__":
    main()
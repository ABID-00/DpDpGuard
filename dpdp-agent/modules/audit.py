import json
import os
from datetime import datetime, timezone

def log_event(event_type, severity, details, config):
    if not config.get("dpdp", {}).get("audit", {}).get("enabled", False):
        return

    log_path = config["dpdp"]["audit"].get("log_path", "logs/audit.jsonl")
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    
    event = {
        "event_id": f"EVT-{int(datetime.now().timestamp())}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "severity": severity,
        "details": details
    }
    
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")
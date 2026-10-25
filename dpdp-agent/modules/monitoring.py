import os
import psutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from modules.audit import log_event

class DataMovementHandler(FileSystemEventHandler):
    def __init__(self, config):
        self.config = config

    def get_drive_type(self, path):
        drive = os.path.splitdrive(path)[0]
        for p in psutil.disk_partitions(all=False):
            if p.device.startswith(drive) and "removable" in p.opts.lower():
                return "USB"
        return "LOCAL"

    def on_moved(self, event):
        dest_type = self.get_drive_type(event.dest_path)
        risk = "HIGH" if dest_type == "USB" else "LOW"
        
        details = {
            "event_type": "PERSONAL_DATA_TRANSFER",
            "source": event.src_path,
            "destination": event.dest_path,
            "destination_type": dest_type,
            "risk": risk
        }
        log_event("FILE_MOVE", risk, details, self.config)

def start_monitoring(config):
    if not config["dpdp"]["monitoring"]["enabled"]:
        return None
        
    observer = Observer()
    handler = DataMovementHandler(config)
    for path in config["dpdp"]["discovery"]["paths"]:
        if os.path.exists(path):
            observer.schedule(handler, path, recursive=True)
    observer.start()
    return observer
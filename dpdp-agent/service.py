import win32serviceutil
import win32service
import win32event
import servicemanager

import time
import json
import os

from collector import collect_evidence
from api_client import send_evidence, load_config

# Import the new monitoring module gracefully
try:
    from modules.monitoring import start_monitoring
except ImportError:
    start_monitoring = None


class DPDPGuardAgent(win32serviceutil.ServiceFramework):

    _svc_name_ = "DPDPGuardAgent"
    _svc_display_name_ = "DPDPGuard Assurance Agent"
    _svc_description_ = (
        "Collects technical DPDP assurance evidence "
        "from organization-controlled systems."
    )

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.running = True

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        self.running = False
        win32event.SetEvent(self.stop_event)
        servicemanager.LogInfoMsg("DPDPGuard Agent stopping...")

    def SvcDoRun(self):
        servicemanager.LogInfoMsg("DPDPGuard Agent started.")
        self.main()

    def get_interval(self):
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        try:
            with open(config_path, "r") as file:
                config = json.load(file)
            return config.get("collectionIntervalSeconds", 300)
        except Exception:
            return 300

    def main(self):
        # Load unified configuration[cite: 4]
        try:
            config = load_config()
        except Exception as e:
            servicemanager.LogErrorMsg(f"Failed to load config: {str(e)}")
            config = {}

        interval = self.get_interval()
        observer = None

        # Start real-time file system monitoring if the module exists and is enabled
        if start_monitoring:
            try:
                observer = start_monitoring(config)
                if observer:
                    servicemanager.LogInfoMsg("DPDP File System Monitoring started.")
            except Exception as e:
                servicemanager.LogErrorMsg(f"Monitoring start error: {str(e)}")

        while self.running:
            try:
                servicemanager.LogInfoMsg("Collecting DPDP evidence...")

                # Pass config to collector to integrate DPDP discovery
                evidence = collect_evidence(config)

                send_evidence(evidence)
                servicemanager.LogInfoMsg("Evidence collection completed.")

            except Exception as error:
                servicemanager.LogErrorMsg(f"Agent error: {str(error)}")

            # Wait before next collection
            result = win32event.WaitForSingleObject(
                self.stop_event,
                interval * 1000
            )

            if result == win32event.WAIT_OBJECT_0:
                break

        # Cleanup monitoring thread on service stop
        if observer:
            observer.stop()
            observer.join()


if __name__ == "__main__":
    win32serviceutil.HandleCommandLine(DPDPGuardAgent)
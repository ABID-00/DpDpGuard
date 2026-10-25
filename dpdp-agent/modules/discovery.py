import os
import re
import time
import win32security
from modules.audit import log_event

# Detection patterns
PATTERNS = {
    "Email": r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
    "PAN": r'[A-Z]{5}[0-9]{4}[A-Z]{1}',
    "Phone_IN": r'(?:\+91|91)?[789]\d{9}',
    "Aadhaar_Like": r'\b\d{4}\s?\d{4}\s?\d{4}\b' 
}

SENSITIVE_NAMES = ["employee", "salary", "aadhaar", "pan", "passport", "payroll"]

def check_access_control(filepath):
    """Basic check for excessive permissions using win32security."""
    excessive = False
    try:
        sd = win32security.GetFileSecurity(filepath, win32security.DACL_SECURITY_INFORMATION)
        dacl = sd.GetSecurityDescriptorDacl()
        if dacl:
            for i in range(dacl.GetAceCount()):
                ace = dacl.GetAce(i)
                sid = ace[2]
                account, domain, _ = win32security.LookupAccountSid(None, sid)
                if account.lower() in ["everyone", "users", "guest"]:
                    excessive = True
    except Exception:
        pass
    return excessive

def scan_file(filepath, config):
    try:
        stat = os.stat(filepath)
        size_mb = stat.st_size / (1024 * 1024)
        if size_mb > config["dpdp"]["discovery"].get("max_file_size_mb", 10):
            return None # Skip large files

        filename = os.path.basename(filepath).lower()
        categories = []
        classifications = []

        # 1. Filename Classification
        if any(keyword in filename for keyword in SENSITIVE_NAMES):
            categories.append("Filename Match")
            classifications.append("General Personal Data")

        # 2. Content Discovery (Text files only for MVP)
        if filepath.endswith(('.txt', '.csv', '.json', '.md')):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for cat, pattern in PATTERNS.items():
                    if re.search(pattern, content):
                        categories.append(cat)
                        classifications.append("Identity Data" if cat in ["PAN", "Aadhaar_Like"] else "Contact Data")

        if not categories:
            return None

        # 3. Access Control Check
        excessive_access = check_access_control(filepath)
        access_finding = "EXCESSIVE_ACCESS" if excessive_access else "OK"

        # 4. Retention Check
        age_years = (time.time() - stat.st_ctime) / (365 * 24 * 3600)
        retention_finding = "RETENTION_REVIEW_REQUIRED" if age_years > config["dpdp"].get("retention_years", 5) else "OK"

        return {
            "file": os.path.basename(filepath),
            "path": filepath,
            "categories": list(set(categories)),
            "classifications": list(set(classifications)),
            "size": stat.st_size,
            "access_finding": access_finding,
            "retention_finding": retention_finding,
            "created_at": stat.st_ctime
        }
    except Exception:
        return None

def run_discovery(config):
    assets = []
    paths = config["dpdp"]["discovery"].get("paths", [])
    excluded = config["dpdp"]["discovery"].get("excluded_paths", [])

    for base_path in paths:
        for root, dirs, files in os.walk(base_path):
            if any(root.startswith(exc) for exc in excluded):
                continue
            for file in files:
                filepath = os.path.join(root, file)
                result = scan_file(filepath, config)
                if result:
                    assets.append(result)
                    log_event("DISCOVERY", "LOW", {"file": result["file"], "path": result["path"]}, config)
    return assets
import socket
import platform
import psutil
import subprocess
import json
from datetime import datetime, timezone


# ============================================================
# Helper: Run PowerShell
# ============================================================

def run_powershell(command):
    try:
        result = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                command
            ],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return None

        output = result.stdout.strip()

        return output if output else None

    except Exception:
        return None


# ============================================================
# Helper: Safe JSON
# ============================================================

def parse_json(output):
    if not output:
        return None

    try:
        return json.loads(output)
    except Exception:
        return None


# ============================================================
# 1. BitLocker
# ============================================================

def check_bitlocker():

    command = r"""
    Get-BitLockerVolume |
    Select-Object MountPoint,
                  VolumeStatus,
                  ProtectionStatus,
                  EncryptionMethod,
                  EncryptionPercentage |
    ConvertTo-Json -Compress
    """

    output = run_powershell(command)
    data = parse_json(output)

    if data is None:
        return {
            "status": "Unknown",
            "encrypted": None,
            "volumes": [],
            "message": "Unable to query BitLocker"
        }

    if isinstance(data, dict):
        data = [data]

    volumes = []

    # Only evaluate fixed disks that actually exist.
    fixed_drives = []

    try:
        for partition in psutil.disk_partitions(all=False):
            if "fixed" in partition.opts.lower() or partition.device:
                drive = partition.device.rstrip("\\")
                if drive:
                    fixed_drives.append(drive.upper())
    except Exception:
        pass

    for volume in data:

        mount_point = str(
            volume.get("MountPoint") or ""
        ).upper()

        volume_status = str(
            volume.get("VolumeStatus") or ""
        )

        protection_status = str(
            volume.get("ProtectionStatus") or ""
        )

        encryption_method = volume.get(
            "EncryptionMethod"
        )

        encryption_percentage = volume.get(
            "EncryptionPercentage"
        )

        # Normal PowerShell values:
        # VolumeStatus      = FullyEncrypted
        # ProtectionStatus  = On
        #
        # Some Windows versions / APIs may return
        # numeric values. Do NOT blindly treat numeric 0
        # as encrypted.

        volume_status_normalized = volume_status.lower()
        protection_status_normalized = protection_status.lower()

        fully_encrypted = (
            volume_status_normalized == "fullyencrypted"
            or volume_status_normalized == "fully encrypted"
        )

        protection_on = (
            protection_status_normalized == "on"
            or protection_status_normalized == "1"
        )

        encrypted = (
            fully_encrypted
            and protection_on
        )

        volumes.append({
            "mountPoint": mount_point,
            "volumeStatus": volume_status,
            "protectionStatus": protection_status,
            "encryptionMethod": encryption_method,
            "encryptionPercentage": encryption_percentage,
            "encrypted": encrypted
        })

    if not volumes:
        return {
            "status": "Unknown",
            "encrypted": None,
            "volumes": [],
            "message": "No BitLocker volumes detected"
        }

    all_encrypted = all(
        volume["encrypted"]
        for volume in volumes
    )

    return {
        "status": (
            "Enabled"
            if all_encrypted
            else "Needs Review"
        ),
        "encrypted": all_encrypted,
        "volumes": volumes
    }


# ============================================================
# 2. Windows Firewall
# ============================================================

def check_firewall():

    command = r"""
    Get-NetFirewallProfile |
    Select-Object Name,
                  Enabled,
                  DefaultInboundAction,
                  DefaultOutboundAction |
    ConvertTo-Json -Compress
    """

    output = run_powershell(command)
    data = parse_json(output)

    if data is None:
        return {
            "status": "Unknown",
            "enabled": None,
            "profiles": [],
            "message": "Unable to query Windows Firewall"
        }

    if isinstance(data, dict):
        data = [data]

    profiles = []

    for profile in data:

        enabled = bool(
            profile.get("Enabled", False)
        )

        profiles.append({
            "name": profile.get("Name"),
            "enabled": enabled,
            "defaultInboundAction":
                profile.get("DefaultInboundAction"),
            "defaultOutboundAction":
                profile.get("DefaultOutboundAction")
        })

    if not profiles:
        return {
            "status": "Unknown",
            "enabled": None,
            "profiles": [],
            "message": "No firewall profiles detected"
        }

    firewall_enabled = all(
        profile["enabled"]
        for profile in profiles
    )

    return {
        "status": (
            "Enabled"
            if firewall_enabled
            else "Needs Review"
        ),
        "enabled": firewall_enabled,
        "profiles": profiles
    }


# ============================================================
# 3. Antivirus / Microsoft Defender
# ============================================================

def check_defender():

    # --------------------------------------------------------
    # Registered antivirus products
    # --------------------------------------------------------

    antivirus_command = r"""
    Get-CimInstance -Namespace root/SecurityCenter2 `
        -ClassName AntiVirusProduct |
    Select-Object displayName,
                  productState,
                  pathToSignedProductExe |
    ConvertTo-Json -Compress
    """

    antivirus_output = run_powershell(
        antivirus_command
    )

    antivirus_products = []

    antivirus_data = parse_json(
        antivirus_output
    )

    if antivirus_data:

        if isinstance(antivirus_data, dict):
            antivirus_data = [antivirus_data]

        for product in antivirus_data:

            name = product.get(
                "displayName"
            )

            antivirus_products.append({
                "name": name,
                "productState": product.get(
                    "productState"
                ),
                "path": product.get(
                    "pathToSignedProductExe"
                )
            })

    # --------------------------------------------------------
    # Microsoft Defender status
    # --------------------------------------------------------

    defender_command = r"""
    try {
        Get-MpComputerStatus |
        Select-Object AntivirusEnabled,
                      RealTimeProtectionEnabled,
                      AntispywareEnabled,
                      BehaviorMonitorEnabled,
                      IoavProtectionEnabled,
                      NISEnabled,
                      QuickScanAge,
                      FullScanAge |
        ConvertTo-Json -Compress
    }
    catch {
        Write-Output "DEFENDER_UNAVAILABLE"
    }
    """

    defender_output = run_powershell(
        defender_command
    )

    defender_data = None

    if (
        defender_output
        and
        defender_output != "DEFENDER_UNAVAILABLE"
    ):
        defender_data = parse_json(
            defender_output
        )

    # --------------------------------------------------------
    # Microsoft Defender state
    # --------------------------------------------------------

    defender_antivirus_enabled = False
    defender_realtime_enabled = False
    defender_antispyware_enabled = False

    if defender_data:

        defender_antivirus_enabled = bool(
            defender_data.get(
                "AntivirusEnabled",
                False
            )
        )

        defender_realtime_enabled = bool(
            defender_data.get(
                "RealTimeProtectionEnabled",
                False
            )
        )

        defender_antispyware_enabled = bool(
            defender_data.get(
                "AntispywareEnabled",
                False
            )
        )

    defender_active = (
        defender_antivirus_enabled
        and
        defender_realtime_enabled
        and
        defender_antispyware_enabled
    )

    # --------------------------------------------------------
    # Detect third-party antivirus
    # --------------------------------------------------------

    third_party_products = []

    for product in antivirus_products:

        name = str(
            product.get("name") or ""
        ).lower()

        if not name:
            continue

        microsoft_product = (
            "microsoft defender" in name
            or
            "windows defender" in name
        )

        if not microsoft_product:
            third_party_products.append(
                product
            )

    third_party_detected = (
        len(third_party_products) > 0
    )

    # --------------------------------------------------------
    # Determine overall protection
    # --------------------------------------------------------

    if defender_active:

        status = "Microsoft Defender Active"

        protection_available = True

    elif third_party_detected:

        status = "Third-Party Antivirus Detected"

        protection_available = True

    elif defender_data is None:

        status = "Unknown"

        protection_available = None

    else:

        status = "No Active Antivirus Detected"

        protection_available = False

    return {

        "status": status,

        "protectionAvailable":
            protection_available,

        "microsoftDefender": {

            "available":
                defender_data is not None,

            "antivirusEnabled":
                (
                    defender_antivirus_enabled
                    if defender_data
                    else None
                ),

            "realTimeProtectionEnabled":
                (
                    defender_realtime_enabled
                    if defender_data
                    else None
                ),

            "antispywareEnabled":
                (
                    defender_antispyware_enabled
                    if defender_data
                    else None
                ),

            "behaviorMonitorEnabled":
                (
                    bool(
                        defender_data.get(
                            "BehaviorMonitorEnabled",
                            False
                        )
                    )
                    if defender_data
                    else None
                ),

            "networkInspectionEnabled":
                (
                    bool(
                        defender_data.get(
                            "NISEnabled",
                            False
                        )
                    )
                    if defender_data
                    else None
                ),

            "quickScanAge":
                (
                    defender_data.get(
                        "QuickScanAge"
                    )
                    if defender_data
                    else None
                ),

            "fullScanAge":
                (
                    defender_data.get(
                        "FullScanAge"
                    )
                    if defender_data
                    else None
                )
        },

        "antivirusProducts":
            antivirus_products,

        "thirdPartyAntivirusDetected":
            third_party_detected,

        "thirdPartyProducts":
            third_party_products
    }


# ============================================================
# 4. Windows Update
# ============================================================

def check_windows_update():

    # --------------------------------------------------------
    # Windows Update service
    # --------------------------------------------------------

    service_command = r"""
    Get-Service -Name wuauserv |
    Select-Object Status,StartType |
    ConvertTo-Json -Compress
    """

    service_output = run_powershell(
        service_command
    )

    service_data = parse_json(
        service_output
    )

    service_running = False

    if service_data:

        service_running = (
            str(
                service_data.get(
                    "Status",
                    ""
                )
            ).lower()
            == "running"
        )

    if service_data is None:

        service_status = "Unknown"

    elif service_running:

        service_status = "Running"

    else:

        service_status = "Stopped"

    # --------------------------------------------------------
    # Latest installed hotfix
    # --------------------------------------------------------

    update_command = r"""
    Get-HotFix |
    Where-Object {
        $_.InstalledOn -ne $null
    } |
    Sort-Object InstalledOn -Descending |
    Select-Object -First 1 `
        HotFixID,
        InstalledOn,
        Description |
    ConvertTo-Json -Compress
    """

    update_output = run_powershell(
        update_command
    )

    latest_update = parse_json(
        update_output
    )

    return {

        # This is service state only.
        # It is NOT the overall patch status.
        "status": service_status,

        "service": {

            "running":
                service_running,

            "status":
                (
                    service_data.get("Status")
                    if service_data
                    else None
                ),

            "startType":
                (
                    service_data.get("StartType")
                    if service_data
                    else None
                )
        },

        "latestInstalledUpdate":
            latest_update,

        "patchEvidenceAvailable":
            latest_update is not None
    }


# ============================================================
# 5. Password Policy
# ============================================================

def check_password_policy():

    command = r"""
    net accounts
    """

    output = run_powershell(command)

    if not output:

        return {
            "status": "Unknown",
            "message": "Unable to query password policy"
        }

    policy = {}

    for line in output.splitlines():

        line = line.strip()

        if ":" not in line:
            continue

        key, value = line.split(
            ":",
            1
        )

        policy[key.strip()] = value.strip()

    minimum_password_length = None
    maximum_password_age = None
    minimum_password_age = None
    lockout_threshold = None
    lockout_duration = None
    lockout_observation_window = None

    for key, value in policy.items():

        key_lower = key.lower()

        if (
            "minimum password length"
            in key_lower
        ):
            minimum_password_length = value

        elif (
            "maximum password age"
            in key_lower
        ):
            maximum_password_age = value

        elif (
            "minimum password age"
            in key_lower
        ):
            minimum_password_age = value

        elif (
            "lockout threshold"
            in key_lower
        ):
            lockout_threshold = value

        elif (
            "lockout duration"
            in key_lower
        ):
            lockout_duration = value

        elif (
            "lockout observation window"
            in key_lower
        ):
            lockout_observation_window = value

    return {

        "status": "Collected",

        "minimumPasswordLength":
            minimum_password_length,

        "maximumPasswordAge":
            maximum_password_age,

        "minimumPasswordAge":
            minimum_password_age,

        "accountLockoutThreshold":
            lockout_threshold,

        "lockoutDuration":
            lockout_duration,

        "lockoutObservationWindow":
            lockout_observation_window,

        "rawPolicy":
            policy
    }


# ============================================================
# 6. Screen Lock
# ============================================================

def check_screen_lock():

    # --------------------------------------------------------
    # Get interactive user
    # --------------------------------------------------------

    user_command = r"""
    (Get-CimInstance Win32_ComputerSystem).UserName
    """

    username = run_powershell(
        user_command
    )

    if not username:

        return {
            "status": "Unknown",
            "message":
                "No interactive user currently logged in"
        }

    username = username.strip()

    # --------------------------------------------------------
    # Get SID directly from the account name
    # --------------------------------------------------------

    sid_command = r"""
    $username = (Get-CimInstance Win32_ComputerSystem).UserName

    try {
        $account = New-Object System.Security.Principal.NTAccount($username)

        $sid = $account.Translate(
            [System.Security.Principal.SecurityIdentifier]
        ).Value

        Write-Output $sid
    }
    catch {
        Write-Output "SID_LOOKUP_FAILED"
    }
    """

    sid_output = run_powershell(
        sid_command
    )

    if (
        not sid_output
        or
        sid_output == "SID_LOOKUP_FAILED"
    ):

        return {
            "status": "Unknown",
            "username": username,
            "message":
                "Unable to determine user SID"
        }

    sid = sid_output.strip()

    # --------------------------------------------------------
    # Read registry
    # --------------------------------------------------------

    registry_command = f"""
    $path = 'Registry::HKEY_USERS\\{sid}\\Control Panel\\Desktop'

    if (Test-Path $path) {{

        $desktop = Get-ItemProperty $path

        [PSCustomObject]@{{

            ScreenSaverActive =
                $desktop.ScreenSaveActive

            ScreenSaverTimeout =
                $desktop.ScreenSaveTimeOut

            PasswordProtect =
                $desktop.ScreenSaverIsSecure

        }} |
        ConvertTo-Json -Compress

    }} else {{

        Write-Output "REGISTRY_NOT_FOUND"

    }}
    """

    output = run_powershell(
        registry_command
    )

    if (
        not output
        or
        output == "REGISTRY_NOT_FOUND"
    ):

        return {
            "status": "Unknown",
            "username": username,
            "message":
                "Unable to read user's screen-lock settings"
        }

    data = parse_json(output)

    if data is None:

        return {
            "status": "Unknown",
            "username": username,
            "message":
                "Invalid screen-lock data"
        }

    # --------------------------------------------------------
    # Normalize registry values
    # --------------------------------------------------------

    screen_saver_active = (
        str(
            data.get(
                "ScreenSaverActive",
                ""
            )
        ).strip()
        == "1"
    )

    password_protected = (
        str(
            data.get(
                "PasswordProtect",
                ""
            )
        ).strip()
        == "1"
    )

    timeout_raw = data.get(
        "ScreenSaverTimeout"
    )

    timeout_seconds = None

    try:

        timeout_seconds = int(
            timeout_raw
        )

    except (TypeError, ValueError):
        timeout_seconds = None

    screen_lock_enabled = (
        screen_saver_active
        and
        password_protected
        and
        timeout_seconds is not None
        and
        timeout_seconds > 0
    )

    return {

        "status": (
            "Enabled"
            if screen_lock_enabled
            else "Needs Review"
        ),

        "username":
            username,

        "screenSaverEnabled":
            screen_saver_active,

        "passwordProtected":
            password_protected,

        "timeoutSeconds":
            timeout_seconds,

        "timeoutMinutes":
            (
                round(
                    timeout_seconds / 60,
                    2
                )
                if timeout_seconds is not None
                else None
            )
    }


# ============================================================
# 7. Machine Information
# ============================================================

def collect_machine_info():

    try:
        disk = psutil.disk_usage("/")
    except Exception:
        disk = None

    return {

        "hostname":
            socket.gethostname(),

        "os":
            platform.system(),

        "osVersion":
            platform.version(),

        "machine":
            platform.machine(),

        "processor":
            platform.processor(),

        "cpuCount":
            psutil.cpu_count(),

        "memoryGB":
            round(
                psutil.virtual_memory().total
                / (1024 ** 3),
                2
            ),

        "diskTotalGB":
            (
                round(
                    disk.total / (1024 ** 3),
                    2
                )
                if disk
                else None
            ),

        "diskFreeGB":
            (
                round(
                    disk.free / (1024 ** 3),
                    2
                )
                if disk
                else None
            )
    }


# ============================================================
# 8. Main Evidence Collection
# ============================================================

def collect_evidence():

    return {

        "machine":
            collect_machine_info(),

        "securityChecks": {

            "bitlocker":
                check_bitlocker(),

            "firewall":
                check_firewall(),

            "windowsDefender":
                check_defender(),

            "windowsUpdate":
                check_windows_update(),

            "passwordPolicy":
                check_password_policy(),

            "screenLock":
                check_screen_lock()
        },

        "collectedAt":
            datetime.now(
                timezone.utc
            ).isoformat()
    }


# ============================================================
# Local Test
# ============================================================

if __name__ == "__main__":

    print(
        json.dumps(
            collect_evidence(),
            indent=4,
            default=str
        )
    )
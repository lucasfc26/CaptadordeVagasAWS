"""Camoufox no estilo TRAWL / Status Energy, com fingerprint americano."""

from __future__ import annotations

import os
import random
import signal
import subprocess
import time
from typing import Any

from camoufox.sync_api import Camoufox

_BROWSER_NAME_TOKENS = ("camoufox", "firefox", "gecko")
_EXTRACTOR_PATH_TOKENS = ("camoufox", "playwright", "browserforge")

_SCREEN_BOUNDS = {
    "min_width": 1280,
    "max_width": 2560,
    "min_height": 720,
    "max_height": 1440,
}

FINGERPRINT_POOL: tuple[dict[str, str], ...] = (
    {"os": "windows", "locale": "en-US", "timezone": "America/Los_Angeles"},
    {"os": "windows", "locale": "en-US", "timezone": "America/New_York"},
    {"os": "macos", "locale": "en-US", "timezone": "America/Chicago"},
    {"os": "linux", "locale": "en-US", "timezone": "America/Denver"},
)

TRAWL_FIREFOX_PREFS: dict[str, Any] = {
    "dom.ipc.processCount": 2,
    "dom.ipc.processPrelaunch": False,
    "dom.ipc.contentProcessCount": 2,
    "datareporting.healthreport.uploadEnabled": False,
    "datareporting.policy.dataSubmissionEnabled": False,
    "datareporting.policy.dataSubmissionURL": "",
    "toolkit.telemetry.enabled": False,
    "toolkit.telemetry.unified": False,
    "toolkit.telemetry.archive.enabled": False,
    "toolkit.telemetry.updatePing.enabled": False,
    "breakpad.reportURL": "",
    "browser.safebrowsing.downloads.enabled": False,
    "browser.safebrowsing.malware.enabled": False,
    "extensions.update.enabled": False,
    "browser.fixup.alternate.enabled": False,
    "app.normandy.enabled": False,
    "app.shield.optoutstudies.enabled": False,
    "network.connectivity-service.enabled": False,
    "network.captive-portal-service.enabled": False,
    "network.prefetch-next": False,
    "beacon.enabled": False,
    "security.OCSP.enabled": 0,
    "network.http.tls-handshake-timeout": 30,
    "network.http.connection-timeout": 60,
    "browser.sessionstore.max_tabs_undo": 0,
}

_TRAWL_INIT_SCRIPT = """
(() => {
  window.onerror = () => true;
  window.addEventListener('unhandledrejection', (e) => { e.preventDefault(); }, true);
  const _attachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const shadowRoot = _attachShadow.call(this, init);
    Object.defineProperty(this, 'shadowRootUnl', { configurable: true, value: shadowRoot });
    return shadowRoot;
  };
})();
"""


def pick_fingerprint() -> dict[str, str]:
    tz = os.environ.get("EXTRACTOR_TIMEZONE", "").strip()
    chosen = dict(random.choice(FINGERPRINT_POOL))
    if tz:
        chosen["timezone"] = tz
    return chosen


def _screen_constraint():
    try:
        from browserforge.fingerprints import Screen

        return Screen(**_SCREEN_BOUNDS)
    except Exception:
        return None


def camoufox_launch_kwargs(headless: bool, fingerprint: dict[str, str] | None = None) -> dict[str, Any]:
    fp = fingerprint or pick_fingerprint()
    kwargs: dict[str, Any] = {
        "headless": headless,
        "os": [fp["os"]],
        "window": (1920, 1080),
        "geoip": True,
        "humanize": True,
        "disable_coop": True,
        "block_webrtc": True,
        "i_know_what_im_doing": True,
        "main_world_eval": True,
        "locale": fp["locale"],
        "config": {"forceScopeAccess": True, "timezone": fp["timezone"]},
        "firefox_user_prefs": dict(TRAWL_FIREFOX_PREFS),
    }
    screen = _screen_constraint()
    if screen is not None:
        kwargs["screen"] = screen
    return kwargs


def open_camoufox(headless: bool) -> Camoufox:
    fp = pick_fingerprint()
    kwargs = camoufox_launch_kwargs(headless, fingerprint=fp)
    print(
        f"[camoufox] fingerprint os={fp['os']} locale={fp['locale']} tz={fp['timezone']} humanize=on",
        flush=True,
    )
    try:
        return Camoufox(**kwargs)
    except TypeError as exc:
        cleaned = dict(kwargs)
        for key in list(cleaned):
            if key in str(exc):
                cleaned.pop(key, None)
        return Camoufox(**cleaned)
    except Exception as exc:
        if kwargs.get("geoip") and any(token in str(exc).lower() for token in ("geoip", "maxmind", "geolocation", "mmdb")):
            kwargs["geoip"] = False
            return Camoufox(**kwargs)
        raise


def attach_trawl_init_script(page) -> None:
    try:
        page.context.add_init_script(_TRAWL_INIT_SCRIPT)
    except Exception:
        pass


def _process_blob(info: dict[str, Any]) -> str:
    return " ".join(
        [
            str(info.get("name") or ""),
            str(info.get("exe") or ""),
            " ".join(str(part) for part in (info.get("cmdline") or [])),
        ]
    ).lower()


def _is_extractor_browser(info: dict[str, Any]) -> bool:
    blob = _process_blob(info)
    if "camoufox" in blob:
        return True
    name = str(info.get("name") or "").lower()
    if any(token in name for token in ("firefox", "gecko")) and any(
        token in blob for token in _EXTRACTOR_PATH_TOKENS
    ):
        return True
    return False


def _windows_extractor_pids() -> set[int]:
    if os.name != "nt":
        return set()
    script = (
        "Get-CimInstance Win32_Process | Where-Object { "
        "$_.Name -match 'camoufox|nmhproxy' -or "
        "($_.ExecutablePath -and $_.ExecutablePath -match 'camoufox') "
        "} | Select-Object -ExpandProperty ProcessId"
    )
    completed = subprocess.run(
        ["powershell", "-NoProfile", "-Command", script],
        capture_output=True,
        text=True,
        check=False,
    )
    pids: set[int] = set()
    for line in (completed.stdout or "").splitlines():
        line = line.strip()
        if line.isdigit():
            pids.add(int(line))
    return pids


def snapshot_browser_pids() -> set[int]:
    pids: set[int] = set()
    try:
        import psutil
    except ImportError:
        psutil = None  # type: ignore
    if psutil is not None:
        for proc in psutil.process_iter(["pid", "name", "exe", "cmdline"]):
            try:
                if _is_extractor_browser(proc.info):
                    pids.add(int(proc.info["pid"]))
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    pids |= _windows_extractor_pids()
    return pids


def _taskkill(pid: int) -> None:
    if os.name != "nt":
        return
    subprocess.run(
        ["taskkill", "/F", "/T", "/PID", str(pid)],
        capture_output=True,
        check=False,
    )


def _kill_pid(pid: int) -> bool:
    try:
        import psutil
    except ImportError:
        _taskkill(pid)
        return True
    try:
        proc = psutil.Process(pid)
        for child in proc.children(recursive=True):
            try:
                if os.name == "nt":
                    _taskkill(child.pid)
                child.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        if os.name == "nt":
            _taskkill(pid)
        proc.kill()
        print(f"[camoufox] encerrei PID {pid}", flush=True)
        return True
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        try:
            _taskkill(pid)
            os.kill(pid, signal.SIGTERM)
            print(f"[camoufox] encerrei PID {pid}", flush=True)
            return True
        except OSError:
            return False


def kill_extractor_browsers() -> None:
    """Encerra todo Camoufox/Firefox do extrator, inclusive de rodadas anteriores."""
    current = os.getpid()
    leftovers = snapshot_browser_pids() - {current}
    if os.name == "nt":
        for image in ("camoufox.exe", "nmhproxy.exe"):
            subprocess.run(
                ["taskkill", "/F", "/IM", image, "/T"],
                capture_output=True,
                check=False,
            )
    killed = 0
    for pid in leftovers:
        if _kill_pid(pid):
            killed += 1
    try:
        import psutil
    except ImportError:
        time.sleep(0.6)
        return
    remaining = [psutil.Process(pid) for pid in leftovers if psutil.pid_exists(pid)]
    if remaining:
        _gone, alive = psutil.wait_procs(remaining, timeout=4)
        for proc in alive:
            _kill_pid(proc.pid)
    if killed or leftovers:
        print(f"[camoufox] limpei {len(leftovers)} processo(s) do navegador", flush=True)
    time.sleep(0.8)


def kill_new_browser_pids(_before: set[int] | None = None) -> None:
    kill_extractor_browsers()

from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "server"
CLIENT = ROOT / "client"
RESULTS = CLIENT / "test-results"
IS_WINDOWS = os.name == "nt"


def endpoint_ready(url: str, expected_service: str | None = None) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=1) as response:
            if response.status != 200:
                return False
            if expected_service is None:
                return True
            body = json.loads(response.read().decode("utf-8"))
            return body.get("service") == expected_service and body.get("status") == "UP"
    except (OSError, ValueError, urllib.error.URLError):
        return False


def wait_until_ready(
    url: str,
    process: subprocess.Popen[str],
    log_path: Path,
    timeout: int,
    expected_service: str | None = None,
) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if endpoint_ready(url, expected_service):
            return
        if process.poll() is not None:
            raise RuntimeError(
                f"服务提前退出（code={process.returncode}）：\n{log_path.read_text(encoding='utf-8', errors='replace')}"
            )
        time.sleep(0.5)
    raise TimeoutError(
        f"等待 {url} 超时：\n{log_path.read_text(encoding='utf-8', errors='replace')}"
    )


def start_process(command: list[str], cwd: Path, log_path: Path, env: dict[str, str] | None = None) -> subprocess.Popen[str]:
    log_handle = log_path.open("w", encoding="utf-8")
    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if IS_WINDOWS else 0
    return subprocess.Popen(
        command,
        cwd=cwd,
        env=env,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        text=True,
        shell=IS_WINDOWS,
        creationflags=creationflags,
        start_new_session=not IS_WINDOWS,
    )


def stop_process_tree(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return
    if IS_WINDOWS:
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            os.killpg(os.getpgid(process.pid), signal.SIGKILL)


def main() -> int:
    RESULTS.mkdir(parents=True, exist_ok=True)
    backend_log = RESULTS / "e2e-backend.log"
    frontend_log = RESULTS / "e2e-frontend.log"

    if endpoint_ready("http://127.0.0.1:3001/api/health") or endpoint_ready("http://127.0.0.1:3000/login"):
        print("端口 3000 或 3001 已被占用，请先停止现有开发服务。", file=sys.stderr)
        return 2

    if IS_WINDOWS:
        backend_command = [
            str(SERVER / "mvnw.cmd"),
            "test-compile",
            "-Dspring-boot.run.profiles=e2e",
            "spring-boot:test-run",
        ]
        frontend_command = ["npm.cmd", "run", "dev"]
        browser_command = ["npm.cmd", "run", "test:e2e:browser"]
    else:
        backend_command = [
            str(SERVER / "mvnw"),
            "test-compile",
            "-Dspring-boot.run.profiles=e2e",
            "spring-boot:test-run",
        ]
        frontend_command = ["npm", "run", "dev"]
        browser_command = ["npm", "run", "test:e2e:browser"]

    frontend_env = os.environ.copy()
    frontend_env["BACKEND_API_BASE_URL"] = "http://127.0.0.1:3001"

    processes: list[subprocess.Popen[str]] = []
    try:
        backend = start_process(backend_command, SERVER, backend_log)
        processes.append(backend)
        wait_until_ready(
            "http://127.0.0.1:3001/api/health",
            backend,
            backend_log,
            timeout=180,
            expected_service="asterflow-erp-server",
        )

        frontend = start_process(frontend_command, CLIENT, frontend_log, frontend_env)
        processes.append(frontend)
        wait_until_ready("http://127.0.0.1:3000/login", frontend, frontend_log, timeout=120)

        browser_env = os.environ.copy()
        browser_env["E2E_EXTERNAL_SERVERS"] = "1"
        completed = subprocess.run(browser_command, cwd=CLIENT, env=browser_env, check=False)
        return completed.returncode
    except (RuntimeError, TimeoutError) as exc:
        print(exc, file=sys.stderr)
        return 1
    finally:
        for process in reversed(processes):
            stop_process_tree(process)


if __name__ == "__main__":
    raise SystemExit(main())

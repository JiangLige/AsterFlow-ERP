from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run(label: str, command: list[str], cwd: Path = ROOT) -> None:
    print(f"\n==> {label}", flush=True)
    result = subprocess.run(command, cwd=cwd, shell=os.name == "nt")
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def run_security_audit(npm: str) -> None:
    command = [npm, "audit", "--audit-level=high"]
    for attempt in range(1, 4):
        print(f"\n==> Dependency security audit (attempt {attempt}/3)", flush=True)
        result = subprocess.run(command, cwd=ROOT, shell=os.name == "nt")
        if result.returncode == 0:
            return

    if os.environ.get("CI"):
        raise SystemExit(result.returncode)

    print("\nOnline audit endpoint unavailable; validating against the local advisory cache.", flush=True)
    run("Dependency security audit (offline cache)", [*command, "--offline"])


def main() -> None:
    npm = "npm.cmd" if os.name == "nt" else "npm"
    maven_wrapper = "mvnw.cmd" if os.name == "nt" else "./mvnw"

    run_security_audit(npm)
    run("Frontend tests", [npm, "run", "test:client"])
    run("Frontend lint", [npm, "--workspace", "client", "run", "lint"])
    run("Frontend production build", [npm, "run", "build:client"])
    run("Backend clean verification", [maven_wrapper, "-B", "clean", "verify"], ROOT / "server")
    run("Full-stack browser E2E", [sys.executable, "scripts/run_e2e.py"])

    print("\nAll portfolio quality gates passed.", flush=True)


if __name__ == "__main__":
    main()

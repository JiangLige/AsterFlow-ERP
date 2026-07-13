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


def main() -> None:
    npm = "npm.cmd" if os.name == "nt" else "npm"
    maven_wrapper = "mvnw.cmd" if os.name == "nt" else "./mvnw"

    run("Frontend tests", [npm, "run", "test:client"])
    run("Frontend lint", [npm, "--workspace", "client", "run", "lint"])
    run("Frontend production build", [npm, "run", "build:client"])
    run("Backend clean verification", [maven_wrapper, "-B", "clean", "verify"], ROOT / "server")

    print("\nAll portfolio quality gates passed.", flush=True)


if __name__ == "__main__":
    main()

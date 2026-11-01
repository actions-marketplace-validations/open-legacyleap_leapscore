#!/usr/bin/env python3
"""Capture the CLI report without exposing scan-machine metadata."""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: capture.py <report.html> <output.png>", file=sys.stderr)
        return 2

    report_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    repo_root = Path(__file__).resolve().parents[2]
    output_path.parent.mkdir(parents=True, exist_ok=True)

    launch: dict[str, object] = {
        "headless": True,
        "args": ["--disable-background-networking", "--no-first-run"],
    }
    chrome_bin = os.environ.get("CHROME_BIN") or next(
        (
            candidate
            for candidate in (
                shutil.which("chrome"),
                shutil.which("google-chrome"),
                shutil.which("chromium"),
                shutil.which("chromium-browser"),
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            )
            if candidate and Path(candidate).is_file()
        ),
        None,
    )
    if chrome_bin:
        launch["executable_path"] = chrome_bin

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(**launch)
        page = browser.new_page(viewport={"width": 1100, "height": 630}, device_scale_factor=1.5)
        external_requests: list[str] = []

        def local_files_only(route) -> None:
            url = route.request.url
            if url.startswith(("file://", "data:")):
                route.continue_()
            else:
                external_requests.append(url)
                route.abort()

        page.route("**/*", local_files_only)
        page.goto(report_path.as_uri(), wait_until="load")
        page.add_style_tag(content=".meta { display: none !important; }")

        visible_text = page.locator("body").inner_text()
        if str(repo_root) in visible_text or str(report_path.parent) in visible_text:
            raise RuntimeError("visible report text still contains a machine-specific path")
        if external_requests:
            raise RuntimeError(f"report requested non-local resources: {external_requests}")
        if not page.locator("h1 .score").count() or not page.get_by_text("Top risks", exact=True).count():
            raise RuntimeError("report is missing its score or top-risk section")

        page.screenshot(path=str(output_path), full_page=False)
        browser.close()

    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

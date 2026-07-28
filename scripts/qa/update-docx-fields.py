"""Update Writer indexes/fields and export PDF through an isolated UNO process."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import uno
from com.sun.star.beans import PropertyValue


def property_value(name: str, value: object) -> PropertyValue:
    prop = PropertyValue()
    prop.Name = name
    prop.Value = value
    return prop


def connect_to_pipe(pipe_name: str, timeout_seconds: float) -> object:
    local_context = uno.getComponentContext()
    resolver = local_context.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver",
        local_context,
    )
    connection_url = (
        f"uno:pipe,name={pipe_name};urp;StarOffice.ComponentContext"
    )
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            return resolver.resolve(connection_url)
        except Exception as error:  # UNO raises generated bridge exceptions.
            last_error = error
            time.sleep(0.2)
    raise RuntimeError(
        f"LibreOffice UNO connection timed out: {last_error}"
    )


def update_and_export(args: argparse.Namespace) -> dict[str, object]:
    pipe_name = f"md2docqa_{os.getpid()}_{time.time_ns()}"
    accept = (
        f"--accept=pipe,name={pipe_name};urp;StarOffice.ComponentContext"
    )
    process_args = [
        args.soffice,
        "--headless",
        "--nologo",
        "--nodefault",
        "--nofirststartwizard",
        "--nolockcheck",
        "--norestore",
        f"-env:UserInstallation={args.user_installation}",
        accept,
    ]
    stdout_log = open(args.stdout_log, "wb")
    stderr_log = open(args.stderr_log, "wb")
    process = subprocess.Popen(
        process_args,
        cwd=args.working_directory,
        stdout=stdout_log,
        stderr=stderr_log,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    document = None
    desktop = None
    try:
        remote_context = connect_to_pipe(pipe_name, 20)
        service_manager = remote_context.ServiceManager
        desktop = service_manager.createInstanceWithContext(
            "com.sun.star.frame.Desktop",
            remote_context,
        )
        input_url = uno.systemPathToFileUrl(str(Path(args.input).resolve()))
        document = desktop.loadComponentFromURL(
            input_url,
            "_blank",
            0,
            (
                property_value("Hidden", True),
                property_value("ReadOnly", False),
                property_value("UpdateDocMode", 3),
            ),
        )
        if document is None:
            raise RuntimeError("LibreOffice could not load the DOCX.")

        indexes = document.getDocumentIndexes()
        index_count = indexes.getCount()
        if index_count == 0:
            raise RuntimeError(
                "The DOCX contains no document index; TOC coverage is absent."
            )
        for index in range(index_count):
            indexes.getByIndex(index).update()

        text_fields = document.getTextFields()
        text_fields.refresh()
        if hasattr(document, "calculateAll"):
            document.calculateAll()
        for index in range(index_count):
            indexes.getByIndex(index).update()

        output_url = uno.systemPathToFileUrl(
            str(Path(args.output).resolve())
        )
        document.storeToURL(
            output_url,
            (
                property_value("FilterName", "writer_pdf_Export"),
                property_value("Overwrite", True),
            ),
        )
        output_path = Path(args.output)
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise RuntimeError("LibreOffice did not create a non-empty PDF.")
        return {
            "schemaVersion": 1,
            "documentIndexCount": index_count,
            "textFieldsRefreshed": True,
            "pdfBytes": output_path.stat().st_size,
        }
    finally:
        if document is not None:
            try:
                document.close(True)
            except Exception:
                document.dispose()
        if desktop is not None:
            try:
                desktop.terminate()
            except Exception:
                pass
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.terminate()
            process.wait(timeout=10)
        stdout_log.close()
        stderr_log.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--soffice", required=True)
    parser.add_argument("--user-installation", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--working-directory", required=True)
    parser.add_argument("--stdout-log", required=True)
    parser.add_argument("--stderr-log", required=True)
    return parser.parse_args()


def main() -> int:
    try:
        result = update_and_export(parse_args())
    except Exception as error:
        print(f"UNO update/export failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

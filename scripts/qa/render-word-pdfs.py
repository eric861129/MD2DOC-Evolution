"""將 Word 驗收 PDF 全頁渲染為 PNG，並建立逐頁總覽與文字檢查報告。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


def render_pdf(pdf_path: Path, output_root: Path) -> dict[str, object]:
    document = fitz.open(pdf_path)
    page_root = output_root / pdf_path.stem
    page_root.mkdir(parents=True, exist_ok=True)
    page_files: list[Path] = []
    page_reports: list[dict[str, object]] = []

    for page_index, page in enumerate(document):
        page_number = page_index + 1
        png_path = page_root / f"page-{page_number:03d}.png"
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
        pixmap.save(png_path)
        text = page.get_text("text")
        page_files.append(png_path)
        page_reports.append(
            {
                "page": page_number,
                "png": str(png_path),
                "widthPoints": round(page.rect.width, 2),
                "heightPoints": round(page.rect.height, 2),
                "textCharacters": len(text.strip()),
                "imageCount": len(page.get_images(full=True)),
                "containsReplacementCharacter": "\ufffd" in text,
            }
        )

    contact_sheet_path = output_root / f"{pdf_path.stem}-contact-sheet.png"
    create_contact_sheet(page_files, contact_sheet_path)
    return {
        "pdf": str(pdf_path),
        "pageCount": len(page_reports),
        "contactSheet": str(contact_sheet_path),
        "pages": page_reports,
        "status": (
            "passed"
            if page_reports
            and all(
                not page["containsReplacementCharacter"] for page in page_reports
            )
            else "failed"
        ),
    }


def create_contact_sheet(page_files: list[Path], output_path: Path) -> None:
    thumbnails: list[Image.Image] = []
    for page_file in page_files:
        with Image.open(page_file) as image:
            thumbnail = image.convert("RGB")
            thumbnail.thumbnail((520, 700))
            thumbnails.append(thumbnail.copy())

    columns = 2
    cell_width = 560
    cell_height = 750
    rows = max(1, (len(thumbnails) + columns - 1) // columns)
    sheet = Image.new(
        "RGB",
        (columns * cell_width, rows * cell_height),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    for index, thumbnail in enumerate(thumbnails):
        row, column = divmod(index, columns)
        x = column * cell_width + (cell_width - thumbnail.width) // 2
        y = row * cell_height + 30
        sheet.paste(thumbnail, (x, y))
        draw.text(
            (column * cell_width + 18, row * cell_height + 8),
            f"Page {index + 1}",
            fill="black",
        )
    sheet.save(output_path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    arguments = parser.parse_args()

    input_directory = arguments.input_dir.resolve()
    output_directory = arguments.output_dir.resolve()
    output_directory.mkdir(parents=True, exist_ok=True)
    pdf_paths = sorted(input_directory.glob("md2doc-*.pdf"))
    if not pdf_paths:
        raise FileNotFoundError(f"找不到 Word 驗收 PDF：{input_directory}")

    reports = [
        render_pdf(pdf_path, output_directory)
        for pdf_path in pdf_paths
    ]
    report = {
        "status": (
            "passed"
            if all(item["status"] == "passed" for item in reports)
            else "failed"
        ),
        "pdfCount": len(reports),
        "pageCount": sum(int(item["pageCount"]) for item in reports),
        "documents": reports,
    }
    report_path = output_directory / "pdf-render-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"PDF rendering：{report['status']}")
    print(f"PDF count：{report['pdfCount']}")
    print(f"Page count：{report['pageCount']}")
    print(f"Report：{report_path}")
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())

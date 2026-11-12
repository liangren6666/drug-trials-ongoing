"""Build the GitHub Pages snapshot: a slim search index plus detail shards."""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "临床试验_进行中_详情.csv"
DOCS = ROOT / "docs"
DATA = DOCS / "data"
SHARD_DIR = DATA / "shards"
TARGET_BYTES = 1_400_000
SNAPSHOT = "2026-11-12"

INDEX_FIELDS = [
    ("drug", "药物名称"),
    ("ind", "适应症"),
    ("title", "试验通俗题目"),
    ("app", "申请人名称"),
    ("type", "药物类型"),
    ("phase", "试验分期"),
    ("cls", "试验分类"),
]

FILTERS = ["药物类型", "试验分期", "试验分类"]
PHASES = {"I期", "II期", "III期", "IV期"}
CLASSES = {
    "安全性和有效性",
    "生物等效性试验/生物利用度试验",
    "药代动力学/药效动力学试验",
    "安全性",
    "有效性",
}


def bucket_phase(value: str) -> str:
    value = value.strip()
    if value in PHASES:
        return value
    note = value.split(":", 1)[-1] if ":" in value else value
    if "生物等效" in note or "BE" in note.upper():
        return "生物等效性"
    if value.startswith("其它") or value.startswith("其他"):
        return "其它"
    return value if len(value) <= 8 else "其它"


def bucket_class(value: str) -> str:
    value = value.strip()
    if value in CLASSES:
        return value
    if value.startswith("其他") or value.startswith("其它"):
        return "其他"
    return value if len(value) <= 18 else "其他"


def main() -> None:
    SHARD_DIR.mkdir(parents=True, exist_ok=True)
    for old in SHARD_DIR.glob("shard-*.json"):
        old.unlink()

    with SRC.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    rows.sort(key=lambda row: row.get("登记号", ""), reverse=True)

    shards: list[dict[str, dict[str, str]]] = []
    current: dict[str, dict[str, str]] = {}
    current_bytes = 2
    index_rows: list[list[str | int]] = []
    filter_counts = {name: Counter() for name in FILTERS}

    def flush() -> None:
        nonlocal current, current_bytes
        if not current:
            return
        shards.append(current)
        current = {}
        current_bytes = 2

    for row in rows:
        reg = (row.get("登记号") or "").strip()
        if not reg:
            continue
        detail = {key: (row.get(key) or "").strip() for key in row if key != "登记号"}
        detail = {key: value for key, value in detail.items() if value}
        encoded = json.dumps({reg: detail}, ensure_ascii=False, separators=(",", ":"))
        if current and current_bytes + len(encoded.encode("utf-8")) > TARGET_BYTES:
            flush()
        current[reg] = detail
        current_bytes += len(encoded.encode("utf-8"))
        phase = bucket_phase(detail.get("试验分期", ""))
        klass = bucket_class(detail.get("试验分类", ""))
        index_rows.append(
            [
                reg,
                detail.get("药物名称", ""),
                detail.get("适应症", ""),
                detail.get("试验通俗题目", ""),
                detail.get("申请人名称", ""),
                detail.get("药物类型", ""),
                phase,
                klass,
                len(shards),
            ]
        )
        for name, value in (
            ("药物类型", detail.get("药物类型", "")),
            ("试验分期", phase),
            ("试验分类", klass),
        ):
            if value:
                filter_counts[name][value] += 1
    flush()

    names: list[str] = []
    for number, shard in enumerate(shards):
        name = f"shard-{number:03d}.json"
        path = SHARD_DIR / name
        path.write_text(
            json.dumps(shard, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        names.append(f"data/shards/{name}")
        print(f"{name} {len(shard)} records {path.stat().st_size}")

    index_path = DATA / "index.json"
    index_path.write_text(
        json.dumps(
            {
                "cols": ["id", *(key for key, _ in INDEX_FIELDS), "shard"],
                "rows": index_rows,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    meta = {
        "snapshot": SNAPSHOT,
        "source": "药物临床试验登记与信息公示平台",
        "sourceUrl": "https://www.chinadrugtrials.org.cn/clinicaltrials.searchlist.dhtml",
        "query": "进行中",
        "count": len(index_rows),
        "shards": names,
        "filters": {
            name: [value for value, _ in filter_counts[name].most_common()]
            for name in FILTERS
        },
    }
    (DATA / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"index {index_path.stat().st_size} bytes, {len(index_rows)} rows, {len(shards)} shards")


if __name__ == "__main__":
    main()

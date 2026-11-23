"""LOCAL DEMO DATA ONLY. Reads the two FDE training sheets and writes a JSON file for scripts/seed-demo.mjs.

The sheets hold real people's names and status, so neither the sheets nor the JSON belong in git: write the JSON
outside the repository (or to scripts/.seed-data.json, which is git-ignored).

    pip install openpyxl
    python scripts/xlsx-to-seed.py "FDE Training Program Status Report.xlsx" "FDE 30 Day Status.xlsx" out.json

Program status sheet: one tab per person (Week, Topic, Topics to Cover, Practical Task, What You Learn, Proof of Evidence, Rate).
Daily status sheet:  tab "Status", one row per person, columns "Day 1".."Day 30" (+ weekly ratings).
"""
import json
import re
import sys

import openpyxl


def text(v):
    return str(v).replace("•", "-").strip() if v is not None else ""


def main(report_path, daily_path, out_path):
    report = openpyxl.load_workbook(report_path, data_only=True)
    plan, people = [], {}
    for ws in report.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        if not rows or text(rows[0][0]) != "Week":
            continue  # the guide tab
        week, days = 0, []
        for r in rows[1:]:
            r = list(r) + [None] * 8
            if text(r[0]).startswith("Week"):
                week = int(re.sub(r"\D", "", text(r[0])) or week + 1)
            if not text(r[1]):
                continue
            days.append({"week": week, "topic": text(r[1]), "cover": text(r[2]), "task": text(r[3]),
                         "learned": text(r[4]), "proof": text(r[5]), "rate": text(r[6])})
        if not plan:
            plan = [{k: d[k] for k in ("week", "topic", "cover", "task")} for d in days]
        people[ws.title.strip()] = {"days": [{k: d[k] for k in ("learned", "proof", "rate")} for d in days]}

    daily = openpyxl.load_workbook(daily_path, data_only=True)["Status"]
    header = [text(c.value) for c in daily[1]]
    for r in daily.iter_rows(min_row=2, values_only=True):
        name = text(r[0])
        if not name:
            continue
        entries = {}
        for i, h in enumerate(header):
            m = re.fullmatch(r"Day (\d+)", h)
            if m and text(r[i]):
                entries[int(m.group(1))] = text(r[i])
        people.setdefault(name, {"days": []})["daily"] = entries

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"plan": plan, "people": people}, f, ensure_ascii=False, indent=1)
    print(f"{len(plan)} plan days, {len(people)} people -> {out_path}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])

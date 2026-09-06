# Incident sourcebook — 7 September 2026

Collected for AFTERIMAGE's future narrative and systems design. This is a dated research pass, not an exhaustive inventory or an independently reproduced forensic investigation. Findings below are attributed to the people who reported them.

## Start here

1. [SOURCEBOOK.md](SOURCEBOOK.md): annotated sources and the important disagreements.
2. [TIMELINE.md](TIMELINE.md): occurrence dates kept separate from disclosure dates.
3. [EXPANSION-NOTES.md](EXPANSION-NOTES.md): original, explicitly fictional material to develop later.
4. [sources.json](sources.json): source IDs, publishers, dates, relationships, and access status.
5. [downloads.json](downloads.json): exact original URLs, retrieval timestamps, sizes, page counts, and SHA-256 checksums.

## Offline reports

| ID | Local document | Pages |
| --- | --- | ---: |
| HF-01 | [OpenAI technical report](originals/openai-hugging-face-technical-report.pdf) | 38 |
| HF-04 | [Joint METR/Redwood investigation](originals/metr-redwood-hugging-face-investigation.pdf) | 91 |
| AD-03 | [UK AISI technical incident report](originals/aisi-security-incident-2026-07-28.pdf) | 35 |
| CT-01 | [Alabama AG investigation announcement](originals/alabama-ag-openai-investigation-announcement.pdf) | 1 |

Total: **four PDFs, 165 pages**. The announcement is not the subpoena itself. The other indexed sources are online references with local research notes, not downloaded full articles. METR and Redwood host versions of the same joint investigation; they are not two independent confirmations.

The original creative reference remains [Isabel's clip](https://x.com/artficialisabel/status/2095678312773554533). Its imagery can inform the setting; incident claims should be traced to the reports.

## Integrity and future updates

From this folder, with Python 3 available:

```bash
python3 verify_archive.py
```

The checker verifies the local PDF bytes against the manifest, source IDs, and local document references. No network access is needed. PDF structure/page counts were additionally checked with `pdfinfo` at collection time. To search a report with Poppler installed, use `pdftotext path/to/report.pdf -`; text extraction is optional and not required by the game.

Preserve these exact files and their manifest. When a publisher updates a report, collect it under a new snapshot date and explain what changed. Do not merge counts with different units, observation periods, or dataset definitions.

## Coverage and access notes

- Reviewed the central OpenAI, Hugging Face, and METR/Redwood accounts; added the separate wiki report, Anthropic/AISI incidents, and related institutional context.
- OpenAI's September 5 wiki statement was retrieved through the FxTwitter public metadata API because direct X access returned 403. The source record preserves both URLs and this limitation.
- The Black Hat video was located through OpenAI's report page. It was not watched or transcribed in this pass. The original clip was visually sampled in the earlier design pass, not fully transcribed.
- The JFrog page rendered poorly through the reader. Its indexed title/date and excerpt were accessible; the full vendor account is a follow-up reading item.
- The wiki data download page was inspected; its bulk logs were not downloaded. Its export counts differ from the article's approximate headline count. Its page also displayed a draft-sharing banner despite being linked publicly. Retain that provenance detail when deciding whether to redistribute that dataset later.
- No separate Modal-authored incident report was found in this pass. A customer-hosted workload on Modal appears in other parties' accounts; this is not evidence that Modal's underlying platform was compromised.
- These are public reports and reference links. No exploit was executed, no affected system was probed, and no source author was contacted.

The first portable game ZIP predates this library. The project folder and its Git history are the authoritative copy of the expanded materials.

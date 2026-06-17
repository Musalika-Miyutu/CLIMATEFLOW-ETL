from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
from io import BytesIO


def generate_infrastructure_report(assets, assessments, alerts, sources_summary) -> BytesIO:
    """
    Generate a PDF report summarizing infrastructure risk status.
    Returns a BytesIO buffer containing the PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleStyle", parent=styles["Title"],
        fontSize=20, textColor=colors.HexColor("#1e3a8a"), alignment=TA_CENTER
    )
    subtitle_style = ParagraphStyle(
        "SubtitleStyle", parent=styles["Normal"],
        fontSize=11, textColor=colors.HexColor("#6b7280"), alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        "HeadingStyle", parent=styles["Heading2"],
        fontSize=14, textColor=colors.HexColor("#1e3a8a"), spaceAfter=10
    )
    body_style = ParagraphStyle(
        "BodyStyle", parent=styles["Normal"], fontSize=10, leading=14
    )

    elements = []

    # ── Header ───────────────────────────────────────────────
    elements.append(Paragraph("ClimateFlow ETL Pipeline", title_style))
    elements.append(Paragraph(
        "Climate-Resilient Infrastructure Monitoring Report — Kitwe, Zambia",
        subtitle_style
    ))
    elements.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        subtitle_style
    ))
    elements.append(Spacer(1, 0.8*cm))

    # ── Summary Stats ────────────────────────────────────────
    elements.append(Paragraph("Executive Summary", heading_style))

    total_observations = sum(s["total_observations"] for s in sources_summary)
    high_risk_count     = len([a for a in alerts if a["severity"] in ("high", "critical")])

    summary_data = [
        ["Metric",                     "Value"],
        ["Total Infrastructure Assets", str(len(assets))],
        ["Total Climate Observations",  str(total_observations)],
        ["Total Risk Assessments",      str(len(assessments))],
        ["High/Critical Risk Alerts",   str(high_risk_count)],
    ]

    summary_table = Table(summary_data, colWidths=[10*cm, 6*cm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR",      (0, 0), (-1, 0), colors.white),
        ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",       (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING",  (0, 0), (-1, 0), 8),
        ("TOPPADDING",     (0, 0), (-1, 0), 8),
        ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.8*cm))

    # ── Data Sources ─────────────────────────────────────────
    elements.append(Paragraph("Data Source Summary", heading_style))

    source_data = [["Source", "Stations", "Observations"]]
    for s in sources_summary:
        source_data.append([s["source"], str(s["total_stations"]), str(s["total_observations"])])

    source_table = Table(source_data, colWidths=[6*cm, 5*cm, 5*cm])
    source_table.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), colors.HexColor("#0f6e56")),
        ("TEXTCOLOR",      (0, 0), (-1, 0), colors.white),
        ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",       (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING",  (0, 0), (-1, 0), 8),
        ("TOPPADDING",     (0, 0), (-1, 0), 8),
        ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
    ]))
    elements.append(source_table)
    elements.append(Spacer(1, 0.8*cm))

    # ── Infrastructure Assets ────────────────────────────────
    elements.append(Paragraph("Infrastructure Assets", heading_style))

    asset_data = [["Asset Name", "Type", "Status", "Risk Threshold"]]
    for a in assets:
        asset_data.append([
            a["asset_name"], a["asset_type"].title(),
            a["condition_status"].title(), str(a["risk_threshold"])
        ])

    asset_table = Table(asset_data, colWidths=[7*cm, 3*cm, 3*cm, 3*cm])
    asset_table.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), colors.HexColor("#854f0b")),
        ("TEXTCOLOR",      (0, 0), (-1, 0), colors.white),
        ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",       (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING",  (0, 0), (-1, 0), 8),
        ("TOPPADDING",     (0, 0), (-1, 0), 8),
        ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
    ]))
    elements.append(asset_table)
    elements.append(Spacer(1, 0.8*cm))

    # ── Active Alerts ────────────────────────────────────────
    elements.append(Paragraph("Active Risk Alerts", heading_style))

    if not alerts:
        elements.append(Paragraph(
            "No active risk alerts at this time. All infrastructure assets are within safe thresholds.",
            body_style
        ))
    else:
        for alert in alerts[:10]:
            severity_color = {
                "critical": "#791f1f", "high": "#A32D2D",
                "medium": "#854F0B", "low": "#27500A"
            }.get(alert["severity"], "#444441")

            elements.append(Paragraph(
                f"<font color='{severity_color}'><b>[{alert['severity'].upper()}]</b></font> "
                f"{alert['message']}",
                body_style
            ))
            elements.append(Spacer(1, 0.3*cm))

    elements.append(Spacer(1, 1*cm))

    # ── Footer ───────────────────────────────────────────────
    footer_style = ParagraphStyle(
        "FooterStyle", parent=styles["Normal"],
        fontSize=8, textColor=colors.HexColor("#9ca3af"), alignment=TA_CENTER
    )
    elements.append(Paragraph(
        "ClimateFlow ETL — Developing an Automated Data Pipeline for "
        "Climate-Resilient Infrastructure Monitoring in Zambia — Group 27",
        footer_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
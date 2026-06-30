from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import date

def generate_quittance_pdf(
    bailleur_nom: str,
    bailleur_prenom: str,
    locataire_nom: str,
    locataire_prenom: str,
    adresse_bien: str,
    ville: str,
    code_postal: str,
    mois: str,
    loyer: float,
    charges: float,
    date_paiement: date,
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        fontSize=16,
        spaceAfter=20
    )
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=10
    )

    total = loyer + charges
    story = []

    # Titre
    story.append(Paragraph("QUITTANCE DE LOYER", title_style))
    story.append(Spacer(1, 0.5*cm))

    # Mention 1 & 2 : Bailleur et locataire
    story.append(Paragraph(f"<b>Bailleur :</b> {bailleur_prenom} {bailleur_nom}", normal_style))
    story.append(Paragraph(f"<b>Locataire :</b> {locataire_prenom} {locataire_nom}", normal_style))
    story.append(Spacer(1, 0.3*cm))

    # Mention 3 : Adresse du logement
    story.append(Paragraph(f"<b>Adresse du logement :</b> {adresse_bien}, {code_postal} {ville}", normal_style))
    story.append(Spacer(1, 0.3*cm))

    # Mention 4 : Période
    story.append(Paragraph(f"<b>Période de location :</b> {mois}", normal_style))
    story.append(Spacer(1, 0.3*cm))

    # Mention 5 & 6 & 7 : Loyer, charges, total
    data = [
        ["Désignation", "Montant"],
        ["Loyer (hors charges)", f"{loyer:.2f} €"],
        ["Charges", f"{charges:.2f} €"],
        ["Total", f"{total:.2f} €"],
    ]
    table = Table(data, colWidths=[10*cm, 5*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8f5e9')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.5*cm))

    # Mention 8 : Date de paiement
    story.append(Paragraph(
        f"Je soussigné(e) <b>{bailleur_prenom} {bailleur_nom}</b> reconnais avoir reçu de "
        f"<b>{locataire_prenom} {locataire_nom}</b> la somme de <b>{total:.2f} €</b> "
        f"au titre du loyer et des charges du logement susmentionné pour la période de <b>{mois}</b>.",
        normal_style
    ))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(f"<b>Date de paiement :</b> {date_paiement.strftime('%d/%m/%Y')}", normal_style))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "Cette quittance est établie conformément à la loi n°89-462 du 6 juillet 1989.",
        ParagraphStyle('footer', parent=styles['Normal'], fontSize=9, textColor=colors.grey)
    ))

    doc.build(story)
    return buffer.getvalue()
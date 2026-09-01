from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.bien import Bien
from app.models.locataire import Locataire
from app.models.paiement import Paiement
from app.models.user import User
from app.auth.jwt import verify_token
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import datetime

router = APIRouter(prefix="/export", tags=["Export"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.get("/fiscal/{annee}")
def export_fiscal(
    annee: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    biens = db.query(Bien).filter(Bien.owner_id == current_user.id).all()

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
        fontSize=18,
        spaceAfter=10,
        textColor=colors.HexColor('#0D1B2A')
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=11,
        spaceAfter=20,
        textColor=colors.HexColor('#6B7280')
    )
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=13,
        spaceAfter=8,
        spaceBefore=15,
        textColor=colors.HexColor('#0D1B2A')
    )

    story = []

    # En-tête
    story.append(Paragraph("GLI-OCR — Récapitulatif Fiscal", title_style))
    story.append(Paragraph(f"Année {annee} — Revenus fonciers", subtitle_style))
    story.append(Spacer(1, 0.3*cm))

    # Infos bailleur
    story.append(Paragraph(f"<b>Bailleur :</b> {current_user.prenom} {current_user.nom}", normal_style))
    story.append(Paragraph(f"<b>Email :</b> {current_user.email}", normal_style))
    story.append(Paragraph(f"<b>Date d'édition :</b> {datetime.now().strftime('%d/%m/%Y')}", normal_style))
    story.append(Spacer(1, 0.5*cm))

    total_annuel = 0

    # Détail par bien
    for bien in biens:
        story.append(Paragraph(f"Bien : {bien.adresse}, {bien.ville}", section_style))

        # Locataires du bien
        locataires = db.query(Locataire).filter(Locataire.bien_id == bien.id).all()
        for loc in locataires:
            story.append(Paragraph(
                f"Locataire : {loc.prenom} {loc.nom} — Entrée : {loc.date_entree.strftime('%d/%m/%Y')}",
                normal_style
            ))

        # Paiements de l'année
        paiements = db.query(Paiement).filter(
            Paiement.bien_id == bien.id,
            Paiement.statut == "paye"
        ).all()

        paiements_annee = [p for p in paiements if str(annee) in p.mois]

        if paiements_annee:
            data = [["Période", "Montant encaissé", "Date de paiement"]]
            total_bien = 0
            for p in paiements_annee:
                date_str = p.date_paiement.strftime('%d/%m/%Y') if p.date_paiement else "—"
                data.append([p.mois, f"{p.montant:.2f} €", date_str])
                total_bien += p.montant
            data.append(["TOTAL", f"{total_bien:.2f} €", ""])
            total_annuel += total_bien

            table = Table(data, colWidths=[7*cm, 5*cm, 5*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0D1B2A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E3DF')),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#D1FAE5')),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F7F5F1')]),
            ]))
            story.append(table)
        else:
            story.append(Paragraph(f"Aucun paiement enregistré pour {annee}.", normal_style))

        story.append(Spacer(1, 0.5*cm))

    # Total général
    story.append(Spacer(1, 0.5*cm))
    total_data = [
        ["TOTAL REVENUS FONCIERS", f"{total_annuel:.2f} €"],
    ]
    total_table = Table(total_data, colWidths=[12*cm, 5*cm])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#10B981')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 13),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(total_table)

    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "Ce document est généré automatiquement par GLI-OCR à titre indicatif. "
        "Consultez un expert-comptable pour votre déclaration fiscale.",
        ParagraphStyle('footer', parent=styles['Normal'], fontSize=8,
                      textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=fiscal_{annee}_{current_user.nom}.pdf"
        }
    )
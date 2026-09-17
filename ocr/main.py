from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import io
import re

app = FastAPI(title="GLI-OCR — Service OCR", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extraire_montants(texte: str) -> list:
    pattern = r'\b(\d{1,6}[.,]\d{2})\s*€?\b|\b(\d{1,6})\s*€\b'
    matches = re.findall(pattern, texte)
    montants = []
    for m in matches:
        val = m[0] or m[1]
        val = val.replace(',', '.')
        try:
            montants.append(float(val))
        except:
            pass
    return sorted(set(montants), reverse=True)

def extraire_dates(texte: str) -> list:
    patterns = [
        r'\b(\d{2}/\d{2}/\d{4})\b',
        r'\b(\d{2}-\d{2}-\d{4})\b',
        r'\b(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})\b',
    ]
    dates = []
    for pattern in patterns:
        matches = re.findall(pattern, texte, re.IGNORECASE)
        dates.extend(matches)
    return list(set(dates))

def extraire_fournisseur(texte: str) -> str:
    lignes = [l.strip() for l in texte.split('\n') if l.strip()]
    if lignes:
        return lignes[0][:100]
    return ""

@app.get("/")
def ping():
    return {"status": "ok", "message": "OCR Service running", "version": "1.0.0"}

@app.get("/health")
def health():
    try:
        version = pytesseract.get_tesseract_version()
        return {"status": "healthy", "tesseract_version": str(version)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    """Extrait le texte et les données structurées d'une image ou d'un PDF"""

    allowed_types = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Format non supporté. Utilisez une image (PNG, JPG) ou un PDF."
        )

    try:
        contents = await file.read()

        # Conversion PDF → image si nécessaire
        if file.content_type == 'application/pdf':
            images = convert_from_bytes(contents, dpi=150)
            image = images[0]  # Première page uniquement
        else:
            image = Image.open(io.BytesIO(contents))

        # Extraction OCR
        config = '--oem 3 --psm 6 -l fra+eng'
        texte_brut = pytesseract.image_to_string(image, config=config)

        montants = extraire_montants(texte_brut)
        dates = extraire_dates(texte_brut)
        fournisseur = extraire_fournisseur(texte_brut)
        montant_suggere = montants[0] if montants else None
        est_document = len(montants) > 0 and len(texte_brut) > 50

        return {
            "success": True,
            "texte_brut": texte_brut,
            "est_document": est_document,
            "avertissement": None if est_document else "Aucun montant détecté — ce document ne semble pas être une facture.",
            "donnees_extraites": {
                "fournisseur": fournisseur,
                "montants_detectes": montants,
                "montant_suggere": montant_suggere,
                "dates_detectees": dates,
                "date_suggeree": dates[0] if dates else None,
            },
            "nb_caracteres": len(texte_brut),
            "qualite_scan": "bonne" if len(texte_brut) > 100 else "faible"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur OCR : {str(e)}")
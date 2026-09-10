from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import io
import re
import json

app = FastAPI(title="GLI-OCR — Service OCR", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extraire_montants(texte: str) -> list:
    """Extrait les montants en euros du texte"""
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
    """Extrait les dates du texte"""
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
    """Tente d'extraire le nom du fournisseur (première ligne non vide)"""
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
    """Extrait le texte et les données structurées d'une image ou PDF"""
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="Format non supporté. Utilisez une image (PNG, JPG, JPEG)."
        )
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Configuration Tesseract pour le français
        config = '--oem 3 --psm 6 -l fra+eng'
        texte_brut = pytesseract.image_to_string(image, config=config)
        
        # Extraction des données structurées
        montants = extraire_montants(texte_brut)
        dates = extraire_dates(texte_brut)
        fournisseur = extraire_fournisseur(texte_brut)
        
        # Suggestion du montant principal (le plus élevé ou le total)
        montant_suggere = montants[0] if montants else None
        
        return {
            "success": True,
            "texte_brut": texte_brut,
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
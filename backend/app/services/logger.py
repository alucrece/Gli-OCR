import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Formateur de logs en JSON structuré"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry, ensure_ascii=False)

def get_logger(name: str) -> logging.Logger:
    """Retourne un logger configuré pour le module donné"""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Handler console
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(JSONFormatter())
        logger.addHandler(console_handler)
        
        # Handler fichier
        try:
            file_handler = logging.FileHandler('/app/logs/gli-ocr.log')
            file_handler.setFormatter(JSONFormatter())
            logger.addHandler(file_handler)
        except Exception:
            pass
    
    return logger

# Logger global de l'application
app_logger = get_logger("gli-ocr")
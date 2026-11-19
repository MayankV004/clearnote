import logging
import sys

def setup_logger():
    # 1. Create a custom logger named after your app
    logger = logging.getLogger("clearnote")
    
    # 2. Set the minimum log level
    logger.setLevel(logging.INFO)

    # 3. Prevent duplicate logs if the logger is imported multiple times
    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Define format
        log_format = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(log_format)
        
        logger.addHandler(console_handler)

    return logger

logger = setup_logger()


def mask_email(email: str | None) -> str:
    """Mask email for HIPAA/privacy compliant logging: j***e@domain.com"""
    if not email or "@" not in email:
        return "***"
    name_part, domain_part = email.split("@", 1)
    if len(name_part) <= 1:
        return f"*@{domain_part}"
    return f"{name_part[0]}***{name_part[-1]}@{domain_part}"


def mask_phone(phone: str | None) -> str:
    """Mask phone number for HIPAA/privacy compliant logging: +1*****4567"""
    if not phone or len(phone) < 8:
        return "***"
    return f"{phone[:2]}*****{phone[-4:]}"


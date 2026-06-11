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

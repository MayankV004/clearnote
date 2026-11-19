import pytest
from app.core.logger import mask_email, mask_phone

def test_mask_email():
    assert mask_email("john.doe@hospital.org") == "j***e@hospital.org"
    assert mask_email("a@b.com") == "*@b.com"
    assert mask_email("") == "***"
    assert mask_email(None) == "***"

def test_mask_phone():
    assert mask_phone("+15551234567") == "+1*****4567"
    assert mask_phone("12345") == "***"
    assert mask_phone(None) == "***"

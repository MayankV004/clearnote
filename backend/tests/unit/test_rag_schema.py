"""
tests/unit/test_rag_schema.py
─────────────────────────────
Unit tests for the InteractionResult Pydantic output schema.

Verifies: valid parsing, severity enum enforcement, confidence range
validation, field defaults, and graceful failure on bad input.
No API calls — pure Pydantic validation tests.
"""
import pytest
from pydantic import ValidationError

from app.schemas.rag import InteractionResult


def _make_json(**overrides) -> str:
    import json
    base = {
        "severity": "NONE",
        "mechanism": "No known interaction.",
        "recommendation": "No action required.",
        "source_reference": "WHO EML 2023, p.47",
        "confidence": 0.85,
    }
    base.update(overrides)
    return json.dumps(base)


class TestInteractionResultSchema:

    def test_valid_none_severity(self):
        result = InteractionResult.model_validate_json(_make_json(severity="NONE"))
        assert result.severity == "NONE"

    def test_valid_mild_severity(self):
        result = InteractionResult.model_validate_json(_make_json(severity="MILD"))
        assert result.severity == "MILD"

    def test_valid_moderate_severity(self):
        result = InteractionResult.model_validate_json(_make_json(severity="MODERATE"))
        assert result.severity == "MODERATE"

    def test_valid_severe_severity(self):
        result = InteractionResult.model_validate_json(_make_json(severity="SEVERE"))
        assert result.severity == "SEVERE"

    def test_invalid_severity_raises_validation_error(self):
        """LLM returning 'LOW' or 'HIGH' must not silently succeed."""
        with pytest.raises(ValidationError):
            InteractionResult.model_validate_json(_make_json(severity="LOW"))

    def test_invalid_severity_minor_raises(self):
        with pytest.raises(ValidationError):
            InteractionResult.model_validate_json(_make_json(severity="MINOR"))

    def test_confidence_at_lower_bound(self):
        result = InteractionResult.model_validate_json(_make_json(confidence=0.0))
        assert result.confidence == 0.0

    def test_confidence_at_upper_bound(self):
        result = InteractionResult.model_validate_json(_make_json(confidence=1.0))
        assert result.confidence == 1.0

    def test_confidence_above_1_raises(self):
        with pytest.raises(ValidationError):
            InteractionResult.model_validate_json(_make_json(confidence=1.5))

    def test_confidence_below_0_raises(self):
        with pytest.raises(ValidationError):
            InteractionResult.model_validate_json(_make_json(confidence=-0.1))

    def test_missing_severity_raises(self):
        import json
        data = json.dumps({"mechanism": "test", "confidence": 0.5})
        with pytest.raises(ValidationError):
            InteractionResult.model_validate_json(data)

    def test_optional_fields_have_defaults(self):
        import json
        # Only severity is required
        data = json.dumps({"severity": "NONE", "confidence": 0.5})
        result = InteractionResult.model_validate_json(data)
        assert result.mechanism == ""
        assert result.recommendation == ""
        assert result.source_reference == ""

    def test_full_valid_payload(self):
        result = InteractionResult.model_validate_json(
            _make_json(
                severity="MODERATE",
                mechanism="NSAIDs reduce antihypertensive efficacy of Amlodipine via prostaglandin inhibition.",
                recommendation="Monitor BP closely; consider paracetamol as alternative analgesic.",
                source_reference="WHO EML 2023, p.47",
                confidence=0.9,
            )
        )
        assert result.severity == "MODERATE"
        assert result.confidence == 0.9
        assert "NSAID" in result.mechanism

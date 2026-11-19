import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from sqlalchemy import text
from app.api.dependencies.auth import set_rls_doctor_id

@pytest.mark.asyncio
async def test_set_rls_doctor_id_executes_parameterized_query():
    mock_session = AsyncMock()
    doc_id = uuid4()

    await set_rls_doctor_id(mock_session, doc_id)

    assert mock_session.execute.called
    args, kwargs = mock_session.execute.call_args
    # Verify parameterized SQL statement and parameter dictionary
    assert "set_config" in str(args[0])
    assert args[1] == {"doctor_id": str(doc_id)}

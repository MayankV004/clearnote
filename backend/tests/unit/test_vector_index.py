"""
test_vector_index.py

Tests for TICKET-05 / DATA-01: HNSW vector index migration for pgvector guideline_chunks.
"""

import pytest
import os
from alembic.config import Config
from alembic.script import ScriptDirectory


def test_hnsw_migration_exists_and_is_head():
    """Verify HNSW migration is defined, chained to c1a2b3d4e5f6, and contains HNSW SQL."""
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    alembic_ini = os.path.join(backend_dir, "alembic.ini")
    config = Config(alembic_ini)
    script = ScriptDirectory.from_config(config)

    head = script.get_current_head()
    assert head is not None, "No current head found in Alembic script directory"

    head_revision = script.get_revision(head)
    assert head_revision is not None
    assert "hnsw" in head_revision.doc.lower() or "hnsw" in head_revision.path.lower()
    assert head_revision.down_revision == "c1a2b3d4e5f6"

    # Read migration source to verify HNSW SQL commands
    with open(head_revision.path, "r") as f:
        content = f.read()

    assert "hnsw" in content.lower()
    assert "vector_cosine_ops" in content
    assert "DROP INDEX" in content

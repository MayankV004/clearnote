"""add awaiting_review to consultationstatus enum

Revision ID: c1a2b3d4e5f6
Revises: 54b931c35fa5
Create Date: 2026-11-19 20:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '54b931c35fa5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # In PostgreSQL, ALTER TYPE ... ADD VALUE must run outside a transactional block in older engines
    # or inside autocommit_block in Alembic.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE consultationstatus ADD VALUE IF NOT EXISTS 'AWAITING_REVIEW' BEFORE 'COMPLETE';")


def downgrade() -> None:
    pass

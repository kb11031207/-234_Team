"""migrate_to_face_recognition

Revision ID: 20251025223720
Revises: 
Create Date: 2025-10-25 22:37:20.000000

Changes:
- Remove azure_face_id column from detected_faces table
- Add face_encoding JSONB column to detected_faces table
- Add index on event_id for faster clustering queries

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251025223720'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove azure_face_id column
    op.drop_index('ix_detected_faces_azure_face_id', table_name='detected_faces', if_exists=True)
    op.drop_column('detected_faces', 'azure_face_id')
    
    # Add face_encoding column (stores 128-dimensional vector as JSON array)
    op.add_column('detected_faces', 
        sa.Column('face_encoding', postgresql.JSONB, nullable=True)
    )
    
    # Add index on face_encoding for faster queries (GIN index for JSONB)
    op.create_index(
        'ix_detected_faces_face_encoding',
        'detected_faces',
        ['face_encoding'],
        postgresql_using='gin',
        if_not_exists=True
    )


def downgrade() -> None:
    # Remove face_encoding column and index
    op.drop_index('ix_detected_faces_face_encoding', table_name='detected_faces', if_exists=True)
    op.drop_column('detected_faces', 'face_encoding')
    
    # Restore azure_face_id column
    op.add_column('detected_faces',
        sa.Column('azure_face_id', sa.String(255), nullable=True)
    )
    op.create_index('ix_detected_faces_azure_face_id', 'detected_faces', ['azure_face_id'], if_not_exists=True)


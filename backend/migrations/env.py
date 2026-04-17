from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

# Import our own database config and models
from database import Base, SQLALCHEMY_DATABASE_URL

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
fileConfig(config.config_file_name)

# Use our database URL (this fixes the connection error)
config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL.replace("+aiosqlite", ""))

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
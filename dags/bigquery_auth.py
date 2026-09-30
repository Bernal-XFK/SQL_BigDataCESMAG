"""Scoped BigQuery client creation for Drive-backed external tables."""

from collections.abc import Callable
from typing import Any

BIGQUERY_SCOPES = (
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/drive.readonly",
)

CredentialsFactory = Callable[..., tuple[Any, Any]]
ClientFactory = Callable[..., Any]


def create_bigquery_client(
    *,
    project: str,
    credentials_factory: CredentialsFactory,
    client_factory: ClientFactory,
) -> Any:
    """Create a BigQuery client with cloud and read-only Drive OAuth scopes."""
    credentials, _ = credentials_factory(scopes=list(BIGQUERY_SCOPES))
    return client_factory(project=project, credentials=credentials)

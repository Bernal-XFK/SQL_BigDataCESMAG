import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "dags"))

from bigquery_auth import BIGQUERY_SCOPES, create_bigquery_client


class BigQueryAuthTests(unittest.TestCase):
    def test_client_uses_cloud_and_read_only_drive_scopes(self):
        credentials = object()
        observed = {}

        def credentials_factory(*, scopes):
            observed["scopes"] = scopes
            return credentials, "infrabigdataces"

        def client_factory(**kwargs):
            observed["client_kwargs"] = kwargs
            return "client"

        client = create_bigquery_client(
            project="infrabigdataces",
            credentials_factory=credentials_factory,
            client_factory=client_factory,
        )

        self.assertEqual(client, "client")
        self.assertIn("https://www.googleapis.com/auth/cloud-platform", observed["scopes"])
        self.assertIn("https://www.googleapis.com/auth/drive.readonly", observed["scopes"])
        self.assertEqual(observed["client_kwargs"]["credentials"], credentials)
        self.assertEqual(observed["client_kwargs"]["project"], "infrabigdataces")


if __name__ == "__main__":
    unittest.main()

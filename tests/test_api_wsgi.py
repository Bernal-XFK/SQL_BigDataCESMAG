import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "cloud-function"))

import main
from flask import request


class ApiWsgiTests(unittest.TestCase):
    def test_root_returns_execution_data_and_cors_headers(self):
        body = '[{"id": 1, "studentName": "Prueba", "queryStatus": "success"}]'
        headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://sql-big-data-cesmag.vercel.app",
        }

        with patch.object(main, "executions_api", return_value=(body, 200, headers)) as api:
            response = main.app.test_client().get(
                "/",
                headers={"Origin": "https://sql-big-data-cesmag.vercel.app"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [{"id": 1, "studentName": "Prueba", "queryStatus": "success"}])
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "https://sql-big-data-cesmag.vercel.app",
        )
        api.assert_called_once()

    def test_vercel_origin_is_allowed_by_default(self):
        with patch.object(
            main,
            "ALLOWED_ORIGINS",
            "http://localhost:5173,https://sql-big-data-cesmag.vercel.app",
        ):
            with main.app.test_request_context(
                "/", headers={"Origin": "https://sql-big-data-cesmag.vercel.app"}
            ):
                self.assertEqual(
                    main._allowed_origin(request),
                    "https://sql-big-data-cesmag.vercel.app",
                )


if __name__ == "__main__":
    unittest.main()

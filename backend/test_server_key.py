import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException

import main


class ServerKeyTests(unittest.TestCase):
    def test_requests_no_longer_require_browser_key(self):
        self.assertEqual(main.ProcessRequest(url="https://www.xiaoyuzhoufm.com/episode/test").url,
                         "https://www.xiaoyuzhoufm.com/episode/test")
        self.assertEqual(main.SaveBrainRequest(taskId="task", takeaways=["idea"]).task_id, "task")
        self.assertEqual(main.ChatRequest(question="What changed?").question, "What changed?")
        for model in (main.ProcessRequest, main.SaveBrainRequest, main.ChatRequest):
            self.assertNotIn("openaiApiKey", model.model_json_schema().get("properties", {}))

    def test_key_is_read_only_from_backend_environment(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "server-only-test-key"}):
            self.assertEqual(main.require_openai_api_key(), "server-only-test-key")
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(HTTPException) as raised:
                main.require_openai_api_key()
            self.assertEqual(raised.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()

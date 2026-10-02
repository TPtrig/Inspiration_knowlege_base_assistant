import asyncio
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import main


class FakeCollection:
    def count(self):
        return 1

    def query(self, **_kwargs):
        return {"documents": [["A guest predicts a change."]], "metadatas": [[{"brain_item_id": "memory-1"}]]}


class FakeResponse:
    def __init__(self, answer):
        self.answer = answer

    def raise_for_status(self):
        pass

    def json(self):
        import json
        return {"choices": [{"message": {"content": json.dumps({"answer": self.answer})}}]}


class FakeClient:
    def __init__(self, answer, **_kwargs):
        self.answer = answer

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        pass

    async def post(self, *_args, **_kwargs):
        return FakeResponse(self.answer)


class CitationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.original_db = main.DB_PATH
        self.original_audio = main.AUDIO_DIR
        main.DB_PATH = Path(self.tmp.name) / "test.db"
        main.AUDIO_DIR = Path(self.tmp.name) / "audio"
        main.init_db()
        main.create_task("task-1", "https://www.xiaoyuzhoufm.com/episode/example", "", "xiaoyuzhou")
        with main.get_db_conn() as conn:
            conn.execute("UPDATE tasks SET title = ? WHERE id = ?", ("Research episode", "task-1"))
            row = conn.execute("SELECT * FROM tasks WHERE id = ?", ("task-1",)).fetchone()
        main.save_brain_items(row, ["A guest predicts a change."], ["memory-1"], ["chroma-1"])

    def tearDown(self):
        main.DB_PATH = self.original_db
        main.AUDIO_DIR = self.original_audio
        self.tmp.cleanup()

    def test_retrieval_carries_real_source_and_respects_disable(self):
        with patch.object(main, "get_chroma_collection", return_value=FakeCollection()):
            citations = main.query_chroma_contexts([0.1], None, 4)
            self.assertEqual(citations[0].memory_id, "memory-1")
            self.assertEqual(citations[0].source_title, "Research episode")
            self.assertEqual(citations[0].source_url, "https://www.xiaoyuzhoufm.com/episode/example")
            main.set_brain_item_enabled("memory-1", False)
            self.assertEqual(main.query_chroma_contexts([0.1], None, 4), [])

    def test_answer_validates_and_persists_citation_snapshot(self):
        citation = main.ChatCitation(
            number=1, memory_id="memory-1", task_id="task-1",
            source_title="Research episode", source_url="https://www.xiaoyuzhoufm.com/episode/example",
            excerpt="A guest predicts a change.",
        )
        with patch.object(main.httpx, "AsyncClient", side_effect=lambda **kwargs: FakeClient("The guest predicts a change [1].", **kwargs)):
            answer, citations = asyncio.run(main.generate_rag_answer("What did the guest predict?", [citation], "test-key"))
        self.assertIn("[1]", answer)
        self.assertEqual(citations, [citation])

        conversation = main.create_conversation()
        main.add_conversation_message(conversation["id"], "assistant", answer, citations)
        self.assertEqual(main.list_conversation_messages(conversation["id"])[0].citations, [citation])

        with patch.object(main.httpx, "AsyncClient", side_effect=lambda **kwargs: FakeClient("Unsupported claim [2].", **kwargs)):
            answer, citations = asyncio.run(main.generate_rag_answer("What else?", [citation], "test-key"))
        self.assertEqual(answer, "I don't know based on your saved takeaways.")
        self.assertEqual(citations, [])


if __name__ == "__main__":
    unittest.main()

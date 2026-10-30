"""Validate publication boundaries and the talk's factual/content contracts."""
import json
import re
import unittest
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SiteChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = json.loads((ROOT / "assets/content.json").read_text(encoding="utf8"))
        cls.results = json.loads((ROOT / "evidence/validated-results.json").read_text(encoding="utf8"))

    def test_talk_duration_and_required_content(self):
        chapters = self.content["chapters"]
        self.assertEqual([c["title"] for c in chapters], ["模型适配", "性能调优"])
        self.assertEqual(chapters[1]["status"], "planned")
        self.assertEqual(chapters[1]["lessons"], [])
        lessons = chapters[0]["lessons"]
        self.assertEqual(len(lessons), 6)
        self.assertEqual(sum(c["minutes"] for c in lessons), 20)
        self.assertEqual(len({c["id"] for c in lessons}), len(lessons))
        notes = (ROOT / "speaker-notes.md").read_text(encoding="utf8")
        for c in lessons:
            self.assertGreater(len(c["notes"]), 80)
            self.assertIn(c["notes"], notes)
            self.assertIn(c["takeaway"], notes)
            self.assertGreaterEqual(len(c["reading"]), 2)
            for field in ["prompt", "deliverable", "check", "redflag", "followup"]:
                self.assertGreater(len(c[field]), 10)
                self.assertIn(c[field], notes)
            for source in c["sources"]:
                self.assertIn(source, self.content["sources"])

    def test_recorded_checkpoint_results(self):
        run = self.results["checkpoint_regression"]
        self.assertEqual(run["actual_chunks_8705"], [4352, 4353])
        self.assertEqual(run["request_count"], 2 * len(run["rows"]))
        self.assertEqual([(r["tokens"], r["hot_hit"]) for r in run["rows"]],
                         [(4353, 4352), (8704, 4352), (8705, 4352), (8706, 4352), (13057, 13056)])
        self.assertTrue(all(r["equal_output"] and r["cold_hit"] == 0 for r in run["rows"]))
        self.assertIn("single", self.results["performance_appendix"]["limit"])

    def test_public_assets_and_local_links(self):
        for name in ["index.html", "assets/app.js", "assets/style.css", "assets/content.json",
                     "assets/favicon.svg", "speaker-notes.md", "evidence/validated-results.json"]:
            self.assertTrue((ROOT / name).is_file(), name)
        html = (ROOT / "index.html").read_text(encoding="utf8")
        for href in re.findall(r'(?:src|href)="([^"]+)"', html):
            if not href.startswith(("https://", "#")):
                self.assertTrue((ROOT / href).is_file(), href)
        for source in self.content["sources"].values():
            url = source["url"]
            if not url.startswith("https://"):
                self.assertTrue((ROOT / url).is_file(), url)
        for source in [self.results["historical_a5"]["source"],
                       self.results["checkpoint_regression"]["source"],
                       self.results["no_pool_control"]["source"], self.results["sdk_revision"]["source"]]:
            self.assertRegex(source["sha256"], r"^[a-f0-9]{64}$")

    def test_no_internal_identifiers_in_published_content(self):
        paths = [ROOT / "index.html", ROOT / "speaker-notes.md"]
        paths += list((ROOT / "assets").glob("*")) + list((ROOT / "evidence").glob("*"))
        paths += [ROOT / "talk/index.html", ROOT / "talk/slides.json", ROOT / "talk/speaker-notes.md",
                  ROOT / "talk/speaker-notes.html"]
        patterns = [r"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])",
                    r"(?<![A-Za-z])[A-Za-z]:[\\/]", r"/home/[A-Za-z0-9_-]+", r"/mnt/(?:share|weight)",
                    r"\b[dz]\d{8}\b", r"(?:ghp_|github_pat_)[A-Za-z0-9_]+",
                    r"-----BEGIN .*PRIVATE KEY-----"]
        for path in paths:
            text = path.read_text(encoding="utf8")
            for pattern in patterns:
                self.assertIsNone(re.search(pattern, text), f"{path.name}: {pattern}")

    def test_standalone_lecture(self):
        subprocess.run([sys.executable, str(ROOT / "export_talk.py"), "--check"], check=True, cwd=ROOT)
        data = json.loads((ROOT / "talk/slides.json").read_text(encoding="utf8"))
        self.assertEqual(len(data["slides"]), 14)
        self.assertEqual(sum(s["minutes"] for s in data["slides"]), 30)
        self.assertEqual(len({s["id"] for s in data["slides"]}), 14)
        self.assertFalse(any(s["id"] == "chapter-two" for s in data["slides"]))
        html = (ROOT / "talk/index.html").read_text(encoding="utf8")
        self.assertNotIn("[必填]", html)
        self.assertNotIn("SLIDES_HERE", html)
        self.assertIn("GNU AFFERO GENERAL PUBLIC LICENSE", html)
        self.assertIn("@media print", html)
        for i, s in enumerate(data["slides"]):
            self.assertRegex(s["layout"], r"^H(?:0[1-9]|[1-3][0-9]|4[0-2])$")
            self.assertGreater(len(s["notes"]), 70)
            self.assertTrue("light" in s["theme"] or "dark" in s["theme"])
            if i >= 2:
                themes = [x["theme"].split()[-1] for x in data["slides"][i-2:i+1]]
                self.assertGreater(len(set(themes)), 1, "Three consecutive pages use the same theme")


if __name__ == "__main__":
    unittest.main()

import ast
import hashlib
import sys
from difflib import SequenceMatcher


def normalize_python(code: str) -> str:
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Name):
                node.id = "VAR"
            if isinstance(node, ast.arg):
                node.arg = "ARG"
        return ast.dump(tree)
    except SyntaxError:
        return "".join(code.split())


def fingerprint(code: str) -> str:
    return hashlib.sha256(normalize_python(code).encode()).hexdigest()


def similarity(a: str, b: str) -> float:
    return round(SequenceMatcher(None, normalize_python(a), normalize_python(b)).ratio() * 100, 2)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print({"error": "usage: python plagiarism_check.py file1.py file2.py"})
        raise SystemExit(1)

    a = open(sys.argv[1], encoding="utf-8").read()
    b = open(sys.argv[2], encoding="utf-8").read()
    score = similarity(a, b)
    print({
        "fingerprint_a": fingerprint(a),
        "fingerprint_b": fingerprint(b),
        "similarity": score,
        "flagged": score > 80
    })

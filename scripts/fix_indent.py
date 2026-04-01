#!/usr/bin/env python3
"""Fix broken indentation in Python code from PDF import.

Reads code from a file, attempts to fix indentation and newlines,
validates with ast.parse, and outputs the fixed code.
"""
import sys
import re
import ast


def fix_pdf_artifacts(code):
    """Fix PDF import artifacts."""
    code = code.replace("\u2423\n", " ")
    code = code.replace("\u2423", " ")
    return code


def rejoin_comment_continuations(code):
    """Rejoin lines that are continuations of comments broken by PDF wrapping.

    Pattern: a line with an inline # comment, followed by a line that is
    continuation text (not a Python statement start).
    Also handles other PDF line wraps where a line continuation doesn't
    start with a Python keyword.
    """
    lines = code.split("\n")
    if len(lines) <= 1:
        return code

    stmt_starters = re.compile(
        r'^(?:#|def |class |if |elif |else:|for |while |try:|except[ :]|'
        r'finally:|with |return|import |from |raise |pass\b|break\b|continue\b|'
        r'assert |yield |print\(|del |@|[a-zA-Z_]\w*\s*[\=\(\[\.]|'
        r'[\d\(\[\{"\'])'
    )

    # Lines that are clearly not Python statements (only punctuation/symbols)
    not_code = re.compile(r'^[\-\=\*\.\,\;\:\!\?\s]+$')

    result = [lines[0]]
    for i in range(1, len(lines)):
        stripped = lines[i].strip()
        if not stripped:
            result.append(lines[i])
            continue

        prev = result[-1]

        # If line is only punctuation (like "--------"), it's a comment continuation
        if not_code.match(stripped):
            # Join with previous line if it has a comment
            has_prev_comment = "#" in prev
            if has_prev_comment:
                result[-1] = prev.rstrip() + stripped
                continue

        # Check if previous line has an inline comment
        # And current line is NOT a Python statement
        has_comment = False
        try:
            # Find # in previous line that's not in a string
            in_str = None
            for j, ch in enumerate(prev):
                if ch in ('"', "'") and (j == 0 or prev[j-1] != '\\'):
                    if in_str == ch:
                        in_str = None
                    elif in_str is None:
                        in_str = ch
                elif ch == '#' and in_str is None:
                    has_comment = True
                    break
        except:
            pass

        if has_comment and not stmt_starters.match(stripped):
            # Likely a continuation of the comment
            result[-1] = prev.rstrip() + " " + stripped
        else:
            result.append(lines[i])

    return "\n".join(result)


def convert_markdown_comments(code):
    """Convert ## markdown headings to #@ (tagged Python comments).

    We use #@ as a marker so we know these comments were section headers.
    """
    lines = code.split("\n")
    fixed = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("## "):
            indent = line[: len(line) - len(line.lstrip())]
            fixed.append(indent + "#@ " + stripped[3:])
        else:
            fixed.append(line)
    return "\n".join(fixed)


def finalize_comments(code):
    """Convert #@ markers back to regular # comments."""
    return code.replace("#@ ", "# ")


def protect_strings(code):
    """Replace string literals with placeholders."""
    strings = []

    def save(m):
        strings.append(m.group(0))
        return f"__PSTR{len(strings)-1}__"

    code = re.sub(r'"""[\s\S]*?"""', save, code)
    code = re.sub(r"'''[\s\S]*?'''", save, code)
    code = re.sub(r'"(?:[^"\\]|\\.)*"', save, code)
    code = re.sub(r"'(?:[^'\\]|\\.)*'", save, code)
    return code, strings


def restore_strings(code, strings):
    for i, s in enumerate(strings):
        code = code.replace(f"__PSTR{i}__", s)
    return code


def split_squashed(code):
    """Split squashed code at statement boundaries.

    Works line-by-line. Skips comment lines entirely.
    """
    kw_list = [
        "def ", "class ", "if ", "elif ", "else:", "for ", "while ",
        "try:", "except ", "except:", "finally:", "with ", "return ",
        "import ", "from ", "raise ", "assert ", "yield ",
    ]

    result_lines = []
    for line in code.split("\n"):
        stripped = line.strip()
        # Don't split comment lines or empty lines
        if not stripped or stripped.startswith("#"):
            result_lines.append(line)
            continue

        # Protect strings in this line
        protected, strings = protect_strings(stripped)

        for kw in sorted(kw_list, key=len, reverse=True):
            escaped = re.escape(kw)
            protected = re.sub(r"(?<=\S) +(" + escaped + r")", r"\n\1", protected)

        for kw in ["pass", "break", "continue"]:
            protected = re.sub(r"(?<=\S) +(" + re.escape(kw) + r")(?=\s|$)", r"\n\1", protected)

        protected = re.sub(r"(?<=\S) +(print\()", r"\n\1", protected)
        protected = re.sub(r'(?<=[\)\]\"\x27])\s+([a-zA-Z_]\w*\s*=\s)', r"\n\1", protected)

        restored = restore_strings(protected, strings)
        result_lines.extend(restored.split("\n"))

    return "\n".join(result_lines)


def strip_inline_comment(stripped):
    """Remove inline # comment from a line, respecting strings."""
    in_str = None
    for i, ch in enumerate(stripped):
        if ch in ('"', "'") and (i == 0 or stripped[i-1] != '\\'):
            if in_str == ch:
                in_str = None
            elif in_str is None:
                in_str = ch
        elif ch == '#' and in_str is None:
            return stripped[:i].rstrip()
    return stripped


def is_block_opener(stripped):
    # Strip inline comment first: `for i in range(5): # comment` -> `for i in range(5):`
    code_part = strip_inline_comment(stripped)
    if not code_part.endswith(":"):
        return False
    block_kws = [
        "def ", "class ", "if ", "elif ", "else", "for ", "while ",
        "try", "except ", "except:", "finally", "with ",
    ]
    for k in block_kws:
        if code_part.startswith(k):
            return True
    return code_part in ("else:", "try:", "finally:", "except:")


def is_dedenter(stripped):
    return stripped.startswith(("elif ", "else:", "except ", "except:", "finally:"))


def is_section_comment(stripped):
    """Check if line is a section header comment (was ## in original)."""
    return stripped.startswith("#@ ")


def indent_code(code):
    """Apply correct Python indentation.

    Key insight: #@ comments (originally ## headings) are section separators.
    They always appear at the top level of the current def/class scope.
    """
    lines = code.split("\n")
    result = []
    indent = 0
    stack = []  # (indent_level, type: 'def'|'class'|'other')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            result.append("")
            continue

        # Section comments (#@): these are section headers from the PDF.
        # They should be at the module level or class level, not nested.
        if is_section_comment(stripped):
            # Pop back to def/class level or module level
            while stack:
                if stack[-1][1] in ("def", "class"):
                    indent = stack[-1][0] + 1
                    break
                else:
                    stack.pop()
            else:
                indent = 0
            result.append("    " * indent + stripped)
            continue

        # Dedent for elif/else/except/finally
        if is_dedenter(stripped):
            if stripped.startswith(("except ", "except:", "finally:")):
                # except/finally match try: - pop ALL inner blocks back to try level
                # Pop all "other" blocks to find the try
                while stack and stack[-1][1] == "other":
                    indent = stack.pop()[0]
            else:
                # elif/else match if - pop just the last block
                if stack:
                    indent = stack.pop()[0]

        # def/class: reset to appropriate level
        if stripped.startswith(("def ", "class ")):
            while stack:
                if stack[-1][1] == "class":
                    indent = stack[-1][0] + 1
                    break
                else:
                    stack.pop()
            else:
                indent = 0

        result.append("    " * indent + stripped)

        if is_block_opener(stripped):
            btype = "def" if stripped.startswith("def ") else \
                    "class" if stripped.startswith("class ") else "other"
            stack.append((indent, btype))
            indent += 1
        # NOTE: We do NOT pop blocks on return/break/continue/pass
        # because elif/else/except/finally might follow.
        # Block popping is done by: section comments (#@), def/class, dedent keywords.

    return "\n".join(result)


def fix_truncated_block(code):
    """Add 'pass' to close truncated blocks."""
    lines = code.rstrip().split("\n")
    if lines:
        last = lines[-1].strip()
        if last.endswith(":") and is_block_opener(last):
            indent = len(lines[-1]) - len(lines[-1].lstrip())
            lines.append(" " * (indent + 4) + "pass")
    return "\n".join(lines)


def fix_unclosed_strings(code):
    triple_double = code.count('"""')
    triple_single = code.count("'''")
    if triple_double % 2 == 1:
        code += '\n"""'
    if triple_single % 2 == 1:
        code += "\n'''"
    return code


def fix_unclosed_brackets(code):
    for open_b, close_b in [("(", ")"), ("[", "]"), ("{", "}")]:
        diff = code.count(open_b) - code.count(close_b)
        if diff > 0:
            code += close_b * diff
    return code


def remove_prose_lines(code):
    """Comment out lines that look like Italian prose."""
    lines = code.split("\n")
    result = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            result.append(line)
            continue
        # Known Python starts
        if stripped.startswith(("#", "def ", "class ", "if ", "elif ", "else:",
                                "for ", "while ", "try:", "except", "finally:",
                                "with ", "return", "import ", "from ", "raise ",
                                "pass", "break", "continue", "assert ", "yield ",
                                "print(", "del ", "@", "    ", "\t")):
            result.append(line)
            continue
        if re.match(r'^[a-zA-Z_]\w*\s*[\=\(\[\.\+\-\*\/]', stripped):
            result.append(line)
            continue
        if re.match(r'^[\d\-\+\*\/\%\(\[\{"\'\~]', stripped):
            result.append(line)
            continue
        # Italian prose
        if re.match(r'^[A-ZÀÈÉÌÒÙ][a-zàèéìòù]+\s+[a-zàèéìòùA-Z]', stripped):
            indent_str = line[:len(line) - len(line.lstrip())]
            result.append(indent_str + "# " + stripped)
            continue
        result.append(line)
    return "\n".join(result)


def fix_all_unicode(code):
    """Remove ALL non-ASCII control/special characters that break Python."""
    # ␣ (U+2423 OPEN BOX)
    code = code.replace("\u2423", " ")
    # » (U+00BB RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK)
    code = code.replace("\u00BB", ">>")
    # ¯ (U+00AF MACRON)
    code = code.replace("\u00AF", "_")
    # Various dashes
    code = code.replace("\u2013", "-")  # EN DASH
    code = code.replace("\u2014", "-")  # EM DASH
    code = code.replace("\u2018", "'")  # LEFT SINGLE QUOTATION
    code = code.replace("\u2019", "'")  # RIGHT SINGLE QUOTATION
    code = code.replace("\u201C", '"')  # LEFT DOUBLE QUOTATION
    code = code.replace("\u201D", '"')  # RIGHT DOUBLE QUOTATION
    return code


def fix_squashed_docstrings(code):
    """Fix docstrings squashed on the same line as def/class or with code after them.

    Pattern: def foo(): '''doc''' code → split into separate lines
    """
    lines = code.split("\n")
    result = []
    for line in lines:
        stripped = line.strip()
        indent = line[:len(line) - len(line.lstrip())]

        # Pattern: def foo(): """...""" more_code
        # or: """...""" more_code (docstring followed by code)
        m = re.match(r'^((?:def |class )\S.*?:)\s+(""".*?""")\s+(.+)$', stripped)
        if m:
            result.append(indent + m.group(1))
            result.append(indent + "    " + m.group(2))
            result.append(indent + "    " + m.group(3))
            continue

        # Pattern: """...""" code_after
        m = re.match(r'^(""".*?""")\s+(.+)$', stripped)
        if m and not stripped.startswith("#"):
            result.append(indent + m.group(1))
            result.append(indent + m.group(2))
            continue

        result.append(line)
    return "\n".join(result)


def try_fix(code):
    """Try multiple strategies to fix the code."""
    code = fix_pdf_artifacts(code)
    code = rejoin_comment_continuations(code)
    code = convert_markdown_comments(code)

    # Also clean up all unicode early
    code = fix_all_unicode(code)

    # Check if just fixing artifacts is enough
    try:
        ast.parse(finalize_comments(code))
        return finalize_comments(code)
    except SyntaxError:
        pass

    def _cleanup(c):
        """Apply final cleanup to any attempt."""
        c = fix_all_unicode(c)
        return c

    def _base(c):
        return indent_code(split_squashed(fix_squashed_docstrings(c)))

    def _with_truncated(c):
        return fix_truncated_block(_base(c))

    def _with_strings(c):
        return _base(fix_unclosed_strings(c))

    def _with_all_closers(c):
        return fix_truncated_block(_base(
            fix_unclosed_strings(fix_unclosed_brackets(c))))

    def _with_prose(c):
        return fix_truncated_block(_base(
            fix_unclosed_strings(fix_unclosed_brackets(remove_prose_lines(c)))))

    strategies = [
        _base,
        _with_truncated,
        _with_strings,
        _with_all_closers,
        _with_prose,
        _aggressive_split_and_fix,
    ]

    for strategy in strategies:
        try:
            attempt = strategy(code)
            attempt = finalize_comments(attempt)
            attempt = _cleanup(attempt)
            ast.parse(attempt)
            return attempt
        except SyntaxError:
            continue

    # Last resort: try with all unicode fixes applied early
    code2 = fix_all_unicode(code)
    for strategy in strategies:
        try:
            attempt = strategy(code2)
            attempt = finalize_comments(attempt)
            attempt = _cleanup(attempt)
            ast.parse(attempt)
            return attempt
        except SyntaxError:
            continue

    return None


def _aggressive_split_and_fix(code):
    protected, strings = protect_strings(code)
    protected = re.sub(r"(?<=\S) +([a-zA-Z_]\w* = )", r"\n\1", protected)
    protected = re.sub(r"(?<=\)) +([a-zA-Z_]\w*\.)", r"\n\1", protected)
    code2 = restore_strings(protected, strings)
    code2 = fix_unclosed_strings(code2)
    code2 = fix_unclosed_brackets(code2)
    code2 = remove_prose_lines(code2)
    code2 = split_squashed(code2)
    code2 = indent_code(code2)
    code2 = fix_truncated_block(code2)
    return code2


if __name__ == "__main__":
    with open(sys.argv[1]) as f:
        code = f.read()

    try:
        ast.parse(code)
        print(code, end="")
        sys.exit(0)
    except SyntaxError:
        pass

    fixed = try_fix(code)
    if fixed is not None:
        print(fixed, end="")
        sys.exit(0)
    else:
        # Even if we can't fully fix, apply basic cleanup
        cleaned = fix_pdf_artifacts(code)
        cleaned = fix_all_unicode(cleaned)
        cleaned = cleaned.replace("## ", "# ")
        print("CANNOT_FIX: all strategies failed", file=sys.stderr)
        print(cleaned, end="")
        sys.exit(1)

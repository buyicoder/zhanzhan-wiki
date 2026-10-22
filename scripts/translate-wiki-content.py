#!/usr/bin/env python3
"""Create missing English counterparts while preserving Markdown structure."""

from __future__ import annotations

import re
import sys
import json
from pathlib import Path

import argostranslate.translate


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
ENGLISH = CONTENT / "en"
HAN = re.compile(r"[\u3400-\u9fff]")
PROTECTED = re.compile(
    r"(`[^`\n]+`|!?(?:\[[^\]\n]*\])\([^\n)]*\)|\[\[[^\]\n]+\]\]|<[^>\n]+>|https?://\S+|\*\*|__|~~|\*|_)"
)


def get_translation():
    languages = argostranslate.translate.get_installed_languages()
    source = next(language for language in languages if language.code == "zh")
    target = next(language for language in languages if language.code == "en")
    return source.get_translation(target)


TRANSLATION = get_translation()


def translate_plain(text: str) -> str:
    if not HAN.search(text):
        return text
    chunks = re.split(r"(?<=[。！？；])", text)
    output: list[str] = []
    buffer = ""
    for chunk in chunks:
        if len(buffer) + len(chunk) <= 420:
            buffer += chunk
            continue
        if buffer:
            output.append(TRANSLATION.translate(buffer))
        buffer = chunk
    if buffer:
        output.append(TRANSLATION.translate(buffer))
    return " ".join(part.strip() for part in output if part.strip())


def translate_wikilink(token: str) -> str:
    body = token[2:-2]
    target, separator, label = body.partition("|")
    if not target.startswith(("en/", "#", "/", "http://", "https://")):
        target = "en/" + target
    if not separator:
        return f"[[{target}]]"
    return f"[[{target}|{translate_plain(label)}]]"


def adjust_relative_url(url: str) -> str:
    if url.startswith(("/", "#", "http://", "https://", "mailto:", "data:")):
        return url
    return "../" + url


def translate_markdown_link(token: str) -> str:
    if token.startswith("!"):
        prefix, rest = "!", token[1:]
    else:
        prefix, rest = "", token
    match = re.fullmatch(r"\[([^\]]*)\]\((.*)\)", rest)
    if not match:
        return token
    url = adjust_relative_url(match.group(2)) if prefix else match.group(2)
    return f"{prefix}[{translate_plain(match.group(1))}]({url})"


def translate_line(line: str) -> str:
    if not HAN.search(line):
        return line
    syntax_match = re.match(r"^(\s*(?:(?:#{1,6}|>|[-*+]|\d+\.)\s+)+)", line)
    syntax = syntax_match.group(1) if syntax_match else ""
    translatable = line[len(syntax) :]
    def translate_part(token: str) -> str:
        if token.startswith("[["):
            return translate_wikilink(token)
        if re.match(r"!?\[", token):
            return translate_markdown_link(token)
        return token

    translated = "".join(
        translate_part(part) if PROTECTED.fullmatch(part) else translate_plain(part)
        for part in PROTECTED.split(translatable.rstrip("\n"))
    )
    return syntax + translated + ("\n" if line.endswith("\n") else "")


def translate_frontmatter(lines: list[str]) -> tuple[list[str], int]:
    if not lines or lines[0].strip() != "---":
        return ["---\n", "lang: en\n", "---\n"], 0
    end = next((index for index in range(1, len(lines)) if lines[index].strip() == "---"), 0)
    if not end:
        return ["---\n", "lang: en\n", "---\n"], 0
    output = ["---\n"]
    skip_alias_block = False
    has_lang = False
    for line in lines[1:end]:
        key_match = re.match(r"^([A-Za-z_][\w-]*):", line)
        if key_match:
            key = key_match.group(1)
            skip_alias_block = key == "aliases"
            if skip_alias_block:
                continue
            if key == "lang":
                output.append("lang: en\n")
                has_lang = True
                continue
            if key in {"title", "description", "tags", "provenance", "maturity", "content_type"}:
                prefix, value = line.split(":", 1)
                translated = translate_plain(value.strip())
                if key != "tags":
                    translated = json.dumps(translated, ensure_ascii=False)
                output.append(f"{prefix}: {translated}\n")
                continue
        if skip_alias_block and (line.startswith("  ") or line.lstrip().startswith("- ")):
            continue
        skip_alias_block = False
        output.append(line)
    if not has_lang:
        output.append("lang: en\n")
    output.append("---\n")
    return output, end + 1


def translate_file(source: Path, target: Path) -> None:
    lines = source.read_text(encoding="utf-8").splitlines(keepends=True)
    frontmatter, body_start = translate_frontmatter(lines)
    output = list(frontmatter)
    in_fence = False
    for line in lines[body_start:]:
        if re.match(r"^\s*(```|~~~)", line):
            in_fence = not in_fence
            output.append(line)
        elif in_fence:
            output.append(line)
        else:
            output.append(translate_line(line))
    target.parent.mkdir(parents=True, exist_ok=True)
    rendered = "".join(output)
    rendered = re.sub(
        r'(?P<prefix>\bsrc=["\'])(?P<url>[^"\']+)',
        lambda match: match.group("prefix") + adjust_relative_url(match.group("url")),
        rendered,
    )
    target.write_text(rendered, encoding="utf-8")


def main() -> None:
    overwrite = "--overwrite" in sys.argv
    created = 0
    preserved = 0
    for source in sorted(CONTENT.rglob("*.md")):
        if ENGLISH in source.parents:
            continue
        target = ENGLISH / source.relative_to(CONTENT)
        if target.exists() and not overwrite:
            preserved += 1
            continue
        translate_file(source, target)
        created += 1
        print(f"translated {source.relative_to(CONTENT)}")
    print(f"created={created} preserved_reviewed={preserved}")


if __name__ == "__main__":
    main()

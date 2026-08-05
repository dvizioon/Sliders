import { guessFilename, indentLines } from "./utils.js";

const STRING_LITERAL_RE = /"(?:[^"\\]|\\.)*"/g;
const CHAR_LITERAL_RE = /'(?:[^'\\]|\\.)'/g;
const MAIN_METHOD_RE = /(public\s+static\s+void\s+main\s*\([^)]*\)\s*\{)/g;
const UTF8_STDOUT_LINE =
  "    System.setOut(new PrintStream(System.out, true, StandardCharsets.UTF_8));";
const UTF8_IMPORTS = [
  "import java.io.PrintStream;",
  "import java.nio.charset.StandardCharsets;"
];

function escapeNonAsciiInLiteral(match) {
  return match.replace(/[^\x00-\x7F]/g, (ch) => {
    return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

function escapeNonAsciiInJavaLiterals(source) {
  return source
    .replace(STRING_LITERAL_RE, escapeNonAsciiInLiteral)
    .replace(CHAR_LITERAL_RE, escapeNonAsciiInLiteral);
}

function ensureUtf8Imports(source) {
  const missing = UTF8_IMPORTS.filter((line) => !source.includes(line));
  if (!missing.length) return source;

  const packageMatch = source.match(/^\s*package\s+[\w.]+\s*;\s*/);
  if (packageMatch) {
    const insertAt = packageMatch.index + packageMatch[0].length;
    return `${source.slice(0, insertAt)}${missing.join("\n")}\n${source.slice(insertAt)}`;
  }

  return `${missing.join("\n")}\n${source}`;
}

function ensureUtf8Stdout(source) {
  if (!/public\s+static\s+void\s+main\s*\(/.test(source)) return source;
  if (/System\.setOut\(new PrintStream\(System\.out, true, StandardCharsets\.UTF_8\)\)/.test(source)) {
    return source;
  }

  return source.replace(MAIN_METHOD_RE, `$1\n${UTF8_STDOUT_LINE}`);
}

function finalizeJavaForPiston(result) {
  let content = escapeNonAsciiInJavaLiterals(String(result.content).trim());
  content = ensureUtf8Imports(content);
  content = ensureUtf8Stdout(content);
  return { file: result.file, content };
}

export function prepareJavaForPiston(displayCode, runEntry) {
  const explicit = runEntry && runEntry.code;
  const filename = (runEntry && runEntry.entryFile) || guessFilename(displayCode, null);
  if (explicit) {
    return finalizeJavaForPiston({
      file: guessFilename(explicit, filename),
      content: explicit.trim()
    });
  }

  const file = guessFilename(displayCode, filename);
  const mainClass = file.replace(/\.java$/i, "");
  const src = String(displayCode).trim();

  if (!/\bclass\s+\w+/.test(src)) {
    return finalizeJavaForPiston({
      file,
      content: `public class ${mainClass} {\n  public static void main(String[] args) {\n${indentLines(src, 4)}\n  }\n}`
    });
  }

  const classStart = src.search(/(?:public\s+)?class\s+\w+/);
  let depth = 0;
  let started = false;
  let classEnd = -1;

  for (let i = classStart; i < src.length; i++) {
    if (src[i] === "{") {
      depth++;
      started = true;
    }
    if (src[i] === "}") {
      depth--;
      if (started && depth === 0) {
        classEnd = i + 1;
        break;
      }
    }
  }

  const classBlock = src.slice(classStart, classEnd);
  const afterClass = src.slice(classEnd).trim();
  const classNameMatch = classBlock.match(/(?:public\s+)?class\s+(\w+)/);
  const className = classNameMatch ? classNameMatch[1] : mainClass;
  const targetFile = `${className}.java`;
  const hasMain = /public\s+static\s+void\s+main\s*\(/.test(classBlock);

  if (afterClass) {
    const mainMethod = `  public static void main(String[] args) {\n${indentLines(afterClass, 4)}\n  }`;
    if (hasMain) {
      return finalizeJavaForPiston({
        file: targetFile,
        content: `${classBlock}\n\npublic class Main {\n${mainMethod}\n}`
      });
    }
    return finalizeJavaForPiston({
      file: targetFile,
      content: classBlock.replace(/\}\s*$/, `\n\n${mainMethod}\n}`)
    });
  }

  if (!hasMain) {
    const mainMethod =
      "  public static void main(String[] args) {\n    System.out.println(\"Programa executado.\");\n  }";
    return finalizeJavaForPiston({
      file: targetFile,
      content: classBlock.replace(/\}\s*$/, `\n\n${mainMethod}\n}`)
    });
  }

  return finalizeJavaForPiston({ file: targetFile, content: src });
}

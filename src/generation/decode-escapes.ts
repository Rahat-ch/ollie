/**
 * A model sometimes leaves JSON escape sequences in the text it returns
 * through structured output: a literal `—` where an em-dash was meant,
 * `\"` around a quoted word, `\n` for a line break. Left as they are, the
 * validators read "2014" as a number the Session Log does not support and
 * a Parent reads a backslash. This decodes them once, at the seam, before
 * any check runs. Every string in the output is decoded; nothing else is
 * touched.
 */
const ESCAPE = /\\(u[0-9a-fA-F]{4}|["\\/nrt])/g;

const SIMPLE: Readonly<Record<string, string>> = { '"': '"', "\\": "\\", "/": "/", n: "\n", r: "\r", t: "\t" };

export function decodeEscapes(text: string): string {
  return text.replace(ESCAPE, (_, code: string) =>
    code.startsWith("u") ? String.fromCharCode(parseInt(code.slice(1), 16)) : SIMPLE[code],
  );
}

/** `decodeEscapes` over every string inside a parsed output, however nested. */
export function decodeStrings<T>(value: T): T {
  if (typeof value === "string") return decodeEscapes(value) as T;
  if (Array.isArray(value)) return value.map(decodeStrings) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decodeStrings(v)])) as T;
  }
  return value;
}

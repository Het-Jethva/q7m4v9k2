import { readFileSync } from "node:fs";

const target =
  process.argv[2] ?? new URL("../frontend/main.tsx", import.meta.url);
const source = readFileSync(target, "utf8");
const rawControls = [
  ...source.matchAll(
    /<(button|input|select|textarea|table|thead|tbody|tr|th|td|details|summary|label)(?=[\s>])/g,
  ),
];
if (rawControls.length > 0) {
  for (const match of rawControls) {
    const line = source.slice(0, match.index).split("\n").length;
    console.error(
      `frontend/main.tsx:${line}: Replace <${match[1]}> with the matching shadcn/ui component.`,
    );
  }
  process.exitCode = 1;
}
const styles = readFileSync(
  process.argv[3] ?? new URL("../frontend/styles.css", import.meta.url),
  "utf8",
);
const customSelectors = [...styles.matchAll(/^\s*([^@{};]+)\s*\{/gm)]
  .map((match) => match[1].trim())
  .filter(
    (selector) => ![":root", ".dark", "*", "body", "html"].includes(selector),
  );
if (customSelectors.length > 0) {
  console.error(
    `Use shadcn variants and Tailwind layout utilities instead of custom CSS selectors: ${customSelectors.join(", ")}`,
  );
  process.exitCode = 1;
}
if (
  /style=|document\.createElement|\.style\.|import ["'].*\.css["']/.test(
    source.replace('import "./styles.css";', ""),
  )
) {
  console.error(
    "Keep application styling in the shadcn theme and Tailwind utilities; remove inline styles, DOM animation, and extra stylesheets.",
  );
  process.exitCode = 1;
}
if (!process.exitCode)
  console.log(
    "UI uses shadcn components, preset tokens, and Tailwind layout utilities.",
  );

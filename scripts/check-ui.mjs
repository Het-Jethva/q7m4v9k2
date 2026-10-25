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
} else {
  console.log("UI controls use shadcn/ui components.");
}

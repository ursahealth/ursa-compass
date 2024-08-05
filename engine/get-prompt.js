import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export default async function getPrompt(stageName, promptTitle, params = {}) {
  // support ESM and CJS
  const dirname =
    typeof import.meta !== "undefined" ? path.dirname(fileURLToPath(import.meta.url)) : __dirname;
  const fullText = await readFile(path.resolve(dirname, `../prompts/${stageName}.txt`), "utf-8");

  let segment;
  if (promptTitle) {
    const segments = fullText.split("## ");
    segment = segments
      .find((segment) => segment.startsWith(promptTitle))
      ?.substring(promptTitle.length);
    if (!segment) {
      console.error("Cannot find segment with title", promptTitle);
    }
  } else {
    segment = fullText;
  }

  let text = segment;
  Object.keys(params).forEach((key) => {
    text = text.replaceAll(
      `{{${key}}}`,
      typeof params[key] === "string" ? params[key] : JSON.stringify(params[key])
    );
  });
  return text;
}

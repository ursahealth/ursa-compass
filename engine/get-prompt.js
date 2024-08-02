import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export default async function getPrompt(stageName, promptTitle, params = {}) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fullText = await readFile(path.resolve(__dirname, `prompts/${stageName}.txt`), "utf-8");
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

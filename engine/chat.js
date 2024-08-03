import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import getPrompt from "./get-prompt.js";
import getTableDescriptions from "./get-table-descriptions.js";
import handleChat from "./handler.js";
import * as landingTables from "./prompts/landing-tables.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function chat(tableName, type, inputText, options) {
  let assertions;
  try {
    console.log(path.resolve(__dirname, `assertions/${tableName}.txt`))
    assertions = await readFile(path.resolve(__dirname, `assertions/${tableName}.txt`), "utf-8");
  } catch (error) {
    assertions = "<actually no assertions exist>";
  }

  const preamblePrompt = await getPrompt("chat", "PREAMBLE", {
    tableName,
    assertions,
  });

  const formattingDirectionsPrompt = await getPrompt("chat", type.toUpperCase(), {
    tableDescriptions: getTableDescriptions(landingTables[type]),
    question: inputText,
  });

  let prompt = `${preamblePrompt}\n\n${formattingDirectionsPrompt}`;
  for (let i = 0; i < 100; i++) {
    let response = await handleChat(prompt, options);
    if (response.responseType === "ASSERTION") {
      options.sendMessage(`\n${response.text}`);
    } else {
      options.sendMessage(response.text);
    }

    let message =
      response.responseType === "ASSERTION"
        ? 'Do you accept this assertion? If yes, type "yes". If not, explain your qualm: '
        : "What is your response? ";
    const input = await options.promptUser(message);

    if (
      response.responseType === "ASSERTION" &&
      (input.toLowerCase() === "yes" || input.toLowerCase() === "y")
    ) {
      break;
    }
    prompt = input;
  }
}

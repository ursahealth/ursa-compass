import _ from "lodash";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import getPrompt from "./get-prompt.js";
import getTableDescriptions from "./get-table-descriptions.js";
import handleChat from "./handler.js";
import query from "./query.js";
import * as landingTables from "./landing-tables.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function clean(tableName, type, options) {
  let assertions;
  try {
    assertions = await readFile(path.resolve(__dirname, `assertions/${tableName}.txt`), "utf-8");
  } catch (error) {
    options.sendMessage('Please run "investigate" on this table first.');
    return;
  }

  const preamblePrompt = await getPrompt("clean", "PREAMBLE", options, {
    tableName,
    assertions,
  });

  const formattingDirectionsPrompt = await getPrompt("clean", type.toUpperCase(), options, {
    tableDescriptions: getTableDescriptions(landingTables[type]),
  });

  let prompt;
  for (let tableIndex = 0; tableIndex < landingTables[type].length; tableIndex++) {
    const tableSpec = landingTables[type][tableIndex];
    const destinationColumns = tableSpec.columns;
    const destinationChunks = _.chunk(destinationColumns, 20);

    for (let chunkIndex = 0; chunkIndex < destinationChunks.length; chunkIndex++) {
      const formattedColumns = destinationChunks[chunkIndex]
        .map((field) => ` - ${field.column} [${field.dataType}] ${field.description}`)
        .join("\n");
      const startMessage =
        chunkIndex === 0
          ? "Let's work out a strategy of how we might populate each column in the " +
            `${tableSpec.table} table, ` +
            `starting with the first batch of columns:\n\n${formattedColumns}\n\n`
          : `The next batch of columns to work through is:\n\n${formattedColumns}`;
      options.sendMessage(startMessage);
      const promptTitle =
        chunkIndex === 0
          ? "FIRST DESTINATION COLUMN STRATEGY"
          : "SUBSEQUENT DESTINATION COLUMN STRATEGY";
      prompt = await getPrompt("clean", promptTitle, options, {
        tableName,
        destinationTable: tableSpec.table,
        destinationTableDescription: tableSpec.description,
        formattedColumns,
      });
      if (tableIndex === 0 && chunkIndex === 0) {
        prompt = `${preamblePrompt}\n\n${formattingDirectionsPrompt}\n\n${prompt}`;
      }
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
  }

  const initialDataResult = await query(`SELECT * FROM ${tableName} LIMIT 1`, options);
  const allColumns = Object.keys(initialDataResult[0]);
  const columnChunks = _.chunk(allColumns, 20);

  const sqlChunks = [];
  for (let chunkIndex = 0; chunkIndex < columnChunks.length; chunkIndex++) {
    const formattedColumnNames = columnChunks[chunkIndex].join(", ");
    const startMessage =
      chunkIndex === 0
        ? "Now we turn our focus to the source table; we'll work out a strategy of what to do " +
          "with each column of the source table, " +
          `starting with the first batch of columns:\n\n${formattedColumnNames}\n\n`
        : `The next batch of columns to work through is:\n\n${formattedColumnNames}`;
    options.sendMessage(startMessage);
    const promptTitle =
      chunkIndex === 0 ? "FIRST SOURCE COLUMN STRATEGY" : "SUBSEQUENT SOURCE COLUMN STRATEGY";
    prompt = await getPrompt("clean", promptTitle, options, {
      tableName,
      columns: columnChunks[chunkIndex].join("\n"),
    });
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

    const sqlPromptTitle = chunkIndex === 0 ? "FIRST GENERATE SQL" : "SUBSEQUENT GENERATE SQL";
    prompt = await getPrompt("clean", sqlPromptTitle, options, {
      tableName,
      columns: columnChunks[chunkIndex].join("\n"),
    });
    for (let i = 0; i < 100; i++) {
      let response = await handleChat(
        prompt,
        Object.assign({}, options, { isCleaningChunk: true, tableName })
      );
      options.sendMessage(response.text);

      let message =
        response.responseType === "CLEANING_SQL"
          ? 'Do you accept this sql? If yes, type "yes". If not, explain your qualm: '
          : "What is your response? ";
      const input = await options.promptUser(message);

      if (
        response.responseType === "CLEANING_SQL" &&
        (input.toLowerCase() === "yes" || input.toLowerCase() === "y")
      ) {
        let strippedChunk = response.sql.replace(/SELECT\n/, "");
        strippedChunk = strippedChunk.replace(/\nFROM .*/, "");
        strippedChunk = strippedChunk.replace(/\nLIMIT 1/, "");
        strippedChunk = _.trim(strippedChunk);
        if (!_.endsWith(strippedChunk, ",")) {
          strippedChunk += ",";
        }
        sqlChunks.push(strippedChunk);
        break;
      }
      prompt = input;
    }
  }

  let selectClause = _.trim(sqlChunks.join("\n"));
  if (_.endsWith(selectClause, ",")) {  
    // Remove trailing comma
    selectClause = selectClause.slice(0, -1);
  }

  const ctasSql = `CREATE TABLE ${tableName}_clean AS\nSELECT\n${selectClause}\nFROM ${tableName}`;
  options.sendMessage(`Full CTAS SQL is as follows: \n\`\`\`\n${ctasSql}\n\`\`\``);
}

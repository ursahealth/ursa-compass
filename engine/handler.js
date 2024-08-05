import _ from "lodash";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import query from "./query.js";

const bedrockClient = new BedrockRuntimeClient({});

/*
  Check the first row of the response for keywords
*/
function getResponseType(response) {
  const firstRows = _.take(response.split("\n"), 4).join("\n");
  if (firstRows.includes("QUERY_DATABASE")) {
    return "QUERY_DATABASE";
  } else if (firstRows.includes("ASSERTION")) {
    return "ASSERTION";
  } else if (firstRows.includes("PROVIDE_CTAS_SQL")) {
    return "PROVIDE_CTAS_SQL";
  } else if (firstRows.includes("ASK_USER")) {
    return "ASK_USER";
  }
  return "NONE";
}

function extractCodeBlock(text) {
  if (text === null || !_.includes(text, "```")) {
    return text;
  }
  const codeResponseLines = text.split("\n");
  const codeStartLine = _.find(codeResponseLines, (line) => _.startsWith(line, "```"));
  const codeEndLine = _.findLast(codeResponseLines, (line) => _.startsWith(line, "```"));
  if (codeStartLine && codeEndLine) {
    const codeStartIndex = codeResponseLines.indexOf(codeStartLine);
    const codeEndIndex = codeResponseLines.lastIndexOf(codeEndLine);
    const codeLines = codeResponseLines.slice(codeStartIndex + 1, codeEndIndex);
    return codeLines.join("\n");
  }
  return text;
}

async function queryAI(conversation, options = {}) {
  const params = {
    body: JSON.stringify({
      messages: conversation,
      max_tokens: 1000, // TODO: increase probably
      temperature: options.temperature || options.temperature === 0 ? options.temperature : 0.5,
      anthropic_version: "bedrock-2023-05-31",
    }),
    contentType: "application/json",
    accept: "application/json",
    modelId: options?.modelId || "anthropic.claude-3-5-sonnet-20240620-v1:0",
  };

  const command = new InvokeModelCommand(params);
  const response = await bedrockClient.send(command);
  if (!response.body) {
    throw new Error("No response body from AI model.");
  }
  const decoder = new TextDecoder(); // Default is 'utf-8'
  const responseJSON = JSON.parse(decoder.decode(response.body));
  return responseJSON.content[0].text;
}

const conversation = [];
function addToConversation(role, content, options) {
  conversation.push({ role, content });
  options.log(conversation);
}

async function trySql(response, options) {
  let result;
  let sql;
  for (let i = 0; i < 5; i++) {
    sql = extractCodeBlock(response);
    if (options.isCleaningChunk && !_.startsWith(sql.toLowerCase(), "select")) {
      sql = `SELECT\n${sql}\nFROM ${options.tableName}\nLIMIT 1`;
    }
    try {
      result = await query(sql, options);
      options.sendMessage(response); // if the SQL runs, send the full message with annotations
      if (options.sendQuery) {
        options.sendQuery(sql, result);
      } else {
        options.sendMessage({ sql, result }, "query");
      }
      if (options.isCleaningChunk) {
        return { annotatedSql: response, sql, result };
      }
      break;
    } catch (sqlError) {
      conversation.push({
        role: "user",
        content:
          `That query failed with \n${sqlError.message}\n\nCan you try again? ` +
          "I'm not going to display your previous message to the user, so please do not " +
          "start your next message with an apology. Just respond as if you had responded " +
          "the first time, but fix the SQL.",
      });
      response = await queryAI(conversation, options);
      addToConversation("assistant", response, options);
    }
  }
  return { annotatedSql: response, sql, result };
}

export default async function handler(text, options) {
  addToConversation("user", text, options);

  for (let i = 0; i < 20; i++) {
    let response = await queryAI(conversation, options);
    addToConversation("assistant", response, options);

    const responseType = getResponseType(response);
    if (options.isCleaningChunk) {
      const { annotatedSql, sql } = await trySql(response, options);
      return { responseType: "CLEANING_SQL", text: annotatedSql, sql };
    } else if (responseType === "NONE") {
      addToConversation(
        "user",
        "I'm unable to parse your response. Could you restate it? " +
          "Please make sure to start your reponse with one of the allowable keywords.",
        options
      );
    } else if (responseType === "QUERY_DATABASE") {
      const { result } = await trySql(response, options);
      addToConversation(
        "user",
        `Result is: \n\`\`\`\n${JSON.stringify(result)}\n\`\`\``,
        options
      );
    } else {
      return { responseType, text: response };
    }
  }
  throw new Error("Too many requests for SQL!");
}

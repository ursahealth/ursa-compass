import _ from "lodash";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClients = {};

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
  } else if (firstRows.includes("LESSONS_LEARNED")) {
    return "LESSONS_LEARNED";
  } else if (firstRows.includes("ALL_DONE")) {
    return "ALL_DONE";
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

async function queryAI(messages, options = {}) {
  const params = {
    body: JSON.stringify({
      messages: messages.map((message) =>
        message.role === "compass" ? { role: "user", content: message.content } : message
      ),
      max_tokens: 1000, // TODO: increase probably
      temperature: options.temperature || options.temperature === 0 ? options.temperature : 0.5,
      anthropic_version: "bedrock-2023-05-31",
    }),
    contentType: "application/json",
    accept: "application/json",
    // "us.anthropic.claude-sonnet-4-20250514-v1:0"
    modelId: options?.modelId || "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
  };

  const command = new InvokeModelCommand(params);

  if (!bedrockClients[options.region || "default"]) {
    bedrockClients[options.region || "default"] = new BedrockRuntimeClient(
      options.region ? { region: options.region } : {}
    );
  }

  const response = await bedrockClients[options.region || "default"].send(command);
  if (!response.body) {
    throw new Error("No response body from AI model.");
  }
  const decoder = new TextDecoder(); // Default is 'utf-8'
  const responseJSON = JSON.parse(decoder.decode(response.body));
  return responseJSON.content[0].text;
}

export default async function handler(payload, options) {
  let { messages } = payload;
  function addToMessages(role, content, options) {
    messages = messages.concat([{ role, content }]);
    options.sendMessages(messages);
  }

  async function trySql(response, options) {
    let result;
    let sql;
    for (let i = 0; i < 5; i++) {
      sql = extractCodeBlock(response);
      try {
        result = await options.query(sql, options);
        options.sendEvidence({ sql, result });
        break;
      } catch (sqlError) {
        messages.push({
          role: "compass",
          content:
            `That query failed with \n${sqlError.message}\n\nCan you try again? ` +
            "I'm not going to display your previous message to the user, so please do not " +
            "start your next message with an apology. Just respond as if you had responded " +
            "the first time, but fix the SQL.",
        });
        response = await queryAI(messages, options);
        addToMessages("assistant", response, options);
      }
    }
    return { annotatedSql: response, sql, result };
  }

  for (let i = 0; i < 20; i++) {
    let response = await queryAI(messages, options);
    addToMessages("assistant", response, options);

    const responseType = getResponseType(response);
    if (responseType === "NONE") {
      addToMessages(
        "compass",
        "I'm unable to parse your response. Could you restate it? " +
          "Please make sure to start your reponse with one of the allowable keywords.",
        options
      );
    } else if (responseType === "QUERY_DATABASE") {
      const { result } = await trySql(response, options);
      addToMessages("compass", `Result is: \n\`\`\`\n${JSON.stringify(result)}\n\`\`\``, options);
    } else {
      return { responseType, text: response };
    }
  }
  throw new Error("Too many requests for SQL!");
}

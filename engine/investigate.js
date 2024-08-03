import getPrompt from "./get-prompt.js";
import handleChat from "./handler.js";
import query from "./query.js";

const assertions = [];

async function getAssertion(tableName, tableDocumentation, question, questionIndex, options) {
  const queries = [];
  let initialData;
  if (questionIndex === 0) {
    const initialDataSql = `SELECT *\nFROM ${tableName}\nLIMIT 3`;
    let initialDataResult;
    try {
      initialDataResult = await query(initialDataSql);
    } catch (err) {
      options.sendMessage("Error fetching initial data, does this table exist?");
      throw err;
    }
    options.sendMessage(`We'll be determining the answer to the question: ${question}`);
    initialData = initialDataResult.rows;
    options.sendMessage({ sql: initialDataSql, result: initialData }, "query");
    queries.push({ sql: initialDataSql, result: initialDataResult.rows });
  } else {
    options.sendMessage(`We'll be determining the answer to the question: ${question}`);
  }
  options = Object.assign(options, {
    sendQuery: (sql, result) => {
      queries.push({ sql, result });
      options.sendMessage({ sql, result }, "query");
    },
  });
  const segmentTitle = questionIndex === 0 ? "FIRST PREAMBLE" : "SUBSEQUENT PREAMBLE";
  const params = {
    tableName,
    tableDocumentation,
    question,
    initialData,
  };
  let prompt = await getPrompt("investigate", segmentTitle, params);
  for (let i = 0; i < 100; i++) {
    let response = await handleChat(prompt, options);
    if (response.responseType === "ASSERTION") {
      options.sendMessage(`\nQUESTION: ${question}\n${response.text}`);
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
      options.sendMessage("Great! I'm glad you agree.");
      assertions.push(
        "QUESTION",
        question,
        "QUERIES",
        ...queries.map(
          (query) =>
            `\`\`\`\n${query.sql}\n\`\`\`\n\n\`\`\`\n${JSON.stringify(query.result)}\n\`\`\``
        ),
        response.text,
        "-----------------"
      );
      break;
    }
    prompt = input;
  }
}

export default async function investigate(tableName, tableDocumentation, options) {
  const questionText = await getPrompt("investigate", "QUESTIONS");
  const questions = questionText.split("\n*****");
  for (let i = 0; i < questions.length; i++) {
    await getAssertion(tableName, tableDocumentation, questions[i], i, options);
  }
  options.memorializeAssertions(assertions);
}

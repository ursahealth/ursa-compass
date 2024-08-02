#!/usr/bin/env node

import _ from "lodash";
import fs from "fs";
import dotenv from "dotenv";
import readline from "readline";
import investigate from "./investigate.js";
import clean from "./clean.js";

dotenv.config({ override: true });

function renderTable(data) {
  const columnWidths = _.map(_.range(_.first(data).length), (index) =>
    _.max(_.map(data, (row) => row[index].length))
  );
  const formatRow = (row) =>
    `| ${_.map(row, (cell, index) => _.padEnd(cell, columnWidths[index])).join(" | ")} |`;
  const rows = _.map(data, formatRow);
  const separator = `+${_.map(columnWidths, (width) => "-".repeat(width + 2)).join("+")}+`;
  return [separator, ...rows, separator].join("\n");
}

(async () => {
  const args = process.argv.slice(2); // Ignore the first two elements
  const [action, param] = args;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // Close the interface when the user decides to exit
  rl.on("close", () => {
    process.exit(0);
  });

    const options = {
      end: () => {
        rl.close();
      },
      log: (contents) => {
        const contentsText = contents.map(item => `[${item.role}] ${item.content}`).join("\n");
        fs.writeFileSync("./out.log", contentsText, "utf8");
      },
      promptUser: (message) => {
        return new Promise((resolve) => {
          rl.question(message, resolve);
        });
      },
      memorializeAssertions: (assertions) => {
        const filename = `./assertions/${param}.txt`;
        fs.writeFileSync(filename, assertions.join("\n\n"), "utf8");
        console.log(`These assertions have been memorialized in ${filename}`);
      },
      sendMessage: (contents, type) => {
        if (type === "table") {
          console.log(renderTable(contents));
          return;
        }
        console.log(contents); 
      }
    };

  if (action === "investigate") {
    await investigate(param, options);
  } else if (action === "clean") {
    await clean(param, options);
  } else {
    console.log("Unknown action", action);
    process.exit(1);
  }
})();

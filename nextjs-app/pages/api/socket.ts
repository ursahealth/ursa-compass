import type { NextApiRequest, NextApiResponse } from "next";
import { Server, Socket } from "socket.io";
import { Socket as NetSocket } from "net";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import chat from "../../../engine/chat";
import clean from "../../../engine/clean";
import investigate from "../../../engine/investigate";

type EnhancedSocket = NetSocket & { server: { io?: Server } };

function waitForSocketResponse(socket: Socket, eventName: string): Promise<{ text: string }> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      socket.off(eventName, onResponse); // Remove listener to prevent memory leaks
      socket.off("disconnect", onDisconnect);
    }, 60 * 60 * 1000); // 1 hour timeout for example

    const onResponse = (data: { text: string }) => {
      clearTimeout(timeoutId);
      socket.off("disconnect", onDisconnect);
      resolve(data);
    };

    const onDisconnect = () => {
      clearTimeout(timeoutId);
      socket.off(eventName, onResponse);
    };

    socket.once(eventName, onResponse);
    socket.once("disconnect", onDisconnect);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as EnhancedSocket | null;

  if (!socket || !socket.server) {
    console.error("Socket or server is undefined");
    res.status(500).send("Server error");
    return;
  }

  if (socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new Server(socket.server as any);
    socket.server.io = io;

    io.on("connection", (socket) => {
      let messageID = 1;
      const commonOptions = {
        databaseType: process.env.DATABASE_TYPE,
        log: (contents: string) => {
          socket.emit("log", contents);
        },
        promptUser: async (message: string) => {
          socket.emit("requestResponse", {
            messageID: messageID,
            text: message,
          });
          const userData = await waitForSocketResponse(socket, `userResponse${messageID}`);
          messageID++;
          return userData.text;
        },
        sendMessage: (message: string, type: string) => {
          socket.emit(type || "message", { text: message });
        },
      };

      socket.on("chat", async (content) => {
        try {
          await chat(content.tableName, content.type, content.inputText, commonOptions);
        } catch (err) {
          console.error(err);
          socket.emit("message", { text: "Sorry, I ran into an error" });
        }

        socket.emit("message", { text: "Work on this file is complete" });
        socket.emit("finished");
      });

      socket.on("clean", async (content) => {
        try {
          await clean(content.tableName, content.type, commonOptions);
        } catch (err) {
          console.error(err);
          socket.emit("message", { text: "Sorry, I ran into an error" });
        }

        socket.emit("message", { text: "Work on this file is complete" });
        socket.emit("finished");
      });
      
      socket.on("investigate", async (content) => {
        const options = Object.assign({}, commonOptions, {
          memorializeAssertions: (assertions: Array<string>) => {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filename = path.resolve(
              __dirname,
              `../../../engine/assertions/${content.tableName}.txt`,
            );
            writeFile(filename, assertions.join("\n\n"), "utf8").then(() => {
              console.log(`Assertions have been written to ${filename}`);
            }, console.error);
          },
        });
        try {
          await investigate(content.tableName, content.tableDocumentation, options);
        } catch (err) {
          console.error(err);
          socket.emit("message", { text: "Sorry, I ran into an error" });
        }
        socket.emit("message", { text: "Investigation of this file is complete" });
        socket.emit("finished");
      });
    });
  }
  res.end();
}

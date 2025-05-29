import type { NextApiRequest, NextApiResponse } from "next";
import { Server, Socket } from "socket.io";
import { Socket as NetSocket } from "net";
import handleCheck from "../../../../engine/handler";

type EnhancedSocket = NetSocket & { server: { io?: Server } };

type Report = {
  messages: Array<{ role: string; content: string }>;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as EnhancedSocket | null;

  if (!socket || !socket.server) {
    console.error("Socket or server is undefined");
    res.status(500).send("Server error");
    return;
  }

  if (socket.server.io) {
    console.log("Socket is already running");
    socket.emit("log", { text: "Connection is ready" });
  } else {
    console.log("Socket is initializing");
    const io = new Server(socket.server as any);
    socket.server.io = io;

    io.on("connection", (socket) => {
      socket.emit("log", { text: "Connection is ready" });

      socket.on("start-check", async (content) => {
        console.log("got check request", content);
        // socket.emit("log", content);
        // TODO
      });

      socket.on("inspection-check", async (content) => {
        const keys = {
          sessionId: content.sessionId,
          stepKey: content.stepKey,
          checkKey: content.checkKey,
        };

        console.log("received inspection check request", keys);
        try {
          await handleCheck(content, {
            databaseType: "postgres", // TODO: make user-editable
            sendMessages: (payload: Array<{ content: string; role: string }>) => {
              socket.emit("update", "messages", keys, payload);
            },
            sendEvidence: (evidence: { sql: string; results: any }) => {
              socket.emit("update", "evidence", keys, evidence);
            },
          });
        } catch (err) {
          console.error(err);
          socket.emit("message", { text: "Sorry, I ran into an error" });
        }
        console.log("finished inspection check request", keys);
      });
    });
  }
  res.end();
}

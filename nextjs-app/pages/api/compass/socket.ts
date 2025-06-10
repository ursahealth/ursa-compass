import type { NextApiRequest, NextApiResponse } from "next";
import { Server, Socket } from "socket.io";
import { Socket as NetSocket } from "net";
import query from "@/app/lib/query";
import handleCheck from "../../../../engine/handler";

type EnhancedSocket = NetSocket & { server: { io?: Server } };

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

      socket.on("inspection-check", async (content) => {
        const keys = {
          sessionId: content.sessionId,
          stepKey: content.stepKey,
          checkKey: content.checkKey,
        };

        try {
          await handleCheck(content, {
            databaseType: "postgres", // TODO: make user-editable
            sendMessages: (payload: Array<{ content: string; role: string }>) => {
              socket.emit("update", "messages", keys, payload);
            },
            sendEvidence: (evidence: { sql: string; results: any }) => {
              socket.emit("update", "evidence", keys, evidence);
            },
            query
          });
        } catch (err: any) {
          console.error(err);
          socket.emit("log", { text: err.message });
        }
      });
    });
  }
  res.end();
}

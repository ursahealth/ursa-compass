"use client";

import { useState } from "react";
import { io, Socket } from "socket.io-client";
import { InterrogationWorkspace } from "../../../ui/esm";

let socket: Socket;

export default function Page({}: {}) {
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);

  const socketInitializer = async () => {
    await fetch("/api/compass/socket");
    socket = io();
    setIsSocketInitialized(true);
  };

  return (
    <InterrogationWorkspace
      isSocketInitialized={isSocketInitialized}
      socket={socket}
      socketInitializer={socketInitializer}
    />
  );
}

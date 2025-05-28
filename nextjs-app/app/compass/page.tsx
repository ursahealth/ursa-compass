"use client";

import { useState } from "react";
import { io, Socket } from "socket.io-client";
import { InspectionWorkspace } from "../../../ui/esm";

let socket: Socket;

export default function Page({}: {}) {
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);

  const socketInitializer = async () => {
    await fetch("/api/compass/socket");
    socket = io();
    setIsSocketInitialized(true);
  };

  return (
    <InspectionWorkspace
      isSocketInitialized={isSocketInitialized}
      socket={socket}
      socketInitializer={socketInitializer}
    />
  );
}

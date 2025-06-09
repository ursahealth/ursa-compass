"use client";

import { useState } from "react";
import { io, Socket } from "socket.io-client";
import { InspectionWorkspace } from "../../../ui/esm";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  LockClosedIcon,
  SparklesIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

let socket: Socket;

const iconSet = {
  Check: <CheckCircleIcon style={{ display: "inline", marginRight: 3, width: 15 }} />,
  Computer: <ComputerDesktopIcon />,
  Error: <ExclamationTriangleIcon style={{ display: "inline", marginRight: 3, width: 15 }} />,
  Lock: <LockClosedIcon style={{ display: "inline", marginRight: 3, width: 15 }} />,
  Prompt: <InboxIcon style={{ display: "inline", marginRight: 3, width: 15 }} />,
  Sparkles: <SparklesIcon />,
  Underway: <ArrowPathIcon style={{ display: "inline", marginRight: 3, width: 15 }} />,
  User: <UserIcon />,
};

export default function Page({}: {}) {
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);

  const socketInitializer = async () => {
    await fetch("/api/compass/socket");
    socket = io();
    setIsSocketInitialized(true);
  };

  return (
    <InspectionWorkspace
      iconSet={iconSet}
      isSocketInitialized={isSocketInitialized}
      socket={socket}
      socketInitializer={socketInitializer}
    />
  );
}

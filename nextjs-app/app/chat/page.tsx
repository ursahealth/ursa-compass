"use client";

import _ from "lodash";
import {
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  CircleStackIcon,
  EllipsisHorizontalIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { io, Socket } from "socket.io-client";

import { useEffect, useRef, useState } from "react";
import ChatContent from "../ui/chat/chat-content";

let socket: Socket;

export default function Page({}: {}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [chatHistory, setChatHistory] = useState<
    Array<{
      type?: string;
      text?: string;
      query?: { sql: string; result: Array<{ [key: string]: any }> };
      isUser: boolean;
    }>
  >([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [tableName, setTableName] = useState<string>("");
  const [actionType, setActionType] = useState<string>("investigate:claims");
  const [tableDocumentation, setTableDocumentation] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [isUnderway, setIsUnderway] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [messageID, setMessageID] = useState<number>(0);
  const [log, setLog] = useState<Array<{ role: string; content: string }>>([]);
  const [showLogBar, setShowLogBar] = useState<boolean>(false);

  const handleStartClick = function () {
    if (_.startsWith(actionType, "investigate:")) {
      const [action, type] = actionType.split(":");
      socket.emit(action, { tableDocumentation, tableName, type });
    } else if (actionType === "chat:membership") {
      const [action, type] = actionType.split(":");
      socket.emit(action, { inputText, tableName, type });
      setChatHistory((chatHistory) => {
        return chatHistory.concat([{ isUser: true, text: inputText }]);
      });
      setInputText("");
    } else {
      const [action, type] = actionType.split(":");
      socket.emit(action, { tableName, type });
    }

    setIsUnderway(true);
  };

  const handleInputClick = function () {
    handleMessage(inputText);
    setInputText("");
  };

  const handleInputKeyUp = function (event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleInputClick();
    }
  };

  const handleMessage = function (message: string) {
    setChatHistory((chatHistory) => {
      return chatHistory.concat([{ isUser: true, text: message }]);
    });
    if (messageID > 0) {
      socket.emit(`userResponse${messageID}`, { text: message });
      setIsUnderway(true);
    } else {
      console.log("should not happen");
      console.trace();
    }
  };

  useEffect(() => {
    if (!isUnderway && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isUnderway]);

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch("/api/socket");
      socket = io();

      socket.on("connect", () => {
        console.log("Socket connected to server");
        setIsConnected(true);
      });
      socket.on("log", (incomingLog) => {
        setLog(incomingLog);
      });
      socket.on("message", (message) => {
        setChatHistory((chatHistory) => {
          return chatHistory.concat([{ isUser: false, text: message.text }]);
        });
      });
      socket.on("query", (message) => {
        setChatHistory((chatHistory) => {
          return chatHistory.concat([{ isUser: false, type: "query", query: message.text }]);
        });
      });
      socket.on("requestResponse", (message) => {
        setChatHistory((chatHistory) => {
          return chatHistory.concat([{ isUser: false, text: message.text }]);
        });
        setIsUnderway(false);
        setMessageID(message.messageID);
      });
      socket.on("finished", () => {
        setIsFinished(true);
        setIsUnderway(false);
      });
    };
    socketInitializer();
  }, []);

  useEffect(() => {
    if (!showLogBar && inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showLogBar, chatHistory]);

  return (
    <div className="flex h-full w-full flex-row justify-between">
      <div className="flex h-full w-full flex-1 flex-col justify-between">
        {_.isEmpty(chatHistory) && !isUnderway ? (
          <div className="flex flex-1 flex-col items-center pt-20">
            <div className="mb-4 flex items-center">
              <SparklesIcon className="mr-2 h-10 w-10 text-gray-500" />
              Ursa Copilot
            </div>
            <div className="flex w-2/3 flex-col items-center bg-gray-200 px-20 py-8">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2 placeholder:text-gray-500"
                placeholder="Enter table name"
                onChange={(e) => setTableName(e.target.value)}
                value={tableName || ""}
                autoFocus
              />
              <select
                className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2 placeholder:text-gray-500"
                onChange={(e) => setActionType(e.target.value)}
                value={actionType}
              >
                <option value="investigate:claims">Investigate: Medical Claims</option>
                <option value="investigate:membership">
                  Investigate: Membership/Eligibility File
                </option>
                <option value="investigate:mmr">Investigate: MMR File</option>
                <option value="investigate:pharmacy">Investigate: Pharmacy Claims</option>
                <option value="chat:membership">Chat: Membership Information</option>
              </select>
              {_.startsWith(actionType, "investigate") ? (
                <textarea
                  className="peer block h-32 w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2 placeholder:text-gray-500"
                  placeholder="Add any pre-existing documentation or notes here"
                  onChange={(e) => setTableDocumentation(e.target.value)}
                  value={tableDocumentation || ""}
                />
              ) : null}
              {actionType === "chat:membership" ? (
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2 placeholder:text-gray-500"
                  placeholder={"Enter your question"}
                  onChange={(e) => setInputText(e.target.value)}
                  value={inputText}
                />
              ) : null}
              <button
                className="mt-4 flex w-40 items-center justify-center rounded-md border bg-green-pine p-2 text-white hover:bg-green-forest disabled:cursor-not-allowed disabled:bg-gray-400"
                disabled={!tableName || !isConnected}
                onClick={handleStartClick}
              >
                Start
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col items-center justify-between">
              <div className="space-y-8 overflow-y-auto px-20 py-4">
                <div
                  className="float-right cursor-pointer"
                  onClick={() => setShowLogBar(!showLogBar)}
                >
                  <ChatBubbleLeftIcon className="h-[18px] w-[18px]" />
                </div>
                {chatHistory.map((chatItem, i) => (
                  <div className="space-x-2" key={i}>
                    {chatItem.isUser ? (
                      <div className="mb-2 flex items-center px-4">
                        <UserCircleIcon className="h-5 w-5 text-gray-500" />
                        <span className="px-4 font-medium">You:</span>
                      </div>
                    ) : (
                      <div className="mb-2 flex items-center px-4">
                        {chatItem.type === "query" ? (
                          <CircleStackIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <SparklesIcon className="h-5 w-5 text-gray-500" />
                        )}
                        {chatItem.type === "query" ? (
                          <span className="px-4 font-medium">Database Result:</span>
                        ) : (
                          <span className="px-4 font-medium">Ursa Copilot:</span>
                        )}
                      </div>
                    )}
                    <ChatContent
                      showLogBar={showLogBar}
                      type={chatItem.type}
                      query={chatItem.query}
                      text={chatItem.text}
                    />
                  </div>
                ))}
                {isUnderway ? (
                  <div className="space-x-2">
                    <div className="mb-2 flex items-center px-4">
                      <SparklesIcon className="h-5 w-5 text-gray-500" />
                      <span className="px-4 font-medium">Ursa Copilot:</span>
                    </div>
                    <div className="rounded-lg bg-gray-100 px-4 py-2 text-gray-800">
                      <div className="relative h-6 w-6 overflow-hidden">
                        <div className="absolute inset-0 animate-ellipsis overflow-hidden">
                          <EllipsisHorizontalIcon className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center bg-gray-200 p-4">
              <div className="relative flex flex-1 flex-shrink-0">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2 placeholder:text-gray-500"
                  placeholder={isUnderway || isFinished ? "" : "Enter response"}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyUp={handleInputKeyUp}
                  value={inputText}
                  disabled={isUnderway || isFinished}
                  autoFocus
                  ref={inputRef}
                />
                <button
                  className="flex w-12 items-center justify-center rounded-md border bg-green-pine p-2 text-white hover:bg-green-forest disabled:cursor-not-allowed disabled:bg-gray-400"
                  onClick={handleInputClick}
                  disabled={!inputText}
                >
                  <ArrowRightIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {!_.isEmpty(log) && showLogBar ? (
        <div className="w-80">
          {log.map((logItem, i) => (
            <ChatContent key={i} isLogBar text={`[${logItem.role}]\n${logItem.content}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

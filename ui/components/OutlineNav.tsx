import React from "react";
import { IconSet, Playbook, Session } from "../util/types";
import getCheckStatus from "../util/get-check-status";

export const OutlineNav = ({
  activePlaybook,
  addOpenChat,
  focus,
  iconSet,
  session,
  setFocus,
  tableName,
  tableStatus,
}: {
  activePlaybook: Playbook | null;
  addOpenChat: Function;
  focus: string | null;
  iconSet?: IconSet;
  session: Session;
  setFocus: Function;
  tableName: string | null;
  tableStatus: string | undefined;
}) => {
  function setFocusPlaybook() {
    setFocus("playbook");
  }
  function setFocusSystemPrompt() {
    setFocus("systemPrompt");
  }
  function setFocusTableDocumentation() {
    setFocus("tableDocumentation");
  }
  function setFocusTableName() {
    setFocus("tableName");
  }

  const checkStatusMap: Record<string, React.ReactElement | string> = {
    FINISHED: iconSet?.Check || "✅ ",
    UNDERWAY: iconSet?.Underway || "⏳ ",
    USER_ACTION: iconSet?.Prompt || "❓ ",
    ERROR: iconSet?.Error || "❌ ",
    LOCKED: iconSet?.Lock || "🔒 ",
    NOT_STARTED: "",
  };

  const checksWithLessons = session?.steps
    .map((step) =>
      step.checks.filter((check) => {
        const lastMessage = check.messages[check.messages.length - 1];
        return (
          lastMessage &&
          lastMessage.role === "assistant" &&
          lastMessage.content.trim().startsWith("LESSONS_LEARNED")
        );
      })
    )
    .flat();

  return (
    <div>
      <ul>
        <li className="cursor-pointer" onClick={setFocusSystemPrompt}>
          System Prompt
        </li>
        <li className="cursor-pointer" onClick={setFocusTableName}>
          {tableName ? `Table: ${tableName}` : "Select Table Name"}
          {tableStatus === "SUCCESS" ? (
            <span className="text-green-500"> (Valid)</span>
          ) : tableStatus === "UNDERWAY" ? (
            <span className="text-yellow-500"> (Verifying...)</span>
          ) : tableStatus === "ERROR" ? (
            <span className="text-red-500"> (Invalid)</span>
          ) : null}
        </li>
        <li className="cursor-pointer" onClick={setFocusTableDocumentation}>
          Pre-Existing Table Documentation
        </li>
        <li className="cursor-pointer" onClick={setFocusPlaybook}>
          {activePlaybook ? "Playbook: " : "Select Playbook"}
          {activePlaybook?.filename || ""}
        </li>
        <li>
          <span className="font-bold">Open Chats</span>
          <button className="ml-4" onClick={() => addOpenChat()}>
            + Add
          </button>
        </li>
        <ul className="pl-4 pb-2 list-disc">
          {(session.openChats || []).map((openChat, openChatIndex) => {
            return (
              <li
                className={`ml-2 pl-2 border-b border-gray-400 ${
                  focus === `open-chat-${openChatIndex}` ? "bg-gray-200" : ""
                }`}
                key={openChatIndex}
              >
                <span
                  onClick={() => {
                    setFocus(`open-chat-${openChatIndex}`);
                  }}
                  className="cursor-pointer"
                >
                  {openChat.openChatQuestion && openChat.openChatQuestion.length > 30
                    ? `${openChat.openChatQuestion.substring(0, 30)}...`
                    : openChat.openChatQuestion || `Open Chat ${openChatIndex + 1}`}
                </span>
              </li>
            );
          })}
        </ul>
        {activePlaybook?.steps.map((step, index) => (
          <React.Fragment key={index}>
            <li
              onClick={() => {
                setFocus(`step-${index}`);
              }}
              className="cursor-pointer font-bold"
            >
              Step {index + 1}: {step.label}
            </li>
            <ul key={`checks-${index}`} className="pl-4 pb-2 list-disc">
              {step.checks.map((check, checkIndex) => {
                const checkStatus = getCheckStatus(session, activePlaybook, step.name, check.name);
                const isFocus = `check-${index}-${checkIndex}` === focus;
                return (
                  <li
                    className={`ml-2 pl-2 border-b border-gray-400 ${isFocus ? "bg-gray-200" : ""}`}
                    key={checkIndex}
                  >
                    <span
                      onClick={() => {
                        setFocus(`check-${index}-${checkIndex}`);
                      }}
                      className="cursor-pointer"
                    >
                      {checkStatusMap[checkStatus]}
                      {check.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </React.Fragment>
        ))}
        {checksWithLessons && checksWithLessons.length > 0 && (
          <React.Fragment>
            <li className="font-bold">Lessons Learned</li>
            <ul className="pl-4 pb-2 list-disc">
              <span
                onClick={() => {
                  setFocus("lessons-learned");
                }}
                className="cursor-pointer"
              >
                {checksWithLessons.length}
                {checksWithLessons.length > 1 ? " Lessons Learned" : " Lesson Learned"}
              </span>
            </ul>
          </React.Fragment>
        )}
      </ul>
    </div>
  );
};

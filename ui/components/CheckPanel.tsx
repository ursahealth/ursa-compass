import { IconSet, Message } from "../util/types";
import { useEffect, useRef, useState } from "react";
import { Playbook, PlaybookCheck, PlaybookStep, Session } from "../util/types";
import { DataTable } from "./DataTable";
import MessageContent from "./MessageContent";
import getCheckStatus from "../util/get-check-status";

export const CheckPanel = ({
  acceptAssertion,
  appendMessage,
  check,
  iconSet,
  isOpenChat,
  playbook,
  session,
  setOpenChatQuestion,
  startCheck,
  step,
}: {
  acceptAssertion: Function;
  appendMessage: Function;
  check: PlaybookCheck;
  iconSet: IconSet;
  isOpenChat?: boolean;
  playbook: Playbook;
  session: Session;
  setOpenChatQuestion: Function;
  startCheck: Function;
  step: PlaybookStep;
}) => {
  const [rejectionRationale, setRejectionRationale] = useState<string>("");
  const [isRevisingAssertion, setIsRevisingAssertion] = useState<boolean>(false);
  const [revisedAssertion, setRevisedAssertion] = useState<string>("");
  const [userResponse, setUserResponse] = useState<string>("");

  let sessionCheck;
  if (isOpenChat) {
    sessionCheck = session.openChats?.find((c) => c.key === check.name);
  } else {
    const sessionStep = session.steps?.find((s) => s.key === step.name);
    sessionCheck = sessionStep?.checks.find((c) => c.key === check.name);
  }

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionCheck?.messages]);

  const acceptAssertionLocal = (stepName: string, checkName: string) => {
    const assertion = isRevisingAssertion ? revisedAssertion : currentAssertion;
    acceptAssertion(stepName, checkName, assertion);
  };

  const rejectAssertionLocal = (
    stepName: string,
    checkName: string,
    messages: Message[],
    rationale: string
  ) => {
    appendMessage(stepName, checkName, messages, rationale);
    setRejectionRationale("");
  };

  const checkStatus = getCheckStatus(session, playbook, step.name, check.name);
  const lastMessage =
    sessionCheck?.messages &&
    sessionCheck.messages.length > 0 &&
    sessionCheck.messages[sessionCheck.messages.length - 1];
  const isLastMessageAskUser =
    lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.content.trim().startsWith("ASK_USER");
  const isLastMessageAsssertion =
    lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.content.trim().startsWith("ASSERTION");
  const currentAssertion = sessionCheck?.assertion
    ? sessionCheck.assertion
    : isLastMessageAsssertion
    ? lastMessage.content.replace("ASSERTION:", "").replace("ASSERTION", "").trim()
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="space-y-2">
        <h2 className="text-m font-semibold text-gray-700">{step.label}</h2>
        {step.description && (
          <div className="ml-6 p-2 border-l-4 border-blue-500 bg-blue-50 text-blue-900">
            <p className="text-sm">{step.description}</p>
          </div>
        )}
        <h1 className="text-2xl font-light text-gray-800">{check.label}</h1>
        {check.description && (
          <div className="ml-6 p-2 border-l-4 border-blue-500 bg-blue-50 text-blue-900">
            <p className="text-sm">{check.description}</p>
          </div>
        )}
        {isOpenChat && (
          <div className="ml-6 p-2 border-l-4 border-blue-500 bg-blue-50 text-blue-900">
            <p className="text-sm">
              This is an open chat session. You can interact with Ursa Compass freely. All accepted
              assertions will be included in the context window of the chat.
            </p>
            <input
              type="text"
              placeholder="Type your question"
              className="w-full p-2 border rounded-md mt-2"
              value={sessionCheck?.openChatQuestion || ""}
              onChange={(e) => setOpenChatQuestion(e.target.value, check.name)}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <section>
          <div className="flex justify-between align-center border-b pb-1 mb-2">
            <h3 className="text-xl font-semibold text-gray-800">Messages</h3>
            <button
              type="button"
              className="px-4 py-2 bg-green-pine text-white rounded-md hover:bg-green-forest focus:outline-none focus:ring-2 focus:ring-green-pine disabled:bg-gray-300"
              disabled={checkStatus === "LOCKED"}
              onClick={() => startCheck()}
            >
              {checkStatus === "LOCKED"
                ? "Check Not Ready"
                : sessionCheck?.messages && sessionCheck.messages.length > 0
                ? "Reset Check"
                : "Start Check"}
            </button>
          </div>

          {sessionCheck?.messages && sessionCheck.messages.length > 0 && (
            <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-96 overflow-y-auto mb-4">
              {sessionCheck.messages.map((message, i) => (
                <div className="space-x-2" key={i}>
                  {message.role === "user" ? (
                    <div className="mb-2 mt-2 flex items-center px-4">
                      <div
                        className="h-5 w-5 text-gray-500 text-xl m-2 mt-0"
                        style={{ filter: "grayscale(100%)" }}
                      >
                        {iconSet?.User ? iconSet.User : "\u{1F464}"}
                      </div>
                      <span className="px-4 font-medium">You:</span>
                    </div>
                  ) : message.role === "compass" ? (
                    <div className="mb-2 mt-2 flex items-center px-4">
                      <div className="h-5 w-5 text-gray-500 text-xl m-2 mt-0">
                        {iconSet?.Computer ? iconSet.Computer : "\u{1F9ED}"}
                      </div>
                      <span className="px-4 font-medium">Ursa Compass:</span>
                    </div>
                  ) : (
                    <div className="mb-2 mt-2 flex items-center px-4">
                      <div
                        className="h-5 w-5 text-gray-500 text-xl m-2 mt-0"
                        style={{ filter: "grayscale(100%)" }}
                      >
                        {iconSet?.Sparkles ? iconSet.Sparkles : "\u{2728}"}
                      </div>
                      <span className="px-4 font-medium">LLM Model:</span>
                    </div>
                  )}
                  <MessageContent text={message.content} />
                </div>
              ))}
              {isLastMessageAskUser && (
                <input
                  type="text"
                  placeholder="Your response..."
                  className="w-full p-2 border rounded-md mt-2"
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      appendMessage(step.name, check.name, sessionCheck?.messages, userResponse);
                      setUserResponse("");
                    }
                  }}
                />
              )}

              {!isLastMessageAskUser && !isLastMessageAsssertion && (
                <div className="space-x-2">
                  <div className="mb-2 mt-2 flex items-center px-4">
                    <div
                      className="h-5 w-5 text-gray-500 text-xl m-2 mt-0"
                      style={{ filter: "grayscale(100%)" }}
                    >
                      {"\u{1F9ED}"}
                    </div>
                    <span className="px-4 font-medium">Ursa Compass:</span>
                  </div>
                  <MessageContent text="... underway" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-1 mb-2">Evidence</h3>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 border">
            {sessionCheck?.evidence && sessionCheck.evidence.length > 0
              ? sessionCheck.evidence.map((evidence, index) => (
                  <div key={index} className="mb-2">
                    <DataTable data={evidence.result} sql={evidence.sql} />
                  </div>
                ))
              : null}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-1 mb-2">
            Resolution
            {sessionCheck?.assertion ? ": Assertion accepted" : ""}
          </h3>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 border">
            {currentAssertion && (
              <div>
                <span className="font-semibold">Assertion:</span>{" "}
                {isRevisingAssertion ? (
                  <div>
                    <textarea
                      className="w-full p-2 border rounded-md mt-2"
                      value={revisedAssertion || currentAssertion}
                      onChange={(e) => setRevisedAssertion(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className={`bg-gray-100 px-4 py-2 text-sm text-gray-800`}>
                    {currentAssertion.split("\n").map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                )}
                {!sessionCheck?.assertion && (
                  <div>
                    <button
                      onClick={() => acceptAssertionLocal(step.name, check.name)}
                      className="mt-2 px-4 py-2 bg-green-pine text-white rounded-md hover:bg-green-forest focus:outline-none focus:ring-2 focus:ring-green-pine"
                    >
                      Accept Assertion
                    </button>

                    {!isRevisingAssertion && (
                      <button
                        onClick={() => setIsRevisingAssertion(true)}
                        className="mt-2 ml-2 px-4 py-2 bg-green-pine text-white rounded-md hover:bg-green-forest focus:outline-none focus:ring-2 focus:ring-green-pine"
                      >
                        Revise and Accept Assertion
                      </button>
                    )}
                  </div>
                )}
                {!sessionCheck?.assertion && (
                  <div className="flex flex-columns">
                    <input
                      type="text"
                      placeholder="Rejection rationale"
                      value={rejectionRationale}
                      onChange={(e) => setRejectionRationale(e.target.value)}
                      className="mt-2 p-2 border rounded-md w-full"
                    />
                    <button
                      onClick={() =>
                        rejectAssertionLocal(
                          step.name,
                          check.name,
                          sessionCheck?.messages || [],
                          rejectionRationale
                        )
                      }
                      className="mt-2 ml-2 px-4 py-2 w-64 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reject Assertion
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

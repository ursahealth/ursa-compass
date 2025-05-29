import { Message } from "../util/types";
import { useState } from "react";
import { PlaybookCheck, PlaybookStep, Session } from "../util/types";
import { DataTable } from "./DataTable";
import MessageContent from "./MessageContent";

export const CheckPanel = ({
  acceptAssertion,
  check,
  rejectAssertion,
  session,
  startCheck,
  step,
}: {
  acceptAssertion: Function;
  check: PlaybookCheck;
  rejectAssertion: Function;
  session: Session;
  startCheck: Function;
  step: PlaybookStep;
}) => {
  const [rejectionRationale, setRejectionRationale] = useState<string>("");
  const [isRevisingAssertion, setIsRevisingAssertion] = useState<boolean>(false);
  const [revisedAssertion, setRevisedAssertion] = useState<string>("");

  const sessionStep = session.steps?.find((s) => s.key === step.name);
  const sessionCheck = sessionStep?.checks.find((c) => c.key === check.name);
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
    rejectAssertion(stepName, checkName, messages, rationale);
    setRejectionRationale("");
  };

  const currentAssertion = sessionCheck?.assertion
    ? sessionCheck.assertion
    : sessionCheck?.messages &&
      sessionCheck.messages.length > 0 &&
      sessionCheck.messages[sessionCheck.messages.length - 1].role === "assistant" &&
      sessionCheck.messages[sessionCheck.messages.length - 1].content.trim().startsWith("ASSERTION")
    ? sessionCheck.messages[sessionCheck.messages.length - 1].content
        .replace("ASSERTION:", "")
        .replace("ASSERTION", "")
        .trim()
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
      </div>

      <div className="space-y-4">
        <section>
          <div className="flex justify-between align-center border-b pb-1 mb-2">
            <h3 className="text-xl font-semibold text-gray-800">Messages</h3>
            <button
              type="button"
              className="px-4 py-2 bg-green-pine text-white rounded-md hover:bg-green-forest focus:outline-none focus:ring-2 focus:ring-green-pine"
              onClick={() => startCheck()}
            >
              {sessionCheck?.messages && sessionCheck.messages.length > 0 ? "Reset " : "Start "}
              Check
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
                        {"\u{1F464}"}
                      </div>
                      <span className="px-4 font-medium">You:</span>
                    </div>
                  ) : (
                    <div className="mb-2 mt-2 flex items-center px-4">
                      <div
                        className="h-5 w-5 text-gray-500 text-xl m-2 mt-0"
                        style={{ filter: "grayscale(100%)" }}
                      >
                        {"\u{2728}"}
                      </div>
                      <span className="px-4 font-medium">Ursa Compass:</span>
                    </div>
                  )}
                  <MessageContent showLogBar text={message.content} />
                </div>
              ))}
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

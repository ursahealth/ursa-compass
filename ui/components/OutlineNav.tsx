import React from "react";
import { Playbook } from "../util/types";

export const OutlineNav = ({
  activePlaybook,
  setFocus,
  tableName,
  tableStatus,
}: {
  activePlaybook: Playbook;
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
  function setFocusTableName() {
    setFocus("tableName");
  }

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
        <li className="cursor-pointer" onClick={setFocusPlaybook}>
          {activePlaybook ? "Playbook: " : "Select Playbook"}
          {activePlaybook?.filename || ""}
        </li>
        {activePlaybook?.steps.map((step, index) => (
          <React.Fragment key={index}>
            <li
              onClick={() => {
                setFocus(`step-${index}`);
              }}
              className="cursor-pointer font-bold"
            >
              Step {index + 1}: {step.name}
            </li>
            <ul key={`checks-${index}`} className="pl-4 pb-2">
              {step.checks.map((check, checkIndex) => (
                <li className="ml-4 border-b border-gray-400" key={checkIndex}>
                  <span
                    onClick={() => {
                      setFocus(`check-${index}-${checkIndex}`);
                    }}
                    className="cursor-pointer"
                  >
                    {check.name}
                  </span>
                </li>
              ))}
            </ul>
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

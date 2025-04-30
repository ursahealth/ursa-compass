import { Playbook } from "./types";

export const OutlineNav = ({
  activePlaybook,
  setFocus,
  tableName
}: {
  activePlaybook: Playbook;
  setFocus: Function;
  tableName: string | null;
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
        </li>
        <li className="cursor-pointer" onClick={setFocusPlaybook}>
          {activePlaybook ? "Playbook: " : "Select Playbook"}
          {activePlaybook?.filename || ""}
        </li>
        {activePlaybook?.steps.map((step, index) => (
          <>
            <li
              key={index}
              onClick={() => {
                setFocus(`step-${index}`);
              }}
              className="cursor-pointer font-bold"
            >
              Step {index + 1}: {step.name}
            </li>
            <ul key={`checks-${index}`} className="pl-4 pb-2">
              {step.checks.map((check, checkIndex) => (
                <li className="pl-4" key={checkIndex}>
                  <span
                    onClick={() => {
                      setFocus(`check-${index}-${checkIndex}`);
                    }}
                    className="cursor-pointer"
                  >
                    {check.check}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ))}
      </ul>
    </div>
  );
};

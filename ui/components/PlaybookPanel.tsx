import { useState } from "react";
import { Playbook } from "../util/types";
import parsePlaybookYaml from "../util/parse-playbook-yml";

export const PlaybookPanel = ({
  playbooks,
  activePlaybook,
  setPlaybookName,
  updatePlaybook,
}: {
  playbooks: Array<Playbook>;
  activePlaybook: Playbook | null;
  setPlaybookName: Function;
  updatePlaybook: Function;
}) => {
  const [playbookNameEdit, setPlaybookNameEdit] = useState<string>("");
  const [playbookContentEdit, setPlaybookContentEdit] = useState<string>("");

  let isValidPlaybook = true;
  let parsedPlaybook: Playbook | null = null;
  try {
    if (playbookContentEdit) {
      parsedPlaybook = parsePlaybookYaml(
        playbookNameEdit || activePlaybook?.filename || "",
        playbookContentEdit
      );
    }
  } catch (error) {
    isValidPlaybook = false;
  }

  return (
    <div>
      <div>
        Load Playbook:{" "}
        <select
          className="border rounded p-1 m-4"
          value={activePlaybook ? activePlaybook.filename : ""}
          onChange={(e) => {
            setPlaybookName(e.target.value);
          }}
        >
          <option value="" disabled>
            Select a Playbook
          </option>
          {playbooks.map((playbook, index) => (
            <option key={index} value={playbook.filename}>
              {playbook.filename}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-rows items-center justify-between mb-4">
        <div>
          Name:
          <input
            type="text"
            value={playbookNameEdit || activePlaybook?.filename || ""}
            className="border rounded p-1 ml-2"
            onChange={(event) => setPlaybookNameEdit(event.target.value)}
          />
        </div>
        <button
          className="px-4 py-2 bg-green-pine text-white rounded-md hover:bg-green-forest focus:outline-none focus:ring-2 focus:ring-green-pine disabled:bg-gray-300"
          disabled={!playbookNameEdit && !playbookContentEdit}
          onClick={() =>
            updatePlaybook(
              playbookNameEdit || activePlaybook?.filename || "",
              playbookContentEdit || activePlaybook?.rawContent || ""
            )
          }
        >
          Update Playbook
        </button>
      </div>
      <div>
        <textarea
          className="font-mono"
          value={playbookContentEdit || activePlaybook?.rawContent || ""}
          onChange={(event) => setPlaybookContentEdit(event.target.value)}
          rows={30}
          cols={120}
        />
      </div>
      {!isValidPlaybook && (
        <div className="text-red-500">
          <p>Invalid Playbook YAML format. Please check the syntax.</p>
        </div>
      )}
      {isValidPlaybook && parsedPlaybook && (
        <div className="bg-gray-100 p-4 border-1">
          <strong>Edit Preview</strong>
          <ul>
            <li>Goal: {parsedPlaybook.goal}</li>
            <li>Steps:</li>
            <ol>
              {parsedPlaybook.steps.map((step, index) => (
                <li key={index}>
                  <strong>
                    Step {index + 1}: {step.label} ({step.name})
                  </strong>
                  <div className="italic pl-8">{step.description}</div>
                  <ul>
                    {step.checks.map((check, checkIndex) => (
                      <li key={checkIndex}>
                        <span>
                          {check.label} ({check.name})
                        </span>
                        <div className="italic pl-8">{check.description}</div>
                        {check.dependencies && check.dependencies.length > 0 && (
                          <div className="italic pl-8">
                            Dependencies: {check.dependencies.join(", ")}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </ul>
        </div>
      )}
    </div>
  );
};

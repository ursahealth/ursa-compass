import { Check, Parsed, Playbook, Session, Step } from "./types";
import { useEffect, useState } from "react";
import { OutlineNav } from "./OutlineNav";
import { MainPanel } from "./MainPanel";
import { PlaybookPanel } from "./PlaybookPanel";
import { SessionNav } from "./SessionNav";

/*
export interface CopilotUIProps {
  userId: string;
  onSendMessage: (message: string) => void;
  messages: { sender: "user" | "assistant"; text: string }[];
}
*/

function generateDefaultSessionName(date = new Date()) {
  const timeString = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Session ${date.toLocaleDateString()} ${timeString}`;
}

export function parsePlaybookYaml(src: string): Parsed {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");

  const playbook: Playbook = { filename: "", goal: "", rawContent: src, steps: [] };
  let currentStep: Step | null = null;

  for (let raw of lines) {
    const line = raw.replace(/\t/g, "  "); // tabs → spaces
    if (!line.trim() || line.trim().startsWith("#")) continue; // skip blank/comment

    // LEVEL 0  (playbook key ignored – we start inside it)
    if (line.startsWith("  goal:")) {
      playbook.goal = line.split(/goal:\s*/)[1];
      continue;
    }

    // LEVEL 1 – new step
    if (line.trim().startsWith("- step:")) {
      const name = line.split(/- step:\s*/)[1];
      currentStep = { name, goal: "", checks: [] };
      playbook.steps.push(currentStep);
      continue;
    }

    // LEVEL 2 – step.goal
    if (line.startsWith("    goal:") && currentStep) {
      currentStep.goal = line.split(/goal:\s*/)[1];
      continue;
    }

    // LEVEL 3 – new check
    if (line.trim().startsWith("- check:") && currentStep) {
      const text = line.split(/- check:\s*/)[1];
      currentStep.checks.push({ check: text });
      continue;
    }
  }

  console.log("play", playbook);
  return playbook;
}

export const CopilotUI = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activePlaybookName, setActivePlaybookName] = useState<Playbook | null>(null);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlaybooks() {
      const response = await fetch("/api/get-playbooks");
      const data = await response.json();
      const playbooks = data.map((file: { filename: string; content: string }) => {
        try {
          const parsed = parsePlaybookYaml(file.content);
          return {
            filename: file.filename,
            rawContent: file.content,
            steps: parsed.steps,
          };
        } catch (error) {
          console.error(`Error parsing playbook ${file.filename}:`, error);
          return null;
        }
      });
      setPlaybooks(playbooks);
    }

    loadPlaybooks();
  }, []);

  const activeSession = sessions.find((s) => s.uuid === activeSessionId);
  const activePlaybook = playbooks.find((pb) => pb.filename === activePlaybookName) || null;

  const createNewSession = () => {
    const now = new Date();
    const uuid = crypto.randomUUID();
    const newSession: Session = {
      uuid,
      name: generateDefaultSessionName(now),
      createdAt: now.toISOString(),
      prompt: "",
      playbookYaml: "",
      tableName: null,
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(uuid);
  };

  return (
    <div className="flex h-full w-full flex-row justify-between">
      <div className="flex h-full w-full flex-1 flex-col justify-between">
        <div className="flex h-screen overflow-hidden">
          {/* Left Sidebar */}
          <SessionNav
            activeSessionId={activeSessionId}
            createNewSession={createNewSession}
            sessions={sessions}
            setActiveSessionId={setActiveSessionId}
          />

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {!activeSession ? (
              <p className="text-gray-500 text-center mt-8">Select or create a session to begin.</p>
            ) : focus === "playbook" ? (
              <PlaybookPanel
                activePlaybook={activePlaybook}
                playbooks={playbooks}
                setActivePlaybookName={setActivePlaybookName}
              />
            ) : focus === "tableName" ? (
              <div>
                <h3 className="font-semibold mb-2">Table Name</h3>
                <input
                  type="text"
                  placeholder="Enter table name"
                  className="w-full p-2 border rounded"
                  value={activeSession.tableName || ""}
                  onChange={(e) => {
                    const updatedSession = { ...activeSession, tableName: e.target.value };
                    setSessions(
                      sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s))
                    );
                  }}
                />
              </div>
            ) : focus === "systemPrompt" ? (
              <div>
                <h3 className="font-semibold mb-2">TBD</h3>
                Let users see and edit the system prompt
              </div>
            ) : (
              <MainPanel session={activeSession} />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-[600px] flex-none overflow-y-auto overflow-x-hidden bg-gray-50 p-4 border-l text-[14px]">
            {activeSession && (
              <OutlineNav
                setFocus={setFocus}
                activePlaybook={activePlaybook}
                tableName={activeSession.tableName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

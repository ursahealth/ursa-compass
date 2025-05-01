import { Playbook, Session, Step } from "../util/types";
import { useEffect, useState } from "react";
import { OutlineNav } from "./OutlineNav";
import { CheckPanel } from "./CheckPanel";
import { MainPanel } from "./MainPanel";
import { PlaybookPanel } from "./PlaybookPanel";
import { SessionNav } from "./SessionNav";
import parsePlaybookYaml from "../util/parse-playbook-yml";

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

export const InterrogationPanel = () => {
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
  const activeStep =
    activePlaybook && focus && (focus.startsWith("step-") || focus.startsWith("check-"))
      ? activePlaybook.steps[Number(focus.split("-")[1])]
      : null;
  const activeCheck =
    activeStep && focus && focus.startsWith("check-")
      ? activeStep.checks[Number(focus.split("-")[2])]
      : null;

  console.log(activePlaybook);
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

  const renameSession = (sessionId: string, newName: string) => {
    const session = sessions.find((s) => s.uuid === sessionId);
    if (session) {
      const updatedSession = Object.assign(session, { name: newName });
      setSessions(sessions.map((s) => (s.uuid === sessionId ? updatedSession : s)));
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.uuid !== sessionId));
  };

  return (
    <div className="flex h-full w-full flex-row justify-between">
      <div className="flex h-full w-full flex-1 flex-col justify-between">
        <div className="flex h-screen overflow-hidden">
          {/* Left Sidebar */}
          <SessionNav
            activeSessionId={activeSessionId}
            createNewSession={createNewSession}
            deleteSession={deleteSession}
            renameSession={renameSession}
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
            ) : activeCheck ? (
              <CheckPanel session={activeSession} check={activeCheck} step={activeStep} />
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

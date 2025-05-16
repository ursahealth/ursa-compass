import { Playbook, Session, Step } from "../util/types";
import { useEffect, useState } from "react";
import { OutlineNav } from "./OutlineNav";
import { CheckPanel } from "./CheckPanel";
import { MainPanel } from "./MainPanel";
import { PlaybookPanel } from "./PlaybookPanel";
import { SessionNav } from "./SessionNav";
import { TableNamePanel } from "./TableNamePanel";
import parsePlaybookYaml from "../util/parse-playbook-yml";
import populateSystemPrompt from "../util/populate-system-prompt";

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

let autosaveTimestamp: number | null = null;

export const InterrogationPanel = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activePlaybookName, setActivePlaybookName] = useState<Playbook | null>(null);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlaybooks() {
      const response = await fetch("/api/get-playbooks");
      const data = await response.json();
      const playbooks = data.map((file: { filename: string; content: string }) => {
        try {
          return parsePlaybookYaml(file.filename, file.content);
        } catch (error) {
          console.error(`Error parsing playbook ${file.filename}:`, error);
          return null;
        }
      });
      setPlaybooks(playbooks);
    }

    loadPlaybooks();
  }, []);

  useEffect(() => {
    async function loadPrompt() {
      const response = await fetch("/api/get-system-prompt");
      const data = await response.json();
      setSystemPrompt(data.prompt);
    }

    loadPrompt();
  }, []);

  useEffect(() => {
    async function loadSessions() {
      const response = await fetch("/api/get-sessions");
      const data = await response.json();
      setSessions(data);
    }

    loadSessions();
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

  const autosaveSession = (session = activeSession) => {
    setTimeout(() => {
      // throttle to perform this no more than once every 10 seconds
      const hasBeen10Seconds = !autosaveTimestamp || Date.now() - autosaveTimestamp > 10000;
      if (session && hasBeen10Seconds) {
        autosaveTimestamp = Date.now();
        console.log("autosaving session", session.uuid);
        fetch("/api/autosave-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(session),
        })
          .then((response) => {
            console.log("Session autosaved:", response);
          })
          .catch((error) => {
            console.error("Error autosaving session:", error);
          });
      }
    }, 1);
  };

  const blurTableName = () => {
    const tableName = activeSession?.tableName;
    const updatedSession = Object.assign({}, activeSession, {
      tableStatus: "UNDERWAY",
      tableData: null,
    });
    setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
    if (tableName) {
      fetch(`/api/verify-table?tableName=${encodeURIComponent(tableName)}`)
        .then((response) => response.json())
        .then((data) => {
          const updatedSession = Object.assign({}, activeSession, {
            tableStatus: "SUCCESS",
            tableData: data.results,
            tableSql: data.sql,
          });
          setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
          autosaveSession();
        })
        .catch((error) => {
          console.error("Error fetching table data:", error);
          const updatedSession = Object.assign({}, activeSession, { tableStatus: "ERROR" });
          setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
        });
    }
  };

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
    autosaveSession();
  };

  const deleteSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.uuid !== sessionId));
    // TODO: delete session file from server
  };

  const renameSession = (sessionId: string, newName: string) => {
    const session = sessions.find((s) => s.uuid === sessionId);
    if (session) {
      const updatedSession = Object.assign(session, { name: newName });
      setSessions(sessions.map((s) => (s.uuid === sessionId ? updatedSession : s)));
      autosaveSession(updatedSession);
    }
  };

  const setTableName = (tableName: string) => {
    const updatedSession = Object.assign({}, activeSession, { tableName });
    setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
  };

  const setTableDocumentation = (tableDocumentation: string) => {
    const updatedSession = Object.assign({}, activeSession, { tableDocumentation });
    setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
  };

  const startChat = () => {
    if (systemPrompt && activeSession) {
      const populatedPrompt = populateSystemPrompt(
        systemPrompt,
        activeSession,
        activePlaybook,
        activeStep,
        activeCheck
      );
    }
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
              <TableNamePanel
                blurTableName={blurTableName}
                session={activeSession}
                setTableName={setTableName}
              />
            ) : focus === "tableDocumentation" ? (
              <div>
                <h3 className="font-semibold mb-2">Table Documentation</h3>
                <textarea
                  value={activeSession.tableDocumentation || ""}
                  rows={100}
                  cols={100}
                  onChange={(e) => setTableDocumentation(e.target.value)}
                />
              </div>
            ) : focus === "systemPrompt" ? (
              <div>
                <h3 className="font-semibold mb-2">System Prompt (TODO: allow user edit)</h3>
                <textarea value={systemPrompt || ""} rows={100} cols={100} />
              </div>
            ) : activeCheck ? (
              <CheckPanel
                session={activeSession}
                check={activeCheck}
                step={activeStep}
                startChat={startChat}
              />
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
                tableStatus={activeSession.tableStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

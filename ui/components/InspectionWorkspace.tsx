import { EvidenceItem, Message, Session } from "../util/types";
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

export const InspectionWorkspace = ({
  isSocketInitialized,
  socket,
  socketInitializer,
}: {
  isSocketInitialized: boolean;
  socket: { on: Function; off: Function; emit: Function };
  socketInitializer: Function;
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [baseSystemPrompt, setBaseSystemPrompt] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.uuid === activeSessionId);
  const activePlaybook =
    playbooks.find((pb) => pb.filename === activeSession?.playbookName) || null;
  const activeStep =
    activePlaybook && focus && (focus.startsWith("step-") || focus.startsWith("check-"))
      ? activePlaybook.steps[Number(focus.split("-")[1])]
      : null;
  const activeCheck =
    activeStep && focus && focus.startsWith("check-")
      ? activeStep.checks[Number(focus.split("-")[2])]
      : null;

  useEffect(() => {
    socketInitializer();
    if (!isSocketInitialized) {
      return;
    }
    socket.on("log", (incomingLog: string) => {
      console.log("incoming", incomingLog);
      // TODO: handle incoming log
    });
    socket.on("update", (type: string, keys: any, payload: Array<Message> | EvidenceItem) => {
      setSessions((prevSessions) => {
        const updatedSessions = prevSessions.map((s) => {
          if (s.uuid === keys.sessionId) {
            if (!s.steps || !s.steps.find((step) => step.key === keys.stepKey)) {
              // create the session step for the first time if necessary
              s = { ...s, steps: (s.steps || []).concat({ key: keys.stepKey, checks: [] }) };
            }
            const updatedSteps = (s.steps || []).map((step) => {
              if (step.key === keys.stepKey) {
                if (!step.checks || !step.checks.find((check) => check.key === keys.checkKey)) {
                  // create the session check for the first time if necessary
                  step = {
                    ...step,
                    checks: (step.checks || []).concat({
                      key: keys.checkKey,
                      messages: [],
                      evidence: [],
                    }),
                  };
                }
                const updatedChecks = (step.checks || []).map((check) => {
                  if (check.key === keys.checkKey) {
                    const updatedCheck = { ...check };

                    if (type === "messages") {
                      const messagePayload = payload as Array<Message>;
                      updatedCheck.messages = messagePayload;
                    }
                    if (type === "evidence") {
                      const evidencePayload = payload as EvidenceItem;
                      updatedCheck.evidence = (updatedCheck.evidence || []).concat(evidencePayload);
                    }

                    return updatedCheck;
                  }
                  return check;
                });
                const updatedStep = { ...step, checks: updatedChecks };
                return updatedStep;
              }
              return step;
            });
            const updatedSession = { ...s, steps: updatedSteps };
            return updatedSession;
          }
          autosaveSession(s);
          return s;
        });
        return updatedSessions;
      });
    });

    return () => {
      socket.off("log");
      socket.off("message");
      socket.off("evidence");
    };
  }, [isSocketInitialized]);

  useEffect(() => {
    async function loadPlaybooks() {
      const response = await fetch("/api/compass/get-playbooks");
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
      const response = await fetch("/api/compass/get-system-prompt");
      const data = await response.json();
      setBaseSystemPrompt(data.prompt);
    }

    loadPrompt();
  }, []);

  useEffect(() => {
    async function loadSessions() {
      const response = await fetch("/api/compass/get-sessions");
      const data = await response.json();
      setSessions(data);
    }

    loadSessions();
  }, []);

  const autosaveSession = (session = activeSession) => {
    setTimeout(() => {
      // throttle to perform this no more than once every 10 seconds
      const hasBeen10Seconds = !autosaveTimestamp || Date.now() - autosaveTimestamp > 10000;
      if (session && hasBeen10Seconds) {
        autosaveTimestamp = Date.now();
        fetch("/api/compass/autosave-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(session),
        })
          .then(() => {
            console.log("Session autosaved:", session.uuid);
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
      fetch(`/api/compass/verify-table?tableName=${encodeURIComponent(tableName)}`)
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
      playbookName: "",
      tableName: null,
      steps: [],
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(uuid);
    autosaveSession();
  };

  const deleteSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.uuid !== sessionId));
    fetch("/api/compass/delete-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: sessionId }),
    })
      .then((response) => {
        // console.log("Session deleted:", response);
      })
      .catch((error) => {
        console.error("Error deleting session:", error);
      });
  };

  const renameSession = (sessionId: string, newName: string) => {
    const session = sessions.find((s) => s.uuid === sessionId);
    if (session) {
      const updatedSession = Object.assign(session, { name: newName });
      setSessions(sessions.map((s) => (s.uuid === sessionId ? updatedSession : s)));
      autosaveSession(updatedSession);
    }
  };

  const saveSystemPrompt = () => {
    fetch("/api/compass/save-system-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ systemPrompt }),
    })
      .then((response) => {
        setBaseSystemPrompt(systemPrompt);
        setSystemPrompt(null);
      })
      .catch((error) => {
        console.error("Error saving system prompt:", error);
      });
  };

  const setPlaybookName = (playbookName: string) => {
    const updatedSession = Object.assign({}, activeSession, { playbookName });
    setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
    autosaveSession();
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
    const effectiveSystemPrompt = systemPrompt || baseSystemPrompt;
    if (effectiveSystemPrompt && activeSession) {
      const populatedPrompt = populateSystemPrompt(
        effectiveSystemPrompt,
        activeSession,
        activePlaybook,
        activeStep,
        activeCheck
      );
      socket.emit("investigation-check", {
        sessionId: activeSessionId,
        stepKey: activeStep?.name,
        checkKey: activeCheck?.name,
        messages: [{ role: "user", content: populatedPrompt }],
      });
    }
  };

  const updatePlaybook = (name: string, content: string) => {
    const updatedPlaybook = parsePlaybookYaml(name, content);
    const hasExistingPlaybook = playbooks.some((pb) => pb.filename === name);
    if (hasExistingPlaybook) {
      setPlaybooks((prev) => prev.map((pb) => (pb.filename === name ? updatedPlaybook : pb)));
    } else {
      setPlaybooks((prev) => [...prev, updatedPlaybook]);
    }
    fetch("/api/compass/save-playbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: name, rawContent: content }),
    })
      .then(() => {
        setFocus("");
      })
      .catch((error) => {
        console.error("Error updating playbook:", error);
      });
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
                setPlaybookName={setPlaybookName}
                updatePlaybook={updatePlaybook}
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
                <div className="flex flex-rows items-center justify-between mb-4">
                  <h3 className="font-semibold mb-2">System Prompt</h3>
                  <button
                    className="px-4 py-2 bg-green-pine text-white rounded-md hover:bg-green-forest focus:outline-none focus:ring-2 focus:ring-green-pine disabled:bg-gray-300"
                    disabled={!systemPrompt}
                    onClick={() => saveSystemPrompt()}
                  >
                    Update Prompt
                  </button>
                </div>
                <textarea
                  onChange={(event) => setSystemPrompt(event.target.value)}
                  value={systemPrompt || baseSystemPrompt || ""}
                  rows={100}
                  cols={100}
                />
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

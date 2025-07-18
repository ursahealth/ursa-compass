import { EvidenceItem, IconSet, Message, Playbook, PlaybookCheck, Session } from "../util/types";
import { useEffect, useState } from "react";
import { OutlineNav } from "./OutlineNav";
import { CheckPanel } from "./CheckPanel";
import { MainPanel } from "./MainPanel";
import { PlaybookPanel } from "./PlaybookPanel";
import { SessionNav } from "./SessionNav";
import { TableNamePanel } from "./TableNamePanel";
import parsePlaybookYaml from "../util/parse-playbook-yml";
import populateSystemPrompt from "../util/populate-system-prompt";

function generateDefaultSessionName(date = new Date()) {
  const timeString = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Session ${date.toLocaleDateString()} ${timeString}`;
}

let autosaveTimestamp: number | null = null;

function getLessonMessage(check: PlaybookCheck): string {
  const { label, description } = check;
  const descriptionBlurb = description ? ` and the check description was ${description}` : "";
  return (
    `Reviewing the conversation that we've just had, is there anything ` +
    `you'd recommend we change in the original question or the description ` +
    `surrounding it, to help eliminate confusion in the future? \n\n The check label ` +
    `was ${label}${descriptionBlurb}. \n\n It is perfectly fine if you don't have any feedback. ` +
    `If you have feedback, start your response with LESSONS_LEARNED. If you do not ` +
    `have feedback, respond with ALL_DONE. \n\nKeep in mind that any lessons need to be specific ` +
    `to this particular check but broadly applicable to other data sets, not just this one.`
  );
}

export const InspectionWorkspace = ({
  iconSet,
  isSocketInitialized,
  Navbar,
  socket,
  socketInitializer,
}: {
  iconSet?: IconSet;
  isSocketInitialized: boolean;
  Navbar?: React.ComponentType;
  socket: { on: Function; off: Function; emit: Function };
  socketInitializer: Function;
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [baseSystemPrompt, setBaseSystemPrompt] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const activeSession = sessions.find((s) => s.uuid === activeSessionId);
  const activeOpenChat =
    focus && focus.startsWith("open-chat-")
      ? (activeSession?.openChats || [])[Number(focus.split("-")[2])]
      : null;
  const activePlaybook =
    playbooks.find((pb) => pb.filename === activeSession?.playbookName) || null;
  const activeStep =
    activePlaybook && focus && (focus.startsWith("step-") || focus.startsWith("check-"))
      ? activePlaybook.steps[Number(focus.split("-")[1])]
      : activeOpenChat
      ? { name: "open-chat", label: "Open Chat", checks: [] }
      : null;
  const activeCheck =
    activeStep && focus && focus.startsWith("check-")
      ? activeStep.checks[Number(focus.split("-")[2])]
      : activeOpenChat
      ? { name: activeOpenChat.key }
      : null;

  const checksWithLessons: Array<{ lesson: string; name: string }> = [];
  for (const step of activeSession?.steps || []) {
    for (const check of step.checks || []) {
      const lastMessage = check.messages[check.messages.length - 1];
      if (
        lastMessage &&
        lastMessage.role === "assistant" &&
        lastMessage.content.trim().startsWith("LESSONS_LEARNED")
      ) {
        const playbookStep = activePlaybook?.steps.find((s) => s.name === step.key);
        const playbookCheck = playbookStep?.checks.find((c) => c.name === check.key);
        checksWithLessons.push({
          lesson: lastMessage.content,
          name: playbookCheck?.label || "",
        });
      }
    }
  }

  function updateCheckAttribute(
    sessionId: string | null,
    stepKey: string,
    checkKey: string,
    attribute: string | {},
    payload?: any
  ) {
    setSessions((prevSessions) => {
      const updatedSessions = prevSessions.map((s) => {
        if (s.uuid === sessionId) {
          if (!s.steps || !s.steps.find((step) => step.key === stepKey)) {
            // create the session step for the first time if necessary
            s = { ...s, steps: (s.steps || []).concat({ key: stepKey, checks: [] }) };
          }
          if (stepKey === "open-chat") {
            // XXX duplicative
            const updatedOpenChats = (s.openChats || []).map((openChat) => {
              if (openChat.key === checkKey) {
                const updatedCheck = { ...openChat };

                if (typeof attribute === "object") {
                  // If attribute is an object, merge it into the check
                  Object.assign(updatedCheck, attribute);
                } else if (attribute === "messages") {
                  const messagePayload = payload as Array<Message>;
                  updatedCheck.messages = messagePayload;
                } else if (attribute === "evidence") {
                  const evidencePayload = payload as EvidenceItem;
                  updatedCheck.evidence = (updatedCheck.evidence || []).concat(evidencePayload);
                } else if (attribute === "assertion") {
                  updatedCheck.assertion = payload as string;
                } else if (attribute === "openChatQuestion") {
                  updatedCheck.openChatQuestion = payload as string;
                } else {
                  //updatedCheck[attribute] = payload;
                }

                return updatedCheck;
              }
              return openChat;
            });
            const updatedSession = { ...s, openChats: updatedOpenChats };
            autosaveSession(updatedSession);
            return updatedSession;
          }
          const updatedSteps = (s.steps || []).map((step) => {
            if (step.key === stepKey) {
              if (!step.checks || !step.checks.find((check) => check.key === checkKey)) {
                // create the session check for the first time if necessary
                step = {
                  ...step,
                  checks: (step.checks || []).concat({
                    key: checkKey,
                    messages: [],
                    evidence: [],
                  }),
                };
              }
              const updatedChecks = (step.checks || []).map((check) => {
                if (check.key === checkKey) {
                  const updatedCheck = { ...check };

                  if (typeof attribute === "object") {
                    // If attribute is an object, merge it into the check
                    Object.assign(updatedCheck, attribute);
                  } else if (attribute === "messages") {
                    const messagePayload = payload as Array<Message>;
                    updatedCheck.messages = messagePayload;
                  } else if (attribute === "evidence") {
                    const evidencePayload = payload as EvidenceItem;
                    updatedCheck.evidence = (updatedCheck.evidence || []).concat(evidencePayload);
                  } else if (attribute === "assertion") {
                    updatedCheck.assertion = payload as string;
                  } else {
                    //updatedCheck[attribute] = payload;
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
          autosaveSession(updatedSession);
          return updatedSession;
        }
        return s;
      });
      return updatedSessions;
    });
  }

  const updateURL = (sessionId: string | null, focusValue: string | null) => {
    if (!hasHydrated) {
      // First time - read from URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionParam = urlParams.get("session");
      const sessionNameParam = urlParams.get("session-name");
      const focusParam = urlParams.get("focus");

      // Set focus immediately
      if (focusParam) {
        setFocus(focusParam);
      }

      if (sessionNameParam && !sessionsLoaded) {
        // sit tight until the sessions are loaded
        return;
      }

      if (sessionNameParam) {
        const sessionMatch = sessions.find((s) => s.name === sessionNameParam);
        const url = new URL(window.location.href);
        if (sessionMatch) {
          setActiveSessionId(sessionMatch.uuid);
        } else {
          // need to create a new session with this name
          const uuid = crypto.randomUUID();
          const newSession: Session = {
            uuid,
            name: sessionNameParam,
            createdAt: new Date().toISOString(),
            playbookName: "common-checks.yml",
            tableName: urlParams.get("table-name") || null,
            steps: [],
            openChats: [{ key: "chat-0", messages: [], evidence: [] }],
          };
          setSessions([...sessions, newSession]);
          setActiveSessionId(uuid);
          url.searchParams.set("session", uuid);
          url.searchParams.set("focus", "open-chat-0");

          // somewhat duplicative with blurTableName but different enough
          fetch(
            `/api/compass/verify-table?tableName=${encodeURIComponent(newSession.tableName || "")}`
          )
            .then((response) => response.json())
            .then((data) => {
              const tableDocumentation = data.tableDocumentation
                ? { tableDocumentation: data.tableDocumentation }
                : {};
              const updatedSession = Object.assign({}, newSession, tableDocumentation, {
                tableStatus: "SUCCESS",
                tableData: data.results,
                tableSql: data.sql,
              });
              setSessions((prevSessions) =>
                prevSessions.map((s) => (s.uuid === uuid ? updatedSession : s))
              );
              autosaveSession(updatedSession);
            })
            .catch((error) => {
              console.error("Error fetching table data:", error);
              const updatedSession = Object.assign({}, newSession, { tableStatus: "ERROR" });
              autosaveSession(updatedSession);
              setSessions((prevSessions) =>
                prevSessions.map((s) => (s.uuid === uuid ? updatedSession : s))
              );
            });
        }

        url.searchParams.delete("table-name");
        url.searchParams.delete("session-name");
        window.history.replaceState({}, "", url.toString());
        setHasHydrated(true);
        return;
      }

      // Handle session if it looks like an ID
      if (sessionParam?.match(/^[a-f0-9-]{36}$/i)) {
        setActiveSessionId(sessionParam);
      }

      setHasHydrated(true);
      return;
    }

    // Subsequent time - update URL
    const url = new URL(window.location.href);

    if (sessionId) {
      url.searchParams.set("session", sessionId);
    } else {
      url.searchParams.delete("session");
    }

    if (focusValue) {
      url.searchParams.set("focus", focusValue);
    } else {
      url.searchParams.delete("focus");
    }

    // Update URL without triggering a page reload
    window.history.replaceState({}, "", url.toString());
  };

  useEffect(() => {
    updateURL(activeSessionId, focus);
  }, [activeSessionId, focus, sessionsLoaded]);

  useEffect(() => {
    socketInitializer();
    if (!isSocketInitialized) {
      return;
    }
    socket.on("log", (incomingLog: string) => {
      console.log("server log", incomingLog);
    });
    socket.on("update", (type: string, keys: any, payload: Array<Message> | EvidenceItem) => {
      updateCheckAttribute(keys.sessionId, keys.stepKey, keys.checkKey, type, payload);
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
      setSessions((prevSessions) => {
        // Only update if we don't already have sessions
        return prevSessions.length === 0 ? data : prevSessions;
      });
      setSessionsLoaded(true);
    }

    loadSessions();
  }, []);

  const acceptAssertion = (
    stepKey: string,
    checkKey: string,
    messages: Array<Message>,
    assertion: string
  ) => {
    updateCheckAttribute(activeSessionId, stepKey, checkKey, "assertion", assertion);
    const playbookStep = activePlaybook?.steps.find((step) => step.name === stepKey);
    const playbookCheck = playbookStep?.checks.find((check) => check.name === checkKey);
    if (playbookCheck && stepKey !== "open-chat") {
      const lessonMessage = getLessonMessage(playbookCheck);
      appendMessage(stepKey, checkKey, messages, lessonMessage);
    }
  };

  const addOpenChat = () => {
    setSessions((prevSessions) => {
      const updatedSessions = prevSessions.map((s) => {
        if (s.uuid === activeSessionId) {
          let openChats;
          if (!s.openChats) {
            openChats = [{ key: "chat-0", messages: [], evidence: [] }];
          } else {
            openChats = s.openChats.concat([
              { key: `chat-${s.openChats.length}`, messages: [], evidence: [] },
            ]);
          }
          const updatedSession = { ...s, openChats };
          autosaveSession(updatedSession);
          return updatedSession;
        }
        return s;
      });
      return updatedSessions;
    });
  };

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
          .then((data) => {
            if (data.status === 200) {
              console.log("Session autosaved:", session.uuid, session.name);
            } else if (data.status >= 400) {
              console.log("Error autosaving session", data);
            }
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
          const tableDocumentation = data.tableDocumentation
            ? { tableDocumentation: data.tableDocumentation }
            : {};
          const updatedSession = Object.assign({}, activeSession, tableDocumentation, {
            tableStatus: "SUCCESS",
            tableData: data.results,
            tableSql: data.sql,
          });
          setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
          autosaveSession(updatedSession);
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
    autosaveSession(newSession);
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

  const appendMessage = (
    stepKey: string,
    checkKey: string,
    messages: Array<Message>,
    newMessage: string
  ) => {
    messages = messages.concat([{ role: "user", content: newMessage }]);
    socket.emit("inspection-check", {
      sessionId: activeSessionId,
      stepKey,
      checkKey,
      messages,
    });
    updateCheckAttribute(activeSessionId, stepKey, checkKey, "messages", messages);
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

  const setOpenChatQuestion = (question: string, checkKey: string) => {
    updateCheckAttribute(activeSessionId, "open-chat", checkKey, "openChatQuestion", question);
  };

  const setPlaybookName = (playbookName: string) => {
    const updatedSession = Object.assign({}, activeSession, { playbookName });
    setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
    autosaveSession(updatedSession);
  };

  const setTableName = (tableName: string) => {
    const updatedSession = Object.assign({}, activeSession, { tableName });
    setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
  };

  const setTableDocumentation = (tableDocumentation: string) => {
    const updatedSession = Object.assign({}, activeSession, { tableDocumentation });
    setSessions(sessions.map((s) => (s.uuid === activeSessionId ? updatedSession : s)));
  };

  const startCheck = () => {
    const effectiveSystemPrompt = systemPrompt || baseSystemPrompt;
    if (effectiveSystemPrompt && activeSession && activePlaybook && activeStep && activeCheck) {
      const populatedPrompt = populateSystemPrompt(
        effectiveSystemPrompt,
        activeSession,
        activePlaybook,
        activeStep,
        activeCheck
      );
      const messages = [{ role: "user", content: populatedPrompt }];
      socket.emit("inspection-check", {
        sessionId: activeSessionId,
        stepKey: activeStep.name,
        checkKey: activeCheck.name,
        messages,
      });
      updateCheckAttribute(activeSessionId, activeStep.name, activeCheck.name, {
        messages,
        evidence: [],
        assertion: null,
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
            Navbar={Navbar}
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
            ) : focus === "lessons-learned" ? (
              <div>
                {checksWithLessons?.map((check, index) => {
                  const content = check.lesson.replace("LESSONS_LEARNED", "").trim();
                  return (
                    <div key={index} className="ml-2 pl-2 border-b border-gray-400">
                      <h2 className="text-m font-semibold text-gray-700 mt-2 mb-4">{check.name}</h2>
                      <div className="whitespace-pre-wrap mb-4">{content}</div>
                    </div>
                  );
                })}
              </div>
            ) : activePlaybook && activeStep && activeCheck ? (
              <CheckPanel
                acceptAssertion={acceptAssertion}
                appendMessage={appendMessage}
                check={activeCheck}
                iconSet={iconSet}
                isOpenChat={!!activeOpenChat}
                playbook={activePlaybook}
                session={activeSession}
                setOpenChatQuestion={setOpenChatQuestion}
                startCheck={startCheck}
                step={activeStep}
              />
            ) : (
              <MainPanel session={activeSession} />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-[600px] flex-none overflow-y-auto overflow-x-hidden bg-gray-50 p-4 border-l text-[14px]">
            {activeSession && (
              <OutlineNav
                activePlaybook={activePlaybook}
                addOpenChat={addOpenChat}
                focus={focus}
                iconSet={iconSet}
                setFocus={setFocus}
                session={activeSession}
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

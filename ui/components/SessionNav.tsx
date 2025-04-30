import { Session } from "./types";

export const SessionNav = ({
  activeSessionId,
  createNewSession,
  sessions,
  setActiveSessionId,
}: {
  activeSessionId: string | null;
  createNewSession: Function;
  sessions: Array<Session>;
  setActiveSessionId: Function;
}) => {
  return (
    <div className="min-w-40 w-60 bg-gray-100 p-2 border-r overflow-y-auto text-[16px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Sessions</h3>
        <button onClick={createNewSession} className="text-sm text-blue-500">
          + New
        </button>
      </div>
      <ul>
        {sessions.map((session) => (
          <li
            key={session.uuid}
            className={`p-2 rounded cursor-pointer text-[14px] ${
              session.uuid === activeSessionId ? "bg-white shadow" : ""
            }`}
            onClick={() => setActiveSessionId(session.uuid)}
          >
            {session.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

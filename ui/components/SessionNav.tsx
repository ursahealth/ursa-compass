import { useEffect, useState } from "react";
import { Session } from "./types";

export const SessionNav = ({
  activeSessionId,
  createNewSession,
  deleteSession,
  renameSession,
  sessions,
  setActiveSessionId,
}: {
  activeSessionId: string | null;
  createNewSession: Function;
  deleteSession: Function;
  renameSession: Function;
  sessions: Array<Session>;
  setActiveSessionId: Function;
}) => {
  // inside the component that renders <ul>
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  /* close dropdown on any outside click */
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* helpers */
  const startRename = (s: { uuid: string; name: string }) => {
    setEditingId(s.uuid);
    setDraftName(s.name);
    setOpenMenuId(null);
  };

  const commitRename = (s: Session) => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== s.name) {
      renameSession(s.uuid, trimmed);
    }
    cancelRename();
  };

  const cancelRename = () => setEditingId(null);

  return (
    <div className="min-w-40 w-60 bg-gray-100 p-2 border-r overflow-y-auto text-[16px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Ursa Copilot</h3>
        <button onClick={() => createNewSession()} className="text-sm text-blue-500">
          + New Session
        </button>
      </div>
      <ul>
        {sessions.map((s) => {
          const isActive = s.uuid === activeSessionId;
          const menuOpen = s.uuid === openMenuId;
          const isEditing = s.uuid === editingId;

          return (
            <li
              key={s.uuid}
              onClick={() => setActiveSessionId(s.uuid)}
              className={`
                relative flex items-center justify-between gap-2
                p-2 rounded cursor-pointer text-sm
                ${isActive ? "bg-white shadow" : "hover:bg-gray-100"}
              `}
            >
              {/* session name */}
              {isEditing ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => commitRename(s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(s);
                    if (e.key === "Escape") cancelRename();
                  }}
                  className="flex-1 rounded border px-1 py-0.5 text-sm"
                />
              ) : (
                <span className="truncate">{s.name}</span>
              )}

              {/* hamburger button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // keep row-click from firing
                  setOpenMenuId(menuOpen ? null : s.uuid);
                }}
                className="p-1 -m-1 rounded hover:bg-gray-200 opacity-0 hover:opacity-100"
              >
                {/* three horizontal lines (SVG) */}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" fill="none" />
                </svg>
              </button>

              {/* dropdown */}
              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()} // keep dropdown clicks local
                  className="absolute right-2 top-full z-10 mt-1 w-36 rounded-md bg-white
                       shadow-lg ring-1 ring-black/5"
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() => startRename(s)}
                  >
                    Rename
                  </button>

                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm
                         text-red-600 hover:bg-red-50"
                    onClick={() => {
                      deleteSession(s.uuid);
                      setOpenMenuId(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

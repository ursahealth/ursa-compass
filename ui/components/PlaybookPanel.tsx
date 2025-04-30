import { Playbook, Session } from "./types";

export const PlaybookPanel = ({
  playbooks,
  activePlaybook,
  setActivePlaybookName,
}: {
  playbooks: Array<Playbook>;
  activePlaybook: Playbook | null;
  setActivePlaybookName: Function;
}) => {
  // return a dropdown of the playbooks, selecting one will set the activePlaybook
  return (
    <div>
      <select
        value={activePlaybook ? activePlaybook.filename : ""}
        onChange={(e) => {
          setActivePlaybookName(e.target.value);
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
  );
};

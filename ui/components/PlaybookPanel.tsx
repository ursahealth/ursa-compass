import { Playbook } from "../util/types";

export const PlaybookPanel = ({
  playbooks,
  activePlaybook,
  setPlaybookName,
}: {
  playbooks: Array<Playbook>;
  activePlaybook: Playbook | null;
  setPlaybookName: Function;
}) => {
  // return a dropdown of the playbooks, selecting one will set the activePlaybook
  return (
    <div>
      <select
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
  );
};

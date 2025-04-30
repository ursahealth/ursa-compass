import { Session } from "./types";

export const MainPanel = ({ session }: { session: Session }) => {
  return (
    <div>
      {JSON.stringify(session)}
    </div>
  );
};

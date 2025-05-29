import { Session } from "../util/types";

export const MainPanel = ({ session }: { session: Session }) => {
  return <div>{session.name}</div>;
};

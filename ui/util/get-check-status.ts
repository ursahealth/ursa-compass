import { Playbook, Session } from "./types";

export default function getCheckStatus(
  session: Session,
  playbook: Playbook,
  stepName: string,
  checkName: string
): string {
  const playbookStep = playbook.steps.find((s) => s.name === stepName);
  const playbookCheck = playbookStep?.checks.find((c) => c.name === checkName);
  if (playbookCheck?.dependencies && playbookCheck.dependencies.length > 0) {
    const dependencyStatuses = playbookCheck.dependencies.map((dep) => {
      const stepOfDependency = playbook.steps.find((s) => s.checks.some((c) => c.name === dep));
      return getCheckStatus(session, playbook, stepOfDependency?.name || stepName, dep);
    });
    if (dependencyStatuses.some((status) => status !== "FINISHED")) {
      return "LOCKED";
    }
  }

  const step = session.steps.find((s) => s.key === stepName);
  const check = step?.checks.find((c) => c.key === checkName);
  if (!check) {
    return "";
  }
  if (check.assertion) {
    return "FINISHED";
  }
  const lastMessage = (check.messages || [])[(check.messages || []).length - 1];
  if (
    lastMessage?.role === "assistant" &&
    lastMessage?.content &&
    (lastMessage.content.trim().startsWith("ASSERTION") ||
      lastMessage.content.trim().startsWith("ASK_USER"))
  ) {
    return "USER_ACTION";
  }

  return "UNDERWAY";
}

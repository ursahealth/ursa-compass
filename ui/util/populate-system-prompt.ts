import { PlaybookCheck, Playbook, Session, PlaybookStep } from "./types";

export default function populateSystemPrompt(
  systemPrompt: string,
  session: Session,
  playbook: Playbook,
  step: PlaybookStep,
  check: PlaybookCheck
): string {
  let text = systemPrompt;

  const sessionStep = session.steps.find((s) => s.key === step.name);
  let backgroundAssertions = "";
  let i = 1;
  for (const dep of check?.dependencies || []) {
    const depPlaybookCheck = step.checks.find((c) => c.name === dep);
    const depSessionCheck = (sessionStep?.checks || []).find((c) => c.key === dep);
    if (depPlaybookCheck && depSessionCheck?.assertion) {
      backgroundAssertions +=
        `\n\nBackground assertion ${i}: ${depPlaybookCheck.label}: ` +
        `\n\n${depSessionCheck.assertion}`;
      if (depSessionCheck.evidence && depSessionCheck.evidence.length > 0) {
        for (const evidence of depSessionCheck.evidence) {
          backgroundAssertions +=
            `\n\nEvidence for background assertion ${i}: ` +
            `\n\nSQL: ${evidence.sql}\nResult: ${JSON.stringify(evidence.result)}`;
        }
      }
      i++;
    }
  }

  text = text.replace(`{{tableName}}`, session.tableName || "");
  text = text.replace(`{{tableDocumentation}}`, session.tableDocumentation || "");
  text = text.replace(`{{tableSql}}`, session.tableSql || "");
  text = text.replace(`{{tableData}}`, JSON.stringify(session.tableData));
  text = text.replace(`{{playbookGoal}}`, playbook.goal || "");
  text = text.replace(`{{stepName}}`, step.label || "");
  text = text.replace(`{{stepDescription}}`, step.description || "");
  text = text.replace(`{{checkName}}`, check.label || "");
  text = text.replace(`{{checkDescription}}`, check.description || "");
  text = text.replace(`{{backgroundAssertions}}`, backgroundAssertions);
  return text;
}

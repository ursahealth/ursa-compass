import { Playbook, Step } from "./types";

export default function parsePlaybookYaml(filename: string, rawContent: string): Playbook {
  const lines = rawContent.replace(/\r\n?/g, "\n").split("\n");

  const playbook: Playbook = { filename, goal: "", rawContent, steps: [] };
  let currentStep: Step | null = null;
  let currentScope;
  let isAccumulatingDescription = false;
  let description = "";

  for (let raw of lines) {
    const line = raw.replace(/\t/g, "  "); // tabs → spaces
    if (!line.trim() || line.trim().startsWith("#")) continue; // skip blank/comment

    // LEVEL 0  (playbook key ignored – we start inside it)
    if (line.startsWith("  goal:")) {
      playbook.goal = line.split(/goal:\s*/)[1];
      continue;
    }

    if (isAccumulatingDescription && (line.trim().startsWith("-step") || line.trim().startsWith("- check:"))) {
      isAccumulatingDescription = false;
      if (currentScope === "step" && currentStep) {
        currentStep.description = description.trim();
      } else if (currentScope === "check" && currentStep && currentStep.checks.length > 0) {
        const lastCheck = currentStep.checks[currentStep.checks.length - 1];
        lastCheck.description = description.trim();
      }
    } else if (isAccumulatingDescription) {
      description += line.trim() + "\n";
      continue;
    }

    if (line.trim().startsWith("- step:")) {
      const name = line.split(/- step:\s*/)[1];
      currentStep = { name, goal: "", checks: [] };
      currentScope = "step";
      playbook.steps.push(currentStep);
      continue;
    }

    if (line.trim().startsWith("- check:") && currentStep) {
      const text = line.split(/- check:\s*/)[1];
      currentStep.checks.push({ name: text });
      currentScope = "check";
      continue;
    }
    
    if (line.trim().startsWith("description: |") && currentStep) {
      isAccumulatingDescription = true;
      description = "";
      continue;
    }

  }

  return playbook;
}


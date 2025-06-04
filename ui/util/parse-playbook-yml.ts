import { Playbook, PlaybookStep } from "./types";

export default function parsePlaybookYaml(filename: string, rawContent: string): Playbook {
  const lines = rawContent.replace(/\r\n?/g, "\n").split("\n");

  const playbook: Playbook = { filename, goal: "", rawContent, steps: [] };
  let currentStep: PlaybookStep | null = null;
  let currentScope;
  let isAccumulatingDescription = false;
  let description = "";
  let isAccumulatingDependencies = false;
  let dependencies: string[] = [];

  for (let raw of lines) {
    const line = raw.replace(/\t/g, "  "); // tabs → spaces
    if (!line.trim() || line.trim().startsWith("#")) continue; // skip blank/comment

    // LEVEL 0  (playbook key ignored – we start inside it)
    if (line.startsWith("  goal:")) {
      playbook.goal = line.split(/goal:\s*/)[1];
      continue;
    }

    if (
      isAccumulatingDescription &&
      (line.trim().startsWith("- step") ||
        line.trim().startsWith("- check:") ||
        line.trim().startsWith("dependencies:"))
    ) {
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

    if (
      isAccumulatingDependencies &&
      (line.trim().startsWith("- step") || line.trim().startsWith("- check:"))
    ) {
      isAccumulatingDependencies = false;
      if (currentScope === "step" && currentStep) {
        currentStep.dependencies = dependencies.map((dep) => dep.trim());
      } else if (currentScope === "check" && currentStep && currentStep.checks.length > 0) {
        const lastCheck = currentStep.checks[currentStep.checks.length - 1];
        lastCheck.dependencies = dependencies.map((dep) => dep.trim());
      }
    }

    if (isAccumulatingDependencies && line.trim().startsWith("- ")) {
      const lineNoComments = line.split("#")[0]; // Remove comments
      dependencies.push(lineNoComments.trim().substring(2)); // Remove leading "- "
      continue;
    }

    if (line.trim().startsWith("- step:")) {
      const name = line.split(/- step:\s*/)[1];
      currentStep = { name, checks: [] };
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

    if (line.trim().startsWith("description:") && currentStep) {
      let formattedDescription = line.split(/description:\s*/)[1];
      if (formattedDescription.startsWith('"') && formattedDescription.endsWith('"')) {
        formattedDescription = formattedDescription.slice(1, -1); // Remove quotes
      }
      if (currentScope === "step" && currentStep) {
        currentStep.description = formattedDescription;
      } else if (currentScope === "check" && currentStep && currentStep.checks.length > 0) {
        const lastCheck = currentStep.checks[currentStep.checks.length - 1];
        lastCheck.description = formattedDescription;
      }
      continue;
    }

    if (line.trim().startsWith("dependencies:") && currentStep) {
      isAccumulatingDependencies = true;
      dependencies = [];
      continue;
    }

    if (line.trim().startsWith("label:") && currentScope === "step" && currentStep) {
      currentStep.label = line.split(/label:\s*/)[1].trim();
      continue;
    }

    if (
      line.trim().startsWith("label:") &&
      currentScope === "check" &&
      currentStep &&
      currentStep.checks.length > 0
    ) {
      const lastCheck = currentStep.checks[currentStep.checks.length - 1];
      lastCheck.label = line.split(/label:\s*/)[1].trim();
      continue;
    }
  }

  return playbook;
}

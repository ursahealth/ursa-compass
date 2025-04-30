
export interface Session {
  uuid: string;
  name: string;
  tableName: string | null;
  createdAt: string; // ISO string, used to generate default name
  prompt: string;
  playbookYaml: string;
  focusedStep?: string;
}

export interface Check {
  check: string;
  query?: string;
}
export interface Step {
  name: string;
  goal: string;
  checks: Check[];
}
export interface Playbook {
  filename: string;
  rawContent: string;
  goal: string;
  steps: Step[];
}
export interface Parsed {
  steps: Step[];
}

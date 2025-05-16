
export interface Session {
  uuid: string;
  name: string;
  tableDocumentation?: string | undefined;
  tableName: string | null;
  tableData?: any;
  tableSql?: string | undefined;
  tableStatus?: string | undefined;
  createdAt: string; // ISO string, used to generate default name
  playbookName: string;
  focusedStep?: string;
}
export interface Check {
  name: string;
  description?: string;
}
export interface Step {
  name: string;
  description?: string;
  goal: string;
  checks: Check[];
}
export interface Playbook {
  filename: string;
  rawContent: string;
  goal: string;
  steps: Step[];
}
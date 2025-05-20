export interface Message {
  role: string;
  content: string;
}

export interface EvidenceItem {
  sql: string;
  results: any;
}

export interface SessionCheck {
  key: string;
  messages: Array<Message>;
  evidence: Array<EvidenceItem>;
}

export interface SessionStep {
  key: string;
  checks: Array<SessionCheck>;
}

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
  steps: Array<SessionStep>;
}
export interface PlaybookCheck {
  name: string;
  description?: string;
}
export interface PlaybookStep {
  name: string;
  description?: string;
  goal: string;
  checks: PlaybookCheck[];
}
export interface Playbook {
  filename: string;
  rawContent: string;
  goal: string;
  steps: PlaybookStep[];
}

export interface IExecution {
  _id: string;
  createdBy: string;
  playwrightProject: string;
  status: "completed" | "process";
  note: [];
  attachments: [];
  client: string;
  clinic: string;
  execution: string;
  bot: string;
  createdAt: string;
  updatedAt: string;
  jobId: string;
  playwrightExecutionId: string;
  pid: number;
  startedAt: string;
  finishedAt: string;
  logs?: string
}
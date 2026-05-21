interface IBot {
  botName: string;
  url: string;
  username: string;
  password: string;
}

interface IPatient {
  patientName: string;
  memberId: string;
  dateOfBirth: string;
}

export interface IExectionPost {
  bot: IBot;
  execution: {
    patients: IPatient[];
    numberOfThreads: number;
    mode: "parallel" | "";
    verificationType: "ELG" | "FBD";
  };
  config: {
    "in-network": boolean;
    shortForm: boolean;
    claimsForm: boolean;
  };
}

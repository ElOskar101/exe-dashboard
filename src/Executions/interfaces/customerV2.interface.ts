export interface ICustomer {
  _id: string;
  clientName: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  isFavorite?: boolean;
  user: string[];
}

export interface IAPIV2Res {
  customers: ICustomer[];
  query: {
    isActive?: boolean;
    user?: {
      $in: string[];
    };
  };
  totalDocs: number;
  totalPages: number;
}

export interface IAdminCustomer {
  _id: string;
  clientName: string;
  isActive: boolean;
  isImported: boolean;
  createdBy: { _id: string; fullName: string };
  clinic: Array<{ _id: string; clinicName: string }>;
  parallel: {
    _id: string;
    isActive: boolean;
    threads: number;
    isSmart: boolean;
    createdAt: string;
    updatedAt: string;
  };
  // parallel: string
  isDiva: boolean;
  plans: boolean;
  twoFA: boolean;
  user: Array<string>;
  pms: string;
  createdAt: string;
  updatedAt: string;
  isSharedRegExp: boolean;
  secretKey: string;
  forms: string;
  instantPrinter: boolean;
  alerts: boolean;
  statusPrinter: boolean;
  area: { _id: string; name: string };
  clientBots: Array<string>;
}

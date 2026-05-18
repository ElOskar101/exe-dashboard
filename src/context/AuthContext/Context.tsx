import { createContext } from "react";
import { IUser } from "../../interfaces/user.interface";

export interface IAuthContext {
    token: string, saveToken: (t: string) => void, clearToken: () => void, logout: () => void,
    permissions: Record<string, boolean>,
    user: IUser | null
}

export const AuthContext = createContext<IAuthContext>({
    saveToken: (t: string) => { },
    clearToken: () => { },
    logout: () => { },
    token: '',
    permissions: {},
    user: null
});
import { ReactElement, useCallback, useEffect, useState } from "react";
import { _base64Decode, _base64Encode } from "../../utils/common";
import { getUserData } from "../../services/auth.service";
import { redirectToLogin } from "../../utils/auth";
import { AuthContext } from "./Context";
import { IUser } from "../../interfaces/user.interface";

export const AuthProvider = (props: { children: ReactElement }) => {
    const { children } = props;
    const [token, setToken] = useState(localStorage.getItem("token") || '');
    const [permissions, setPermissions] = useState<Record<string, boolean>>({})
    const [user, setUser] = useState<IUser | null>(null)

    useEffect(() => {
        const savedPermissions = localStorage.getItem('permissions')
        if (savedPermissions) {
            setPermissions(() => {
                return JSON.parse(_base64Decode(savedPermissions))
            })
        } else {
            getUserData().then(({ data }) => {
                let newPermissions: Record<string, boolean> = {}
                data.roles.forEach((rol) => {
                    newPermissions[rol.name] = true
                    rol.permission.forEach((p) => {
                        newPermissions[p.name] = true
                    })
                })
                setUser(() => data)
                setPermissions(() => newPermissions)
                localStorage.setItem('permissions', _base64Encode(JSON.stringify(newPermissions)))
            })
        }
    }, [])

    const saveToken = useCallback((newToken: string) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    }, []);

    const clearToken = useCallback(() => {
        localStorage.removeItem("token");
        setToken('');
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("permissions");
        redirectToLogin(window.location.origin)
    }

    return (
        <AuthContext.Provider value={{ token, saveToken, clearToken, logout, permissions, user }}>
            {children}
        </AuthContext.Provider>
    );
};
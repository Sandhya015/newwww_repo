import React, { createContext, useState, ReactNode } from 'react';

interface UserContextType {
    // Get `access_token` from localStorage
    access_token: string | null;
    setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Get `access_token` from localStorage
    const [access_token, setAccessToken] = useState<string | null>(() => {
        const storedToken = localStorage.getItem('access_token');
        return storedToken ? storedToken : null;
    });

    return (
        <UserContext.Provider value={{ access_token, setAccessToken }}>
            {children}
        </UserContext.Provider>
    );
};

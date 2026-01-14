import React, { ReactNode } from 'react';

// Context
import { UserProvider } from './User/UserContext';
import { ThemeProvider } from './ThemeContext';

export const AppContextsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    return (
        <ThemeProvider>
            <UserProvider>
                {children}
            </UserProvider>
        </ThemeProvider>
    );
};

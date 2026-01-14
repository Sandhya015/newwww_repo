import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
    isSideBarOpen: boolean;
    toggleSidebar: () => void;
}

const SidebarContext = createContext({} as SidebarContextType);

export const SidebarProvider = (props: { children: React.ReactNode }) => {
    const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(true);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) {
                setIsSideBarOpen(false);
            } else {
                setIsSideBarOpen(true);
            }
        };

        handleResize(); // set initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSideBarOpen((prev) => !prev);
    };

    return (
        <SidebarContext.Provider value={{ isSideBarOpen, toggleSidebar }}>
            {props.children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    return useContext(SidebarContext);
};

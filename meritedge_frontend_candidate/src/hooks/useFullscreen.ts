import { useState, useEffect, useCallback } from 'react';

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
        };

        // Check if fullscreen is supported
        const checkSupport = () => {
            const support = !!(
                document.fullscreenEnabled ||
                (document as any).webkitFullscreenEnabled ||
                (document as any).mozFullScreenEnabled ||
                (document as any).msFullscreenEnabled
            );
            setIsSupported(support);
        };

        checkSupport();
        handleFullscreenChange();

        // Add event listeners for different browsers
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const enterFullscreen = useCallback(async () => {
        console.log('Attempting to enter fullscreen, isSupported:', isSupported);
        if (!isSupported) {
            console.warn('Fullscreen not supported');
            return false;
        }

        try {
            const element = document.documentElement;
            console.log('Available fullscreen methods:', {
                requestFullscreen: !!element.requestFullscreen,
                webkitRequestFullscreen: !!(element as any).webkitRequestFullscreen,
                mozRequestFullScreen: !!(element as any).mozRequestFullScreen,
                msRequestFullscreen: !!(element as any).msRequestFullscreen
            });
            
            if (element.requestFullscreen) {
                console.log('Using requestFullscreen');
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                console.log('Using webkitRequestFullscreen');
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
                console.log('Using mozRequestFullScreen');
                await (element as any).mozRequestFullScreen();
            } else if ((element as any).msRequestFullscreen) {
                console.log('Using msRequestFullscreen');
                await (element as any).msRequestFullscreen();
            }
            
            console.log('Fullscreen request completed');
            return true;
        } catch (error) {
            console.error('Error entering fullscreen:', error);
            return false;
        }
    }, [isSupported]);

    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
            
            return true;
        } catch (error) {
            console.error('Error exiting fullscreen:', error);
            return false;
        }
    }, []);

    const toggleFullscreen = useCallback(async () => {
        console.log('Toggle fullscreen called, current state:', { isFullscreen });
        if (isFullscreen) {
            console.log('Exiting fullscreen');
            return await exitFullscreen();
        } else {
            console.log('Entering fullscreen');
            return await enterFullscreen();
        }
    }, [isFullscreen, enterFullscreen, exitFullscreen]);

    return {
        isFullscreen,
        isSupported,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen
    };
};

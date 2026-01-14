import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { enableSecureMode, disableSecureMode, setSecureModeLoading } from '../store/miscSlice';

// Read secure mode configuration from environment variables
// Development: false, Staging/Production: true
const SECURE_MODE_ENABLED = import.meta.env.VITE_SECURE_MODE_ENABLED === 'true';

export const useSecureMode = () => {
  const dispatch = useDispatch();
  const secureMode = useSelector((state: any) => state.misc?.secureMode);
  const secureModeLoading = useSelector((state: any) => state.misc?.secureModeLoading);
  const tokenValidation = useSelector((state: any) => state.misc?.tokenValidation);

  // Check if token validation is successful
  const isTokenValid = tokenValidation?.valid === true && tokenValidation?.expired === false;

  // Enable secure mode
  const activateSecureMode = useCallback(async () => {
    console.log('activateSecureMode called, current state:', { secureMode, secureModeLoading });
    
    if (secureMode) {
      console.log('Already in secure mode, returning');
      return; // Already in secure mode
    }

    console.log('Setting secure mode loading to true');
    dispatch(setSecureModeLoading(true));
    
    try {
      // Note: We don't try to enter fullscreen automatically here because
      // modern browsers require user interaction. The fullscreen modal will handle this.
      
      // Dispatch secure mode enabled
      console.log('Dispatching enableSecureMode...');
      dispatch(enableSecureMode());
      
      console.log('Secure mode activated successfully (fullscreen will be handled by modal)');
    } catch (error) {
      console.error('Failed to activate secure mode:', error);
      dispatch(setSecureModeLoading(false));
    }
  }, [dispatch, secureMode]);

  // Disable secure mode
  const deactivateSecureMode = useCallback(async () => {
    if (!secureMode) return; // Already not in secure mode

    try {
      // Exit fullscreen mode
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }

      // Dispatch secure mode disabled
      dispatch(disableSecureMode());
      
      console.log('Secure mode deactivated successfully');
    } catch (error) {
      console.error('Failed to deactivate secure mode:', error);
    }
  }, [dispatch, secureMode]);

  // Auto-activate secure mode when token is validated
  useEffect(() => {
    console.log('Secure mode hook - Token validation check:', {
      isTokenValid,
      secureMode,
      secureModeLoading,
      tokenValidation,
      SECURE_MODE_ENABLED
    });
    
    // Only activate if secure mode is enabled and token is valid
    // For testing: Also activate if no token validation is present (assume valid)
    if (SECURE_MODE_ENABLED && (isTokenValid || !tokenValidation) && !secureMode && !secureModeLoading) {
      console.log('Activating secure mode...', isTokenValid ? 'Token validated' : 'No token validation (testing mode)');
      activateSecureMode();
    }
  }, [isTokenValid, secureMode, secureModeLoading, activateSecureMode, tokenValidation]);

  // Security features when in secure mode
  useEffect(() => {
    if (!secureMode || !SECURE_MODE_ENABLED) return;

    // Disable right-click (but allow clicks on buttons)
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu on input fields and buttons
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+P
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Alt+Tab (Switch Windows)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection (but allow on inputs and buttons)
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') {
        return; // Allow selection in form fields
      }
      e.preventDefault();
      return false;
    };

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable copy/paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return; // Allow paste in form fields
      }
      e.preventDefault();
      return false;
    };

    // Disable cut
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent window blur (alt+tab detection)
    const handleBlur = () => {
      if (document.hasFocus()) {
        // Focus back to prevent alt+tab
        window.focus();
      }
    };

    // Add event listeners (don't use capture phase to allow button clicks)
    document.addEventListener('contextmenu', handleContextMenu, false);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('selectstart', handleSelectStart, false);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('paste', handlePaste, false); // Allow paste in inputs
    document.addEventListener('cut', handleCut, true);
    window.addEventListener('blur', handleBlur, false);

    // Disable developer tools detection
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    const setDevtoolsStatus = (status: boolean) => {
      if (devtools.open !== status) {
        devtools.open = status;
        if (status) {
          console.clear();
          console.log('%cDeveloper Tools Detected!', 'color: red; font-size: 50px; font-weight: bold;');
          console.log('%cThis assessment is being monitored for security.', 'color: red; font-size: 20px;');
          
          // Optionally redirect or show warning
          alert('Developer tools detected. Please close them to continue with the assessment.');
        }
      }
    };

    // Check for devtools
    const checkDevtools = () => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        setDevtoolsStatus(true);
      } else {
        setDevtoolsStatus(false);
      }
    };

    // Run devtools check periodically
    const devtoolsInterval = setInterval(checkDevtools, 500);

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, false);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('selectstart', handleSelectStart, false);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('paste', handlePaste, false);
      document.removeEventListener('cut', handleCut, true);
      window.removeEventListener('blur', handleBlur, false);
      clearInterval(devtoolsInterval);
    };
  }, [secureMode]);

  // Monitor fullscreen changes (optional - don't force re-entry)
  useEffect(() => {
    if (!SECURE_MODE_ENABLED) return;
    
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (secureMode) {
        console.log('Fullscreen status changed:', isFullscreen ? 'ENTERED' : 'EXITED');
        // Note: We don't force re-entry as it requires user interaction
      }
    };

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
  }, [secureMode]);

  return {
    secureMode,
    secureModeLoading,
    isTokenValid,
    activateSecureMode,
    deactivateSecureMode,
    SECURE_MODE_ENABLED // Include flag for debugging
  };
};

import { useState, useEffect } from 'react';
import { TestConfigService, TestConfig, defaultTestConfig } from '../config/testConfig';

export const useTestConfig = (testType?: string) => {
  const [config, setConfig] = useState<TestConfig>(defaultTestConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedConfig = await TestConfigService.loadConfig(testType);
        setConfig(loadedConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        console.error('Error loading test configuration:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [testType]);

  // Helper functions for common config checks
  const isFullscreenRequired = () => TestConfigService.isFullscreenRequired();
  const isFullscreenEnabled = () => TestConfigService.isFullscreenEnabled();
  const shouldShowFullscreenModal = () => TestConfigService.shouldShowFullscreenModal();
  const canSkipFullscreen = () => TestConfigService.canSkipFullscreen();
  const isProctoringEnabled = () => TestConfigService.isProctoringEnabled();
  const isCameraRequired = () => TestConfigService.isCameraRequired();
  const getTimeLimitDuration = () => TestConfigService.getTimeLimitDuration();
  const isTimeLimitEnabled = () => TestConfigService.isTimeLimitEnabled();

  return {
    config,
    loading,
    error,
    // Helper functions
    isFullscreenRequired,
    isFullscreenEnabled,
    shouldShowFullscreenModal,
    canSkipFullscreen,
    isProctoringEnabled,
    isCameraRequired,
    getTimeLimitDuration,
    isTimeLimitEnabled,
    // Update config
    updateConfig: (newConfig: Partial<TestConfig>) => {
      TestConfigService.updateConfig(newConfig);
      setConfig(TestConfigService.getConfig());
    },
  };
};

// Test Configuration Interface
export interface TestConfig {
  fullscreen: {
    enabled: boolean;
    required: boolean;
    showModal: boolean;
    allowSkip: boolean;
  };
  proctoring: {
    enabled: boolean;
    cameraRequired: boolean;
    screenRecording: boolean;
  };
  timeLimit: {
    enabled: boolean;
    duration: number; // in minutes
    showWarning: boolean;
    warningThreshold: number; // percentage when to show warning
  };
  navigation: {
    allowTabSwitch: boolean;
    allowBackButton: boolean;
    allowRefresh: boolean;
  };
  questions: {
    allowSkip: boolean;
    allowFlag: boolean;
    allowReview: boolean;
    shuffleOrder: boolean;
  };
}

// Default Configuration
export const defaultTestConfig: TestConfig = {
  fullscreen: {
    enabled: true,
    required: false,
    showModal: true,
    allowSkip: true,
  },
  proctoring: {
    enabled: true,
    cameraRequired: true,
    screenRecording: true,
  },
  timeLimit: {
    enabled: true,
    duration: 45, // 45 minutes
    showWarning: true,
    warningThreshold: 20, // Show warning at 20% time remaining
  },
  navigation: {
    allowTabSwitch: false,
    allowBackButton: false,
    allowRefresh: false,
  },
  questions: {
    allowSkip: true,
    allowFlag: true,
    allowReview: true,
    shuffleOrder: false,
  },
};

// Configuration Service
export class TestConfigService {
  private static config: TestConfig = defaultTestConfig;

  // Load configuration from backend
  static async loadConfig(testType?: string): Promise<TestConfig> {
    try {
      // TODO: Replace with actual backend API call
      // const response = await fetch(`/api/test/config?type=${testType || 'default'}`);
      // const config = await response.json();
      // this.config = { ...defaultTestConfig, ...config };
      
      // For now, return default config based on test type
      if (testType) {
        this.config = this.getConfigByType(testType);
      } else {
        this.config = defaultTestConfig;
      }
      
      return this.config;
    } catch (error) {
      console.error('Failed to load test configuration:', error);
      return defaultTestConfig;
    }
  }

  // Get configuration by test type (for demo purposes)
  private static getConfigByType(testType: string): TestConfig {
    switch (testType) {
      case 'strict':
        return {
          ...defaultTestConfig,
          fullscreen: { ...defaultTestConfig.fullscreen, required: true, allowSkip: false },
          proctoring: { ...defaultTestConfig.proctoring, enabled: true },
        };
      case 'practice':
        return {
          ...defaultTestConfig,
          fullscreen: { ...defaultTestConfig.fullscreen, required: false, allowSkip: true },
          proctoring: { ...defaultTestConfig.proctoring, enabled: false },
        };
      case 'demo':
        return {
          ...defaultTestConfig,
          fullscreen: { ...defaultTestConfig.fullscreen, enabled: false, showModal: false },
          proctoring: { ...defaultTestConfig.proctoring, enabled: false },
        };
      default:
        return defaultTestConfig;
    }
  }

  // Get current configuration
  static getConfig(): TestConfig {
    return this.config;
  }

  // Update configuration
  static updateConfig(newConfig: Partial<TestConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Check if fullscreen is required
  static isFullscreenRequired(): boolean {
    return this.config.fullscreen.required;
  }

  // Check if fullscreen is enabled
  static isFullscreenEnabled(): boolean {
    return this.config.fullscreen.enabled;
  }

  // Check if fullscreen modal should be shown
  static shouldShowFullscreenModal(): boolean {
    return this.config.fullscreen.enabled && this.config.fullscreen.showModal;
  }

  // Check if fullscreen can be skipped
  static canSkipFullscreen(): boolean {
    return this.config.fullscreen.allowSkip;
  }

  // Check if proctoring is enabled
  static isProctoringEnabled(): boolean {
    return this.config.proctoring.enabled;
  }

  // Check if camera is required
  static isCameraRequired(): boolean {
    return this.config.proctoring.cameraRequired;
  }

  // Get time limit duration
  static getTimeLimitDuration(): number {
    return this.config.timeLimit.duration;
  }

  // Check if time limit is enabled
  static isTimeLimitEnabled(): boolean {
    return this.config.timeLimit.enabled;
  }
}

// Example configurations for different test scenarios
import { TestConfig } from './testConfig';

// Example 1: Strict Assessment Configuration
export const strictAssessmentConfig: TestConfig = {
  fullscreen: {
    enabled: true,
    required: true, // Fullscreen is mandatory
    showModal: true,
    allowSkip: false, // Cannot skip fullscreen
  },
  proctoring: {
    enabled: true,
    cameraRequired: true,
    screenRecording: true,
  },
  timeLimit: {
    enabled: true,
    duration: 60, // 60 minutes
    showWarning: true,
    warningThreshold: 15, // Warning at 15% time remaining
  },
  navigation: {
    allowTabSwitch: false,
    allowBackButton: false,
    allowRefresh: false,
  },
  questions: {
    allowSkip: false,
    allowFlag: true,
    allowReview: false,
    shuffleOrder: true,
  },
};

// Example 2: Practice Test Configuration
export const practiceTestConfig: TestConfig = {
  fullscreen: {
    enabled: true,
    required: false, // Fullscreen is optional
    showModal: true,
    allowSkip: true, // Can skip fullscreen
  },
  proctoring: {
    enabled: false, // No proctoring for practice
    cameraRequired: false,
    screenRecording: false,
  },
  timeLimit: {
    enabled: true,
    duration: 30, // 30 minutes
    showWarning: true,
    warningThreshold: 25,
  },
  navigation: {
    allowTabSwitch: true, // More lenient for practice
    allowBackButton: true,
    allowRefresh: true,
  },
  questions: {
    allowSkip: true,
    allowFlag: true,
    allowReview: true,
    shuffleOrder: false,
  },
};

// Example 3: Demo Test Configuration
export const demoTestConfig: TestConfig = {
  fullscreen: {
    enabled: false, // No fullscreen for demo
    required: false,
    showModal: false,
    allowSkip: true,
  },
  proctoring: {
    enabled: false,
    cameraRequired: false,
    screenRecording: false,
  },
  timeLimit: {
    enabled: true,
    duration: 10, // 10 minutes
    showWarning: true,
    warningThreshold: 30,
  },
  navigation: {
    allowTabSwitch: true,
    allowBackButton: true,
    allowRefresh: true,
  },
  questions: {
    allowSkip: true,
    allowFlag: true,
    allowReview: true,
    shuffleOrder: false,
  },
};

// Example 4: Corporate Assessment Configuration
export const corporateAssessmentConfig: TestConfig = {
  fullscreen: {
    enabled: true,
    required: true,
    showModal: true,
    allowSkip: false,
  },
  proctoring: {
    enabled: true,
    cameraRequired: true,
    screenRecording: true,
  },
  timeLimit: {
    enabled: true,
    duration: 90, // 90 minutes
    showWarning: true,
    warningThreshold: 10,
  },
  navigation: {
    allowTabSwitch: false,
    allowBackButton: false,
    allowRefresh: false,
  },
  questions: {
    allowSkip: false,
    allowFlag: true,
    allowReview: false,
    shuffleOrder: true,
  },
};

// Example 5: Mobile-Friendly Configuration
export const mobileFriendlyConfig: TestConfig = {
  fullscreen: {
    enabled: false, // Disabled for mobile
    required: false,
    showModal: false,
    allowSkip: true,
  },
  proctoring: {
    enabled: true,
    cameraRequired: false, // Camera not required on mobile
    screenRecording: false,
  },
  timeLimit: {
    enabled: true,
    duration: 45,
    showWarning: true,
    warningThreshold: 20,
  },
  navigation: {
    allowTabSwitch: true, // More lenient for mobile
    allowBackButton: true,
    allowRefresh: true,
  },
  questions: {
    allowSkip: true,
    allowFlag: true,
    allowReview: true,
    shuffleOrder: false,
  },
};





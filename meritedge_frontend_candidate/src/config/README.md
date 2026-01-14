# Test Configuration System

This directory contains the configuration system for the test application, allowing backend-driven configuration of various test features.

## Files

- `testConfig.ts` - Main configuration interface and service
- `testConfigExamples.ts` - Example configurations for different test scenarios
- `README.md` - This documentation file

## Configuration Interface

The `TestConfig` interface defines all configurable aspects of the test:

```typescript
interface TestConfig {
  fullscreen: {
    enabled: boolean;        // Whether fullscreen is available
    required: boolean;       // Whether fullscreen is mandatory
    showModal: boolean;      // Whether to show fullscreen modal
    allowSkip: boolean;      // Whether user can skip fullscreen
  };
  proctoring: {
    enabled: boolean;        // Whether proctoring is enabled
    cameraRequired: boolean; // Whether camera is required
    screenRecording: boolean; // Whether screen recording is enabled
  };
  timeLimit: {
    enabled: boolean;        // Whether time limit is enforced
    duration: number;        // Duration in minutes
    showWarning: boolean;    // Whether to show time warnings
    warningThreshold: number; // Percentage when to show warning
  };
  navigation: {
    allowTabSwitch: boolean; // Whether tab switching is allowed
    allowBackButton: boolean; // Whether back button is allowed
    allowRefresh: boolean;   // Whether page refresh is allowed
  };
  questions: {
    allowSkip: boolean;      // Whether questions can be skipped
    allowFlag: boolean;      // Whether questions can be flagged
    allowReview: boolean;    // Whether questions can be reviewed
    shuffleOrder: boolean;   // Whether to shuffle question order
  };
}
```

## Usage

### Basic Usage

```typescript
import { useTestConfig } from '../hooks/useTestConfig';

function TestComponent() {
  const {
    config,
    loading,
    error,
    isFullscreenEnabled,
    canSkipFullscreen,
    // ... other helpers
  } = useTestConfig();

  if (loading) return <div>Loading configuration...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {isFullscreenEnabled() && (
        <FullscreenButton />
      )}
      {/* Rest of component */}
    </div>
  );
}
```

### With Test Type

```typescript
// For different test types
const config = useTestConfig('strict');    // Strict assessment
const config = useTestConfig('practice');  // Practice test
const config = useTestConfig('demo');      // Demo test
const config = useTestConfig('default');   // Default configuration
```

### Direct Service Usage

```typescript
import { TestConfigService } from '../config/testConfig';

// Load configuration
const config = await TestConfigService.loadConfig('strict');

// Check specific settings
if (TestConfigService.isFullscreenRequired()) {
  // Handle required fullscreen
}

if (TestConfigService.canSkipFullscreen()) {
  // Show skip option
}
```

## Example Configurations

### Strict Assessment
- Fullscreen required, cannot be skipped
- Proctoring enabled with camera and screen recording
- No tab switching, back button, or refresh allowed
- Questions cannot be skipped or reviewed
- Questions are shuffled

### Practice Test
- Fullscreen optional, can be skipped
- No proctoring
- Tab switching and navigation allowed
- All question features enabled
- Questions not shuffled

### Demo Test
- No fullscreen
- No proctoring
- All navigation allowed
- All question features enabled
- Short time limit

## Backend Integration

To integrate with your backend, update the `loadConfig` method in `TestConfigService`:

```typescript
static async loadConfig(testType?: string): Promise<TestConfig> {
  try {
    const response = await fetch(`/api/test/config?type=${testType || 'default'}`);
    const config = await response.json();
    this.config = { ...defaultTestConfig, ...config };
    return this.config;
  } catch (error) {
    console.error('Failed to load test configuration:', error);
    return defaultTestConfig;
  }
}
```

## Configuration Examples

See `testConfigExamples.ts` for complete examples of different configuration scenarios:

- `strictAssessmentConfig` - For high-security assessments
- `practiceTestConfig` - For practice sessions
- `demoTestConfig` - For demonstrations
- `corporateAssessmentConfig` - For corporate assessments
- `mobileFriendlyConfig` - For mobile devices

## Adding New Configuration Options

1. Add the new option to the `TestConfig` interface
2. Update the `defaultTestConfig` with a default value
3. Add helper methods to `TestConfigService` if needed
4. Update the `useTestConfig` hook to expose the new option
5. Update components to use the new configuration

## Testing Different Configurations

You can test different configurations by changing the test type parameter in the `useTestConfig` hook:

```typescript
// In Test.tsx
const config = useTestConfig('strict'); // Try 'practice', 'demo', etc.
```

This allows you to easily test how the application behaves with different configuration settings without changing the backend.






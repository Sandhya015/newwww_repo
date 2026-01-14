# 🎓 MeritEdge - Candidate Assessment Platform

A comprehensive, secure online assessment platform for conducting candidate evaluations with real-time proctoring and multi-format question support.

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![React](https://img.shields.io/badge/react-19.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7.2-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🌟 Overview

MeritEdge is a modern web application designed to conduct secure online assessments for candidate evaluation. The platform supports multiple question formats, real-time proctoring through camera and screen capture, and provides a secure testing environment to maintain assessment integrity.

### Business Value

- **Automated Assessment Delivery**: Streamline candidate evaluation process
- **Real-Time Proctoring**: Monitor candidates during assessments
- **Flexible Question Types**: MCQ, Coding, Dynamic questions
- **Secure Environment**: Prevent cheating with secure browser mode
- **Cloud Storage**: Scalable media storage with AWS S3
- **Data Analytics**: Track candidate performance and behavior

---

## ✨ Key Features

### 🔐 Security & Proctoring
- **Secure Browser Mode**: Prevents access to external tools and resources
- **Camera Monitoring**: Periodic photo captures of candidates
- **Screen Recording**: Continuous screen capture during assessment
- **Tab Switch Detection**: Logs when candidates leave the test window
- **Event Tracking**: Comprehensive audit trail of all activities

### 📝 Question Types
- **Multiple Choice Questions (MCQ)**: Traditional Q&A format with multiple options
- **Coding Questions**: Live code editing with syntax highlighting
- **Dynamic Questions**: Flexible formats including match-the-following, code blocks, etc.
- **Mixed Assessments**: Combine multiple question types in one test

### ⏱️ Assessment Management
- **Timed Sections**: Configure different time limits per section
- **Auto-Save**: Automatic answer saving to prevent data loss
- **Progress Tracking**: Real-time completion status
- **Auto-Submission**: Automatic submission when time expires
- **Section Navigation**: Easy movement between test sections

### 📊 Data Collection
- **Candidate Information**: Profile data collection and validation
- **Answer Recording**: Real-time response tracking
- **Media Storage**: Secure cloud storage for images and videos
- **Event Logging**: Complete activity audit trail
- **Performance Metrics**: Time tracking and analytics

---

## 🛠️ Tech Stack

### Frontend Framework
- **React 19.0.0**: UI component library
- **TypeScript 5.7.2**: Type-safe development
- **Vite 6.2.0**: Fast build tool and dev server

### State Management
- **Redux Toolkit 2.7.0**: Global state management
- **Redux Persist 6.0.0**: State persistence

### Routing & Navigation
- **React Router DOM 7.5.0**: Client-side routing

### UI Components & Styling
- **Tailwind CSS 4.1.3**: Utility-first CSS framework
- **Ant Design 5.24.9**: React UI component library
- **PrimeReact 10.9.5**: Additional UI components
- **Lucide React 0.488.0**: Icon library

### Rich Text Editing
- **TipTap 2.14.0**: Modern rich text editor
- **CKEditor 5**: Alternative rich text editor
- **Lowlight**: Syntax highlighting for code blocks

### Form Management
- **Formik 2.4.6**: Form state management
- **Yup 1.6.1**: Form validation

### Media Capture
- **React Webcam 7.2.0**: Camera integration
- **React Easy Crop 5.4.2**: Image cropping

### Cloud Services
- **AWS SDK S3 Client 3.901.0**: S3 upload integration

### Additional Libraries
- **DnD Kit**: Drag and drop functionality
- **React Hot Toast**: Notification system
- **React Countup**: Number animations
- **Recharts**: Data visualization
- **Dayjs Parser**: Date/time parsing

### Development Tools
- **ESLint 9.21.0**: Code linting
- **TypeScript ESLint**: TypeScript-specific linting rules
- **Vite Plugin React**: React support for Vite

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (recommended: v20.x)
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Modern Browser**: Chrome, Firefox, or Edge (latest versions)

### System Requirements

- **OS**: Linux, macOS, or Windows
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space
- **Internet**: Stable broadband connection

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://gitlab.com/otomeyt/meritedge_frontend_candidate.git
cd meritedge_frontend_candidate
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages from `package.json`.

### 3. Environment Setup

Create environment files for different environments:

```bash
# Development environment (already configured)
# .env.development

# Staging environment
# .env.staging

# Production environment
# .env.production
```

See [Environment Configuration](#environment-configuration) section for details.

### 4. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173` (default Vite port).

---

## 🔧 Environment Configuration

The application uses environment-specific configurations for different deployment stages.

### Environment Files

| File | Purpose | API URL |
|------|---------|---------|
| `.env.development` | Local development | Development API server |
| `.env.staging` | Pre-production testing | Staging API server |
| `.env.production` | Live production | Production API server |
| `.env.example` | Template reference | N/A |

### Environment Variables

#### Required Variables:

```bash
# API Configuration
VITE_API_URL=https://your-api-server.com/api/v1
```

#### Optional Variables:

```bash
# AWS S3 Configuration (if needed in frontend)
VITE_S3_BUCKET=your-bucket-name
VITE_S3_REGION=ap-south-1

# Feature Flags
VITE_ENABLE_SECURE_MODE=true
VITE_ENABLE_PROCTORING=true
```

### Important Notes:

⚠️ **Variable Prefix**: All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

⚠️ **Security**: Never commit `.env.*` files with sensitive data. Use `.env.example` as a template.

⚠️ **Restart Required**: Changes to `.env` files require restarting the dev server.

**For detailed environment setup, see:** [`ENV_SETUP.md`](./ENV_SETUP.md)

---

## 📜 Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev

# Expected output:
# 🔧 Environment: development
# 🌐 API Base URL: https://dev-api-server.com/api/v1
# 
# VITE v6.2.0  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### Building

```bash
# Production build (uses .env.production)
npm run build

# Staging build (uses .env.staging)
npm run build:staging

# Development build (uses .env.development)
npm run build:dev
```

Build output will be in the `dist/` directory.

### Preview

```bash
# Preview production build locally
npm run preview
```

### Linting

```bash
# Run ESLint to check code quality
npm run lint
```

### Type Checking

```bash
# Run TypeScript compiler for type checking (no emit)
tsc --noEmit
```

---

## 📁 Project Structure

```
meritedge_frontend_candidate/
├── public/                          # Static assets
│   ├── assessment/                  # Assessment-specific images
│   ├── common/                      # Common assets (logos, icons)
│   └── test/                        # Test-related assets
│
├── src/                             # Source code
│   ├── components/                  # React components
│   │   ├── Common/                  # Shared components
│   │   │   ├── CountdownTimer.tsx   # Timer component
│   │   │   └── MissingCandidateModal.tsx
│   │   ├── Layout/                  # Layout components
│   │   │   └── UserLayout.tsx       # Main layout wrapper
│   │   └── Test/                    # Test-related components
│   │       ├── CodingQuestion.tsx   # Coding question display
│   │       ├── CodingQuestionTab.tsx
│   │       ├── DynamicQuestionContent.tsx
│   │       ├── DynamicQuestionDisplay.tsx
│   │       ├── FullscreenModal.tsx  # Fullscreen mode handler
│   │       ├── questions/           # Question type components
│   │       │   ├── CodingQuestion.tsx
│   │       │   ├── DynamicQuestion.tsx
│   │       │   └── MCQQuestion.tsx
│   │       └── tabs/                # Test tab components
│   │           ├── InstructionsTab.tsx
│   │           ├── QuestionTab.tsx
│   │           └── SolutionTab.tsx
│   │
│   ├── config/                      # Configuration files
│   │   ├── apiConfig.ts             # API endpoints configuration
│   │   ├── imageCaptureConfig.ts    # Image capture settings
│   │   ├── testConfig.ts            # Test configuration
│   │   ├── testConfigExamples.ts    # Test config examples
│   │   └── videoCaptureConfig.ts    # Video capture settings
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useCandidateId.ts        # Candidate ID management
│   │   ├── useFullscreen.ts         # Fullscreen mode control
│   │   ├── useImageCapture.ts       # Image capture functionality
│   │   ├── useQuestions.ts          # Question fetching logic
│   │   ├── useScreenCapture.ts      # Screen capture functionality
│   │   ├── useSecureMode.ts         # Secure browser mode
│   │   ├── useTestConfig.ts         # Test configuration hook
│   │   └── useVideoCapture.ts       # Video capture functionality
│   │
│   ├── pages/                       # Page components
│   │   ├── Assessment/              # Assessment flow pages
│   │   │   ├── Assessment.tsx       # Landing page
│   │   │   ├── AssessmentForm.tsx   # Candidate info form
│   │   │   ├── AssessmentGuideline.tsx
│   │   │   ├── Section1Instruction.tsx
│   │   │   └── Section2Instruction.tsx
│   │   ├── Common/                  # Error pages
│   │   │   ├── InternalServerError.jsx
│   │   │   └── NotFound.jsx
│   │   ├── Test/                    # Test execution pages
│   │   │   ├── AssessmentSuccess.tsx
│   │   │   └── Test.tsx             # Main test interface
│   │   └── CameraCapture.tsx        # Camera testing page
│   │
│   ├── services/                    # API and service layer
│   │   ├── imageCaptureService.ts   # Image capture service
│   │   ├── questionApi.ts           # Question fetching API
│   │   ├── questionTypesApi.ts      # Question types API
│   │   ├── s3UploadService.ts       # S3 upload service
│   │   ├── screenCaptureService.ts  # Screen capture service
│   │   ├── screenS3UploadService.ts # Screen S3 upload
│   │   ├── videoCaptureService.ts   # Video capture service
│   │   └── videoS3UploadService.ts  # Video S3 upload
│   │
│   ├── store/                       # Redux store
│   │   ├── miscSlice.ts             # Misc state slice
│   │   └── store.ts                 # Store configuration
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── imageCapture.ts          # Image capture types
│   │   └── videoCapture.ts          # Video capture types
│   │
│   ├── utils/                       # Utility functions
│   │   ├── candidateIdUtils.ts      # Candidate ID utilities
│   │   └── maskUtils.ts             # Data masking utilities
│   │
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Application entry point
│   ├── index.css                    # Global styles
│   └── vite-env.d.ts                # Vite type definitions
│
├── .env.development                 # Development environment variables
├── .env.staging                     # Staging environment variables
├── .env.production                  # Production environment variables
├── .env.example                     # Environment template
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML entry point
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json                # App-specific TS config
├── tsconfig.node.json               # Node-specific TS config
├── vite.config.ts                   # Vite configuration
└── README.md                        # This file
```

---

## 👨‍💻 Development Guide

### Code Style

This project follows standard React and TypeScript best practices:

- **Components**: Use functional components with hooks
- **TypeScript**: Strict type checking enabled
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Structure**: One component per file
- **Imports**: Group and order imports (libraries → components → types → utils)

### Component Creation

```typescript
// Example: Creating a new component
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4">
      <h2>{title}</h2>
      <button onClick={onAction}>Click Me</button>
    </div>
  );
};

export default MyComponent;
```

### Custom Hooks

```typescript
// Example: Creating a custom hook
import { useState, useEffect } from 'react';

export const useCustomHook = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // Side effects here
  }, [value]);

  return { value, setValue };
};
```

### API Integration

```typescript
// Use centralized API configuration
import { API_ENDPOINTS } from '../config/apiConfig';

// Example: Fetching data
const fetchData = async () => {
  const response = await fetch(API_ENDPOINTS.candidate.assessmentSummary, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
```

### State Management

```typescript
// Using Redux
import { useSelector, useDispatch } from 'react-redux';
import { setTokenValidation } from '../store/miscSlice';

const MyComponent = () => {
  const dispatch = useDispatch();
  const tokenValidation = useSelector((state: any) => state.misc?.tokenValidation);

  const handleAction = () => {
    dispatch(setTokenValidation(data));
  };

  return <div>...</div>;
};
```

### Styling Guidelines

- Use **Tailwind CSS** utility classes for styling
- Follow mobile-first responsive design
- Use Ant Design components for complex UI elements
- Keep custom CSS minimal

```tsx
// Example: Tailwind styling
<div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-white">Title</h2>
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
    Action
  </button>
</div>
```

---

## 🚢 Deployment

### Building for Production

```bash
# 1. Ensure environment variables are set
# 2. Run production build
npm run build

# 3. Test the build locally
npm run preview

# 4. Verify output in dist/ folder
ls -la dist/
```

### AWS Amplify Deployment

1. **Connect Repository**
   - Log in to AWS Amplify Console
   - Connect your GitLab repository
   - Select the branch to deploy

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Set Environment Variables**
   - Navigate to Environment variables
   - Add `VITE_API_URL` with appropriate value
   - Save and redeploy

4. **Deploy**
   - Push to connected branch
   - Amplify automatically builds and deploys

### Other Platforms

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

---

## 📚 Documentation

### Core Documentation Files:

- **[KT_BUSINESS_DOCUMENTATION.md](./KT_BUSINESS_DOCUMENTATION.md)**: Comprehensive business and non-technical documentation
- **[ENV_SETUP.md](./ENV_SETUP.md)**: Detailed environment configuration guide
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)**: Implementation status and details
- **[S3_FOLDER_STRUCTURE.md](./S3_FOLDER_STRUCTURE.md)**: Media storage organization guide

### Feature-Specific Documentation:

- **[DYNAMIC_QUESTIONS_IMPLEMENTATION.md](./DYNAMIC_QUESTIONS_IMPLEMENTATION.md)**: Dynamic questions implementation
- **[MCQ_DYNAMIC_IMPLEMENTATION.md](./MCQ_DYNAMIC_IMPLEMENTATION.md)**: MCQ implementation details
- **[MCQ_LAZY_LOADING.md](./MCQ_LAZY_LOADING.md)**: Lazy loading for MCQ questions
- **[IMAGE_CAPTURE_S3_UPLOAD.md](./IMAGE_CAPTURE_S3_UPLOAD.md)**: Image capture and S3 upload
- **[CANDIDATE_IMAGE_S3_UPLOAD.md](./CANDIDATE_IMAGE_S3_UPLOAD.md)**: Candidate image upload process

### Configuration Documentation:

- **[src/config/README.md](./src/config/README.md)**: Configuration files overview
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**: Quick reference guide

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Dependencies Installation Fails**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### 2. **Environment Variables Not Loading**

- Ensure variable starts with `VITE_` prefix
- Restart dev server after changing `.env` files
- Check correct `.env.*` file for your environment
- Verify file is in project root directory

```bash
# Check environment in browser console
console.log('API URL:', import.meta.env.VITE_API_URL);
```

#### 3. **Build Fails**

```bash
# Check TypeScript errors
npm run tsc --noEmit

# Check linting errors
npm run lint

# Clear build cache
rm -rf dist node_modules/.vite
npm run build
```

#### 4. **Camera/Screen Capture Not Working**

- Enable camera permissions in browser
- Use HTTPS (required for getUserMedia API)
- Try different browser (Chrome recommended)
- Check browser console for errors

#### 5. **API Requests Failing**

- Verify API URL in environment variables
- Check network tab in browser DevTools
- Ensure valid authentication token
- Verify CORS settings on backend

### Debug Mode

Enable detailed logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true');

// Reload page to see detailed logs
```

### Getting Help

1. **Check Documentation**: Review relevant `.md` files
2. **Browser Console**: Check for error messages
3. **Network Tab**: Inspect API calls and responses
4. **Redux DevTools**: Inspect application state
5. **Contact Team**: Reach out to development team

---

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add TypeScript types
   - Test your changes

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Merge Request**
   - Provide clear description
   - Link related issues
   - Request code review

### Commit Message Convention

Follow conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```bash
git commit -m "feat: add camera capture functionality"
git commit -m "fix: resolve timer countdown issue"
git commit -m "docs: update API configuration guide"
```

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] No linting errors
- [ ] Changes are tested
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No console.log statements in production code
- [ ] Environment-specific code is properly configured

---

## 📊 Project Status

**Current Version:** 0.0.1  
**Status:** Active Development  
**Last Updated:** October 16, 2025

### Recent Updates

- ✅ Environment configuration system implemented
- ✅ Centralized API configuration
- ✅ S3 folder structure optimization
- ✅ Dynamic questions support
- ✅ MCQ lazy loading implementation
- ✅ Comprehensive documentation added

### Roadmap

See [KT_BUSINESS_DOCUMENTATION.md](./KT_BUSINESS_DOCUMENTATION.md#future-enhancements) for detailed roadmap.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

**Copyright © 2025 MeritEdge. All rights reserved.**

---

## 👥 Team & Support

### Development Team
- **GitLab**: https://gitlab.com/otomeyt/meritedge_frontend_candidate
- **Repository**: otomeyt/meritedge_frontend_candidate

### Contact
For questions, issues, or support, please contact the development team or create an issue in the project repository.

---

## 🙏 Acknowledgments

Built with:
- React and the React community
- TypeScript team
- Vite developers
- Ant Design team
- All open-source contributors

---

**Happy Coding! 🚀**

*Last Updated: October 16, 2025*

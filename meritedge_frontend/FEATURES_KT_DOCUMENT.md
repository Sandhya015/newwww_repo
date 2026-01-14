# MeritEdge Frontend - Comprehensive Features Knowledge Transfer Document

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Project Structure](#architecture--project-structure)
4. [Core Features](#core-features)
5. [User Management & Authentication](#user-management--authentication)
6. [Assessment Management](#assessment-management)
7. [Question Management](#question-management)
8. [Admin Panel](#admin-panel)
9. [API Integration](#api-integration)
10. [State Management](#state-management)
11. [UI/UX Components](#uiux-components)
12. [Development Guidelines](#development-guidelines)
13. [Deployment & Environment](#deployment--environment)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**MeritEdge** is a comprehensive assessment and evaluation platform built with React and TypeScript. It provides a complete solution for creating, managing, and conducting various types of assessments including technical, behavioral, cognitive, and aptitude tests.

### Key Capabilities:
- **Assessment Creation & Management**: Create and configure assessments with multiple sections and question types
- **Question Library Management**: Comprehensive question management with custom and library questions
- **Candidate Invitation System**: Invite candidates via email or resume matching
- **Real-time Assessment Analytics**: Track assessment performance and analytics
- **Multi-tenant Architecture**: Support for organizations and companies
- **Admin Panel**: Complete administrative control over the platform

---

## 🛠 Technology Stack

### Frontend Technologies
- **React 19.0.0** - Core UI framework
- **TypeScript 5.7.2** - Type-safe development
- **Vite 6.2.0** - Build tool and dev server
- **Tailwind CSS 4.1.3** - Utility-first CSS framework
- **Ant Design 5.24.9** - UI component library

### State Management
- **Redux Toolkit 2.7.0** - Global state management
- **React Redux 9.2.0** - React bindings for Redux
- **Redux Persist 6.0.0** - State persistence

### Rich Text Editing
- **TipTap 2.26.1** - Rich text editor with extensions
- **CKEditor5 45.2.0** - Alternative rich text editor

### Additional Libraries
- **React Router DOM 7.5.0** - Client-side routing
- **React Hot Toast 2.5.2** - Toast notifications
- **Formik 2.4.6** - Form handling
- **Yup 1.6.1** - Form validation
- **Lucide React 0.488.0** - Icon library
- **Recharts 2.15.3** - Data visualization

---

## 🏗 Architecture & Project Structure

```
meritedge_frontend/
├── public/                          # Static assets
│   ├── common/                      # Common assets (logos, videos, etc.)
│   ├── cognitive/                   # Cognitive assessment icons
│   ├── login/                       # Login page assets
│   ├── question-add/                # Question creation icons
│   ├── question-library/            # Question library icons
│   └── question-setting/            # Question settings icons
├── src/
│   ├── api/                         # API layer organization
│   │   ├── Admin/                   # Admin-specific API calls
│   │   ├── Auth/                    # Authentication API
│   │   └── Profile/                 # User profile API
│   ├── components/                  # Reusable UI components
│   │   ├── Cognitive/               # Cognitive assessment components
│   │   ├── Layout/                  # Layout components
│   │   ├── QuestionLibrary/         # Question management components
│   │   └── ui/                      # Generic UI components
│   ├── context/                     # React Context providers
│   ├── lib/                         # Core utilities and API functions
│   ├── middleware/                  # Route protection middleware
│   ├── pages/                       # Page components
│   │   ├── Admin/                   # Admin panel pages
│   │   ├── Cognitive/               # Assessment management
│   │   ├── QuestionAdd/             # Question creation
│   │   ├── QuestionLibrary/         # Question library
│   │   └── QuestionSettings/        # Question configuration
│   ├── store/                       # Redux store configuration
│   └── utils/                       # Utility functions
├── dist/                            # Production build output
└── Configuration files
```

---

## 🎨 Core Features

### 1. **Dashboard & Navigation**
- **Responsive Sidebar**: Collapsible navigation with role-based menu items
- **Video Background**: Dynamic technology-themed video background
- **User Context**: Global user state management with authentication
- **Route Protection**: Middleware-based route protection

### 2. **Assessment Creation & Management**
- **Assessment Builder**: Create assessments with multiple sections
- **Section Management**: Add, edit, and configure assessment sections
- **Timing Configuration**: Set timing modes (assessment-level, section-level, question-level)
- **Difficulty Levels**: Support for 10 difficulty levels (Beginner to Principal)
- **Assessment Types**: 10 different assessment types (Technical, Behavioral, etc.)

### 3. **Question Management System**
- **Question Libraries**: 
  - **My Library**: User's custom questions
  - **Otomeyt Library**: Pre-built question library (255 questions)
  - **AI Library**: AI-generated questions (disabled)
- **Question Types**: Support for multiple question formats
- **Question Creation**: Rich text editor with media support
- **Bulk Operations**: Select multiple questions for bulk actions

### 4. **Candidate Management**
- **Invitation System**: Invite candidates via email
- **Resume Matching**: AI-powered candidate matching
- **Assessment Assignment**: Assign assessments to specific candidates
- **Progress Tracking**: Monitor candidate progress and completion

### 5. **Analytics & Reporting**
- **Assessment Analytics**: Performance metrics and statistics
- **Candidate Reports**: Individual candidate performance reports
- **Organization Metrics**: Company-wide assessment analytics

---

## 👥 User Management & Authentication

### Authentication System
- **JWT Token-based**: Secure token-based authentication
- **Role-based Access**: Different access levels for users and admins
- **Session Management**: Automatic token refresh and logout handling
- **Protected Routes**: Middleware-based route protection

### User Types
1. **Regular Users**: Assessment creators and managers
2. **Admin Users**: Platform administrators with full access
3. **Company Users**: Organization-specific users

### Authentication Flow
```typescript
// Login Process
POST /api/v1/login
{
  "email": "user@example.com",
  "password": "password"
}

// Response
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user_data": { ... }
}
```

---

## 📊 Assessment Management

### Assessment Creation Process
1. **Basic Information**: Title, description, role, experience level
2. **Configuration**: Assessment type, difficulty level, skills required
3. **Section Setup**: Create and configure assessment sections
4. **Question Assignment**: Add questions to sections from libraries
5. **Timing Setup**: Configure timing and duration settings
6. **Publishing**: Set assessment status (draft/active/inactive)

### Assessment Types
- **Technical**: Programming and technical skills
- **Behavioral**: Soft skills and behavioral assessment
- **Cognitive**: Problem-solving and reasoning
- **Aptitude**: General aptitude testing
- **Personality**: Personality assessment
- **Leadership**: Leadership and management skills
- **Communication**: Communication skills
- **Problem Solving**: Analytical problem solving
- **Critical Thinking**: Critical thinking assessment
- **Domain Specific**: Industry-specific assessments

### Difficulty Levels
- **Beginner** → **Elementary** → **Intermediate** → **Advanced** → **Expert**
- **Junior** → **Mid-Level** → **Senior** → **Lead** → **Principal**

### Assessment States
- **Draft**: Assessment being created/edited
- **Active**: Assessment available for candidates
- **Inactive**: Assessment disabled

---

## ❓ Question Management

### Question Library Structure

#### 1. **My Library**
- **Custom Questions**: User-created questions
- **Question Creation**: Rich text editor with media support
- **Add to Section**: Bulk add questions to assessment sections
- **Question Types**: MCQ, Coding, Descriptive, etc.

#### 2. **Otomeyt Library**
- **Pre-built Questions**: 255 ready-to-use questions
- **Add to Section**: Select and add questions to sections
- **Question Metadata**: Difficulty, tags, categories, skills

#### 3. **AI Library**
- **AI-Generated**: AI-powered question generation (currently disabled)
- **Future Feature**: Planned for AI-generated questions

### Question Creation Features
- **Rich Text Editor**: TipTap-based editor with formatting
- **Media Support**: Images, videos, and file attachments
- **Question Metadata**: Tags, categories, difficulty, skills
- **Validation**: Form validation with Yup schema
- **Auto-save**: Automatic saving of question drafts

### Question Types Supported
- **Multiple Choice Questions (MCQ)**: Single and multiple correct answers
- **Coding Questions**: Programming challenges with test cases
- **Descriptive Questions**: Open-ended text responses
- **File Upload Questions**: Document and media submissions

---

## 🔧 Admin Panel

### Admin Features
- **Dashboard**: Platform overview with statistics
- **User Management**: Manage platform users and permissions
- **Organization Management**: Manage companies and organizations
- **System Settings**: Configure platform-wide settings
- **Analytics**: Platform-wide analytics and reporting

### Admin Authentication
- **Separate Login**: `/admin/login` endpoint
- **Admin Tokens**: Separate token management for admins
- **Role-based Access**: Admin-specific permissions and features

### Admin API Endpoints
```bash
# Admin Login
POST /api/v1/admin-login

# Get Organizations
GET /api/v1/admin/organizations

# Get Companies
GET /api/v1/admin/companies

# Get Company Users
GET /api/v1/admin/companies/{company_id}/users
```

---

## 🔌 API Integration

### Base API Configuration
```typescript
// API Base URL
VITE_API_URL=https://k6zph7nl71.execute-api.ap-south-1.amazonaws.com/api/v1/

// Authentication Headers
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Core API Functions
```typescript
// GET Request
export const getAPI = async <T>(api_url: string): Promise<T | null>

// POST Request  
export const postAPI = async (api_url: string, data: unknown)

// DELETE Request
export const deleteAPI = async (api_url: string)

// PATCH Request
export const patchAPI = async (api_url: string, data: unknown)
```

### Assessment APIs
```typescript
// Create Assessment
POST /assessments
{
  "title": "Assessment Title",
  "description": "Assessment Description",
  "assessment_type": "OTO_TECH",
  "difficulty_level": "OTO_INTERMEDIATE",
  "skills_required": ["JavaScript", "React"]
}

// Get Assessments (with pagination)
GET /assessments?limit=12&page=1&search=query&status=active

// Update Assessment
PUT /assessments/{assessment_id}

// Delete Assessment
DELETE /assessments/{assessment_id}
```

### Question APIs
```typescript
// Create Question
POST /questions
{
  "question_text": "Question content",
  "question_type_id": "mcq_single",
  "difficulty_level": 1,
  "options": [...],
  "correct_answers": [...]
}

// Get Scoped Questions (with pagination)
GET /questions/scoped?library=company&limit=20&last_evaluated_key={encoded_json}

// Response Structure
{
  "items": [...],
  "last_evaluated_key": {...},  // Object for pagination
  "filters_applied": {...},
  "library_scope": "company",
  "total_count": 100
}

// Add Questions to Section
POST /assessments/{assessment_id}/sections/{section_id}/questions/create
{
  "questions": [...],
  "add_to_library": true
}
```

**Important**: The `last_evaluated_key` is returned as an object (DynamoDB pagination token) and must be JSON stringified and URL encoded when passed in subsequent requests.

### Section APIs
```typescript
// Create Section
POST /assessments/{assessment_id}/sections

// Get Section Questions
GET /assessments/{assessment_id}/sections/{section_id}/questions

// Get Section Settings
GET /assessments/{assessment_id}/sections/{section_id}/settings

// Update Section
PUT /assessments/{assessment_id}/sections/{section_id}
```

### Candidate Invitation APIs
```typescript
// Bulk Invite Candidates (Recommended)
POST /invites/candidates
{
  "candidates": [
    {
      "assessment_id": "string",
      "full_name": "string",
      "email": "string",
      "mobile_number": "string",
      "country_code": "+91",
      "send_email_notification": true
    }
  ]
}

// Response Structure
{
  "summary": {
    "assessment_id": "string",
    "total_requested": 1,
    "successful_invites": 0,
    "created_no_email": 0,
    "failed_validation": 0,
    "failed_duplicate": 0,
    "failed_assessment": 1,
    "failed_email": 0,
    "failed_system": 0,
    "total_created": 0,
    "total_failed": 1,
    "processing_time_ms": 34
  },
  "results": [
    {
      "full_name": "string",
      "email": "string",
      "mobile_number": "string",
      "status": "success" | "failed_duplicate" | "failed_assessment" | "failed_validation",
      "invite_id": "string | null",
      "candidate_jwt": "string | null",
      "error_message": "string | null",
      "error_code": "string | null",
      "email_sent": boolean,
      "email_error": "string | null"
    }
  ]
}

// Single Invite (Legacy - use bulk API instead)
POST /invites/candidate
{
  "assessment_id": "string",
  "full_name": "string",
  "email": "string",
  "mobile_number": "string",
  "country_code": "+91",
  "send_email_notification": true
}
```

**Best Practice**: Use the bulk invite API (`/invites/candidates`) for both single and multiple invitations. It provides better error handling, detailed status reporting, and improved performance.

---

## 🗃 State Management

### Redux Store Structure
```typescript
// Store Configuration
interface RootState {
  misc: MiscState;
  admin: AdminState;
}

// Misc Slice (Main Application State)
interface MiscState {
  currentAssessment: Assessment | null;
  userData: UserData | null;
  accessToken: string | null;
}

// Admin Slice (Admin Panel State)
interface AdminState {
  adminUser: AdminUser | null;
  adminToken: string | null;
}
```

### Key Redux Actions
```typescript
// Assessment Management
setCurrentAssessment(assessment: Assessment)
clearCurrentAssessment()

// User Management
setUserData(userData: UserData)
setAccessToken(token: string)
logoutUser()

// Admin Management
setAdminUser(adminUser: AdminUser)
setAdminToken(token: string)
adminLogout()
```

### State Persistence
- **Redux Persist**: Automatically persists user session
- **Local Storage**: Stores authentication tokens
- **Session Management**: Automatic token refresh and cleanup

---

## 🎨 UI/UX Components

### Layout Components
- **Header**: Top navigation with user menu
- **LeftSideBar**: Collapsible sidebar navigation
- **UserLayout**: Main application layout wrapper
- **AdminLayout**: Admin panel layout wrapper

### Form Components
- **CustomSelect**: Styled select dropdowns
- **CustomDatePicker**: Date picker with custom styling
- **QuestionCreationModal**: Rich question creation form
- **AssessmentForm**: Assessment creation and editing

### Data Display Components
- **DataTable**: Sortable and filterable data tables
- **QuestionCard**: Question display with metadata
- **AssessmentCard**: Assessment overview cards
- **StatisticsCards**: Dashboard metric cards

### Interactive Components
- **InviteCandidate**: Candidate invitation modal
- **InviteCandidateViaResumeMatch**: AI-powered candidate matching
- **QuestionFilter**: Advanced question filtering
- **Pagination**: Custom pagination component

### Styling System
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Theme**: Dark theme with purple accent colors
- **Responsive Design**: Mobile-first responsive design
- **Component Variants**: Consistent component styling

---

## 💻 Development Guidelines

### Code Organization
```typescript
// Component Structure
interface ComponentProps {
  // Props interface
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // State declarations
  const [state, setState] = useState();
  
  // Effect hooks
  useEffect(() => {
    // Side effects
  }, []);
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Event logic
  }, []);
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API Integration Pattern
```typescript
// API Call Pattern
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await getAPI<ResponseType>('/endpoint');
    if (response) {
      setData(response);
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error message', 'error');
  } finally {
    setLoading(false);
  }
};
```

### Error Handling
```typescript
// Error Handling Pattern
try {
  const response = await apiCall();
  if (response.success) {
    // Handle success
  } else {
    // Handle API error
    message.error(response.data?.message || 'Error occurred');
  }
} catch (error) {
  // Handle network/system errors
  console.error('Error:', error);
  message.error('Network error occurred');
}
```

### TypeScript Best Practices
- **Interface Definitions**: Define clear interfaces for all data structures
- **Type Safety**: Use strict TypeScript configuration
- **Generic Types**: Use generics for reusable components and functions
- **API Response Types**: Define specific types for API responses

---

## 🚀 Deployment & Environment

### Environment Configuration
```bash
# Development
VITE_API_URL=https://dev-api.meritedge.com/api/v1/

# Staging
VITE_API_URL=https://staging-api.meritedge.com/api/v1/

# Production
VITE_API_URL=https://api.meritedge.com/api/v1/
```

### Build Commands
```bash
# Development
npm run dev

# Production Build
npm run build

# Staging Build
npm run build:staging

# Linting
npm run lint

# Preview
npm run preview
```

### Deployment Process
1. **Build**: Generate production build with `npm run build`
2. **Static Hosting**: Deploy to static hosting service
3. **Environment Variables**: Configure production API endpoints
4. **CDN**: Use CDN for static asset delivery

---

## 🆕 Recent Updates & Changes

### **January 2025: API Improvements**

#### **1. Bulk Candidate Invitation System**
- **Change**: Migrated from single invite API to bulk invite API
- **Impact**: Improved performance and error handling for candidate invitations
- **Component**: `InviteCandidate.tsx`
- **API Function**: `inviteCandidates()` in `src/lib/api.ts`
- **Benefits**:
  - Single API call for multiple candidates
  - Detailed status reporting per candidate
  - Better error categorization (duplicates, validation, assessment errors)
  - Improved user feedback with specific error messages

#### **2. Question Library Pagination Fix**
- **Change**: Fixed pagination handling for question libraries
- **Impact**: Proper pagination when fetching more than 20 questions
- **Component**: `QuestionAdd.tsx`, `QuestionLibraryDedicatedList.tsx`
- **API Function**: `getScopedQuestions()` in `src/lib/api.ts`
- **Technical Details**:
  - `last_evaluated_key` is now properly handled as an object
  - Object is JSON stringified and URL encoded before sending
  - State types updated to `Record<string, unknown>` for type safety
- **Benefits**:
  - Load more than 20 questions from libraries
  - Proper pagination for both company and meritedge libraries
  - Improved performance with efficient data loading

#### **3. TypeScript Build Configuration**
- **Change**: Added `@types/node` package and fixed timeout types
- **Impact**: Resolved TypeScript compilation errors in build
- **Files Changed**:
  - `vite.config.ts`: Now properly recognizes `process.cwd()`
  - `Cognitive.tsx`: Fixed `setTimeout` return type handling
- **Benefits**:
  - Clean builds without TypeScript errors
  - Better type safety for Node.js APIs
  - Improved developer experience

### **Implementation Examples**

#### **Bulk Invite Implementation**
```typescript
// Old approach (deprecated)
const invitePromises = candidates.map(candidate => 
  inviteCandidate(candidate)
);
await Promise.all(invitePromises);

// New approach (recommended)
const response = await inviteCandidates({
  candidates: selectedCandidates.map(c => ({
    assessment_id: assessmentId,
    full_name: c.name,
    email: c.email,
    mobile_number: c.phone,
    country_code: c.country_code,
    send_email_notification: true
  }))
});

// Process results
const { summary, results } = response.data;
results.forEach(result => {
  if (result.status === 'failed_duplicate') {
    // Handle duplicate invitation
  } else if (result.status === 'success') {
    // Handle success
  }
});
```

#### **Pagination Implementation**
```typescript
// State management
const [lastEvaluatedKey, setLastEvaluatedKey] = 
  useState<Record<string, unknown> | null>(null);

// Fetch with pagination
const response = await getScopedQuestions(
  'company',
  20,
  isLoadMore ? lastEvaluatedKey : undefined
);

// Update pagination state
if (response?.last_evaluated_key) {
  setLastEvaluatedKey(response.last_evaluated_key);
  setHasMore(true);
} else {
  setHasMore(false);
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Authentication Issues**
```typescript
// Problem: Token expired or invalid
// Solution: Check token validity and refresh logic
if (response.status === 401) {
  // Redirect to login or refresh token
  performLogout();
}
```

#### 2. **API Connection Issues**
```typescript
// Problem: Network errors or CORS issues
// Solution: Check API URL configuration and network connectivity
console.log('API URL:', import.meta.env.VITE_API_URL);
```

#### 3. **State Management Issues**
```typescript
// Problem: State not persisting or updating
// Solution: Check Redux store configuration and action dispatching
const dispatch = useDispatch();
dispatch(setCurrentAssessment(assessment));
```

#### 4. **Build Issues**
```bash
# Problem: TypeScript compilation errors
# Solution: Check type definitions and fix type errors
npm run lint
tsc --noEmit
```

### Performance Optimization
- **Code Splitting**: Implement route-based code splitting
- **Lazy Loading**: Load components on demand
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Bundle Analysis**: Analyze bundle size and optimize imports

### Security Considerations
- **Token Management**: Secure token storage and transmission
- **Input Validation**: Validate all user inputs
- **XSS Protection**: Sanitize rich text content
- **CSRF Protection**: Implement CSRF tokens for state-changing operations

---

## 📚 Additional Resources

### Documentation
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Ant Design Components**: https://ant.design/components/overview/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Redux Toolkit**: https://redux-toolkit.js.org/

### Development Tools
- **Vite**: https://vitejs.dev/
- **ESLint**: https://eslint.org/
- **Prettier**: Code formatting
- **React DevTools**: Browser extension for React debugging
- **Redux DevTools**: Browser extension for Redux debugging

### API Documentation
- **Base URL**: `https://k6zph7nl71.execute-api.ap-south-1.amazonaws.com/api/v1/`
- **Authentication**: Bearer token in Authorization header
- **Response Format**: JSON with success/error status
- **Error Codes**: Standard HTTP status codes

---

## 📝 Notes for Developers

### Getting Started
1. **Clone Repository**: `git clone [repository-url]`
2. **Install Dependencies**: `npm install`
3. **Configure Environment**: Set up `.env` file with API URLs
4. **Start Development**: `npm run dev`

### Code Contribution Guidelines
1. **Follow TypeScript**: Use strict typing for all components
2. **Component Structure**: Follow established component patterns
3. **API Integration**: Use centralized API functions
4. **Error Handling**: Implement comprehensive error handling
5. **Testing**: Write unit tests for critical functionality

### Feature Development Process
1. **Design Review**: Review UI/UX designs before implementation
2. **API Integration**: Implement API endpoints first
3. **Component Development**: Build reusable components
4. **State Management**: Update Redux store as needed
5. **Testing**: Test functionality across different scenarios
6. **Documentation**: Update this KT document for new features

---

*This document serves as a comprehensive guide for understanding and working with the MeritEdge frontend application. For specific implementation details, refer to the source code and inline documentation.*

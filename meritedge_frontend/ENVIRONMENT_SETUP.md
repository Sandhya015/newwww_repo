# Environment Setup Guide

This document explains how to configure and build the application for different environments.

## Environment Variables

The application uses different API URLs based on the environment:

### Development
- **API URL**: `https://k6zph7nl71.execute-api.ap-south-1.amazonaws.com/api/v1`
- **Environment**: `development`

### Staging
- **API URL**: `https://i528nplii7.execute-api.ap-south-1.amazonaws.com/api/v1`
- **Environment**: `staging`

### Production
- **API URL**: `https://i528nplii7.execute-api.ap-south-1.amazonaws.com/api/v1`
- **Environment**: `production`

## Environment Files

The following environment files are configured:

- `.env` - Default file for local development (uses development settings)
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

**Note**: These files are gitignored for security. Make sure to create them based on your environment.

## Running the Application

### Development Mode
```bash
npm run dev
```
This will use `.env.development` and connect to the development API.

### Build Commands

#### Development Build
```bash
npm run build:dev
```
Creates a build with development API URL.

#### Staging Build
```bash
npm run build:staging
```
Creates a build with staging API URL.

#### Production Build
```bash
npm run build
```
Creates a build with production API URL.

## Preview Build

After building, you can preview the build:
```bash
npm run preview
```

## Environment Variable Usage

In the code, environment variables are accessed using:
```typescript
import.meta.env.VITE_API_URL
```

### Example:
```typescript
const apiBaseUrl = import.meta.env.VITE_API_URL || '';
const response = await fetch(`${apiBaseUrl}/candidates/${candidateId}/media`);
```

## Configuration Files

### vite.config.ts
The Vite configuration automatically loads the correct environment file based on the build mode:
- `--mode development` → loads `.env.development`
- `--mode staging` → loads `.env.staging`  
- `--mode production` → loads `.env.production`

## API Endpoints

All API calls in the application use the `VITE_API_URL` environment variable:

### Key API Endpoints (Updated January 2025)

#### Candidate Invitation
```bash
# Bulk Invite (Recommended)
POST ${VITE_API_URL}/invites/candidates
Content-Type: application/json
Authorization: Bearer {token}

# Request Body
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
```

#### Question Library with Pagination
```bash
# Get Scoped Questions
GET ${VITE_API_URL}/questions/scoped?library=company&limit=20&last_evaluated_key={encoded_object}

# Response
{
  "items": [...],
  "last_evaluated_key": {...},  // Pass this in next request
  "total_count": 100
}
```

### Used in:
- `src/lib/api.ts` - Main API functions (including `inviteCandidates()`, `getScopedQuestions()`)
- `src/api/Admin/AdminAPI.ts` - Admin API functions
- `src/pages/Reports/CandidateReport.tsx` - Media API calls
- `src/pages/Reports/ProfessionalReport.tsx` - Media API calls
- `src/components/Cognitive/InviteCandidate.tsx` - Bulk invitation component
- `src/pages/QuestionAdd/QuestionAdd.tsx` - Question library pagination
- All other components that make API calls

## Verification

To verify which API URL is being used:
1. Open browser console
2. Run: `console.log(import.meta.env.VITE_API_URL)`
3. You should see the correct API URL based on your environment

## Deployment Checklist

- [ ] Ensure correct `.env.*` file exists for target environment
- [ ] Run the appropriate build command
- [ ] Verify API URL in built files
- [ ] Test API connectivity before deployment
- [ ] Check CORS settings on API gateway

## Recent Changes (January 2025)

### TypeScript Configuration Updates

#### Added @types/node Package
- **What Changed**: Added `@types/node` as a dev dependency
- **Why**: Required for Node.js APIs used in `vite.config.ts` (e.g., `process.cwd()`)
- **Impact**: Resolves TypeScript compilation errors during build
- **Installation**: 
  ```bash
  npm install --save-dev @types/node
  ```

#### Fixed setTimeout Type Handling
- **What Changed**: Updated timeout reference types in components
- **File**: `src/pages/Cognitive/Cognitive.tsx`
- **Before**: `useRef<number | null>(null)`
- **After**: `useRef<ReturnType<typeof setTimeout> | null>(null)`
- **Why**: With Node types installed, `setTimeout` returns `NodeJS.Timeout` instead of `number`

### API Integration Updates

#### Bulk Candidate Invitation
- **New API**: `POST /invites/candidates` (bulk endpoint)
- **Old API**: `POST /invites/candidate` (single endpoint - still available)
- **Function**: `inviteCandidates()` in `src/lib/api.ts`
- **Response Format**: Includes `summary` and `results` arrays
- **Usage**: Recommended for all candidate invitations (single or multiple)

#### Question Library Pagination
- **What Changed**: Fixed pagination token handling for `getScopedQuestions()`
- **Technical Detail**: `last_evaluated_key` is now treated as an object and properly encoded
- **Parameter Type**: `Record<string, unknown> | string | null`
- **Encoding**: Automatically JSON stringifies and URL encodes the pagination token
- **Impact**: Enables loading more than 20 questions from libraries

### Build Process

#### Build Verification
After these changes, builds should complete without TypeScript errors:
```bash
npm run build
# Should output: ✓ built in XXs
```

#### Common Build Commands
```bash
# Development build
npm run build:dev

# Staging build  
npm run build:staging

# Production build
npm run build
```

## Troubleshooting

### Issue: TypeScript error about 'process' not found
**Solution**: Ensure `@types/node` is installed:
```bash
npm install --save-dev @types/node
```

### Issue: setTimeout type errors
**Solution**: Use `ReturnType<typeof setTimeout>` for timeout references:
```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### Issue: Environment variables not loading
**Solution**: Make sure you're using the `VITE_` prefix for all environment variables in Vite.

### Issue: Wrong API URL after build
**Solution**: Check that you used the correct build command (`build:dev`, `build:staging`, or `build`).

### Issue: API calls failing
**Solution**: Verify the API URL is correct and accessible from your environment.

### Issue: Pagination not working for question libraries
**Solution**: Ensure you're using the updated `getScopedQuestions()` function that properly handles the `last_evaluated_key` object.

### Issue: Bulk invitation errors
**Solution**: 
1. Check the API response structure in console
2. Verify the `summary` and `results` fields are present
3. Ensure proper error handling for different failure types (duplicate, validation, assessment)


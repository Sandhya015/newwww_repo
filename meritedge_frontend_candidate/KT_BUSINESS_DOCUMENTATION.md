# 📘 MeritEdge Candidate Assessment Platform - Knowledge Transfer & Business Documentation

**Version:** 1.0.0  
**Last Updated:** October 16, 2025  
**Document Type:** Knowledge Transfer & Business Documentation  
**Target Audience:** Business Stakeholders, Product Managers, New Team Members

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [What is MeritEdge?](#what-is-meritedge)
3. [Key Features](#key-features)
4. [User Journey](#user-journey)
5. [System Architecture Overview](#system-architecture-overview)
6. [Important Business Processes](#important-business-processes)
7. [Security & Compliance](#security--compliance)
8. [Data Management](#data-management)
9. [Environments & Deployment](#environments--deployment)
10. [Support & Maintenance](#support--maintenance)
11. [Technical Stack](#technical-stack)
12. [Future Enhancements](#future-enhancements)
13. [Glossary](#glossary)
14. [Contact Information](#contact-information)

---

## 🎯 Executive Summary

**MeritEdge** is a comprehensive online assessment platform designed to evaluate candidates through various types of tests including Multiple Choice Questions (MCQ), Coding Challenges, and Dynamic Questions. The platform provides a secure, proctored environment with real-time monitoring capabilities.

### Key Highlights:
- **Purpose:** Conduct secure online assessments for candidate evaluation
- **Users:** Job candidates, hiring managers, assessment administrators
- **Platform Type:** Web-based application (Browser-based)
- **Primary Function:** Deliver and monitor various types of assessments
- **Security Level:** High - includes proctoring features and secure browser mode

---

## 🌟 What is MeritEdge?

MeritEdge is an online assessment platform that enables organizations to:

1. **Evaluate Candidates** through multiple question formats
2. **Monitor Test-Takers** using camera and screen capture
3. **Prevent Cheating** through secure browser features
4. **Track Performance** with real-time data collection
5. **Manage Assessments** with configurable test parameters

### Business Value:
- **Reduces Time-to-Hire**: Automated assessment process
- **Improves Quality-of-Hire**: Comprehensive evaluation methods
- **Ensures Fairness**: Standardized testing environment
- **Increases Efficiency**: Simultaneous testing of multiple candidates
- **Provides Data-Driven Insights**: Analytics and performance tracking

---

## ✨ Key Features

### 1. **Multi-Format Assessments**
- **Multiple Choice Questions (MCQ)**: Traditional question-answer format
- **Coding Challenges**: Live code editing with sandbox environment
- **Dynamic Questions**: Flexible question types including match-the-following, code blocks, etc.
- **Mixed Assessments**: Combine multiple question types in one test

### 2. **Proctoring & Monitoring**
- **Camera Capture**: Periodic photos of candidates during the test
- **Screen Recording**: Continuous screen capture for review
- **Tab Switch Detection**: Alerts when candidates leave the test window
- **Secure Browser Mode**: Prevents access to external tools and resources

### 3. **Candidate Experience**
- **User-Friendly Interface**: Clean, modern design
- **Real-Time Timer**: Countdown for test duration
- **Progress Tracking**: Visual indicators of completion status
- **Guidelines & Instructions**: Clear test instructions before starting
- **Question Navigation**: Easy movement between questions

### 4. **Assessment Management**
- **Timed Sections**: Different sections can have different time limits
- **Section Instructions**: Separate guidelines for different test sections
- **Question Sequencing**: Controlled order of question presentation
- **Auto-Submission**: Automatic test submission when time expires

### 5. **Data Collection & Storage**
- **Candidate Information**: Profile data collection
- **Answer Recording**: All responses saved in real-time
- **Media Storage**: Images and videos stored securely in cloud
- **Event Logging**: Track all candidate actions during assessment

---

## 👤 User Journey

### Phase 1: Pre-Assessment (5-10 minutes)

1. **Access Link**: Candidate receives unique assessment link via email
2. **Token Validation**: System verifies candidate identity and assessment details
3. **Welcome Screen**: Introduction to the assessment platform
4. **Information Form**: Candidate provides/confirms personal details
5. **Guidelines Review**: Read assessment rules and policies
6. **Camera Setup**: Test camera access and capture photo
7. **Final Instructions**: Review section-specific instructions

### Phase 2: Assessment (Variable Duration)

8. **Test Begins**: Timer starts, secure mode activates
9. **Answer Questions**: Navigate through questions, submit answers
10. **Monitoring Active**: Camera captures photos, screen recorded
11. **Section Transitions**: Move between different test sections
12. **Progress Saved**: All answers automatically saved

### Phase 3: Post-Assessment (1-2 minutes)

13. **Test Completion**: Final submission confirmation
14. **Success Screen**: Thank you message and next steps
15. **Exit**: Secure mode deactivated, assessment ends

---

## 🏗️ System Architecture Overview

### High-Level Components:

```
┌─────────────────────────────────────────────────────────────┐
│                      CANDIDATE BROWSER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           MeritEdge Frontend Application               │ │
│  │  (React, TypeScript, Modern Web Technologies)          │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ HTTPS Communication
                    │
        ┌───────────┴──────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐          ┌──────────────────┐
│   Backend API  │          │   AWS S3 Storage │
│   (REST API)   │          │  (Media Files)   │
│                │          │                  │
│  - Questions   │          │ - Images         │
│  - Answers     │          │ - Videos         │
│  - Validation  │          │ - Screenshots    │
│  - Events      │          │                  │
└───────────────┘          └──────────────────┘
```

### Data Flow:

1. **Candidate Authentication**: Token-based validation
2. **Question Delivery**: Questions fetched from backend API
3. **Answer Submission**: Responses sent to backend in real-time
4. **Media Upload**: Photos/videos uploaded to cloud storage (AWS S3)
5. **Event Tracking**: All activities logged for audit

---

## 💼 Important Business Processes

### 1. Assessment Creation (Backend/Admin)
- Define assessment parameters (duration, sections, question types)
- Configure question bank and sequence
- Set passing criteria and scoring rules
- Generate unique candidate invitation links

### 2. Candidate Invitation
- Send personalized assessment links to candidates
- Links contain encoded tokens with:
  - Candidate identity
  - Assessment details
  - Validity period
  - Access permissions

### 3. Assessment Execution
- Real-time monitoring and data collection
- Automatic answer saving (prevents data loss)
- Event logging (tab switches, time tracking)
- Media capture and storage

### 4. Assessment Completion
- Automatic or manual submission
- Data compilation and initial processing
- Candidate notification of completion
- Assessment locked from further access

### 5. Review & Evaluation (Backend/Admin)
- Access candidate responses
- Review captured media (photos, screen recordings)
- Analyze performance metrics
- Generate assessment reports

---

## 🔒 Security & Compliance

### Security Features:

#### 1. **Secure Browser Mode**
When enabled, the platform prevents:
- Right-click and context menus
- Copy-paste operations
- Opening developer tools (F12)
- View source code access
- Keyboard shortcuts to external tools
- Switching to other applications (Alt+Tab detection)
- Taking screenshots (disabled)

#### 2. **Proctoring Measures**
- **Camera Monitoring**: Random photo captures throughout assessment
- **Screen Recording**: Continuous screen capture for review
- **Tab Switch Detection**: Logs when candidate leaves test window
- **Time Tracking**: Precise timing of all activities

#### 3. **Data Security**
- **Encrypted Communication**: All data transmitted over HTTPS
- **Token-Based Authentication**: Secure candidate identification
- **Session Management**: Time-limited access tokens
- **Data Isolation**: Candidate data separated by unique IDs

#### 4. **Privacy Compliance**
- Candidate consent for camera/screen capture
- Clear privacy policy and data usage terms
- Secure storage with access controls
- Data retention policies

### Development vs Production:
- **Development Mode**: Security features can be disabled for testing
- **Production Mode**: All security features enforced
- **Staging Environment**: Mirror of production for testing

---

## 📊 Data Management

### Data Collection Points:

#### 1. **Candidate Profile**
- Full Name
- Email Address
- Contact Number
- Candidate ID (system-generated)
- Assessment ID (linked to specific test)

#### 2. **Assessment Responses**
- Question IDs
- Submitted Answers
- Timestamps (start, submit, section transitions)
- Time spent per question
- Answer change history

#### 3. **Proctoring Data**
- Candidate photos (periodic captures)
- Screen recordings (continuous)
- Tab switch events (count and timestamps)
- Browser activity logs

### Data Storage Structure:

#### AWS S3 Folder Organization:
```
meritedgecandidate/
└── candidate_images/
    └── {candidate_id}/
        └── {assessment_id}/
            ├── image_2025-10-16T10-30-45-123Z.jpeg
            ├── image_2025-10-16T10-35-20-456Z.jpeg
            └── image_2025-10-16T10-40-15-789Z.jpeg
```

**Benefits:**
- Easy to retrieve all media for a specific candidate
- Assessment-specific segregation
- Chronological ordering via timestamps
- Support for multiple captures (re-takes)
- Audit trail maintenance

---

## 🌐 Environments & Deployment

### Environment Structure:

| Environment | Purpose | API URL | Access |
|------------|---------|---------|--------|
| **Development** | Testing new features | Dev API Server | Developers Only |
| **Staging** | Pre-production testing | Staging API Server | Internal Team |
| **Production** | Live candidate assessments | Production API Server | Public Candidates |

### Deployment Process:

#### Development:
```bash
npm run dev
```
- Local development server
- Hot reloading for instant updates
- Development API endpoints
- Security features optional

#### Staging Deployment:
```bash
npm run build:staging
```
- Production-like environment
- Full security features enabled
- Staging API endpoints
- Internal team testing

#### Production Deployment:
```bash
npm run build
```
- Optimized build for performance
- All security features enforced
- Production API endpoints
- Deployed via AWS Amplify or similar

### Build Outputs:
- Minified JavaScript and CSS
- Optimized images and assets
- Service workers for caching
- Environment-specific configurations

---

## 🛠️ Support & Maintenance

### Common Scenarios:

#### 1. **Candidate Can't Access Assessment**
**Possible Causes:**
- Expired token
- Invalid URL
- Browser compatibility issues
- Network connectivity problems

**Resolution:**
- Verify token validity period
- Regenerate and resend assessment link
- Check supported browsers (Chrome, Firefox, Edge recommended)
- Ensure stable internet connection

#### 2. **Camera/Screen Capture Not Working**
**Possible Causes:**
- Browser permissions denied
- Antivirus/Firewall blocking
- Unsupported browser
- Hardware issues

**Resolution:**
- Enable camera permissions in browser settings
- Allow browser access through firewall
- Use recommended browser versions
- Test camera functionality before assessment

#### 3. **Assessment Not Submitting**
**Possible Causes:**
- Network interruption
- Session timeout
- Server issues

**Resolution:**
- Answers auto-saved, can resume
- Extend session if needed
- Contact support for manual submission

#### 4. **Wrong API Environment**
**Possible Causes:**
- Incorrect build configuration
- Wrong environment variables

**Resolution:**
- Verify build command used
- Check environment variable settings
- Rebuild with correct configuration

### Monitoring & Logging:

#### Development Mode:
- Console logs show API URLs
- Detailed error messages
- Network request inspection
- Performance metrics

#### Production Mode:
- Error logging to monitoring service
- Performance tracking
- User activity analytics
- System health checks

---

## 💻 Technical Stack

### Frontend Technologies:

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 19 | User interface building |
| **Language** | TypeScript | Type-safe development |
| **Build Tool** | Vite | Fast build and development |
| **Styling** | Tailwind CSS | Modern, responsive design |
| **UI Components** | Ant Design, PrimeReact | Pre-built UI components |
| **State Management** | Redux Toolkit | Global state management |
| **Routing** | React Router | Page navigation |
| **Rich Text Editor** | TipTap, CKEditor | Question content display |
| **Media Capture** | React Webcam | Camera integration |

### Cloud Services:

| Service | Purpose |
|---------|---------|
| **AWS S3** | Storage for images, videos, screenshots |
| **AWS API Gateway** | Backend API endpoints |
| **AWS Amplify** | Hosting and deployment |

### Development Tools:

| Tool | Purpose |
|------|---------|
| **ESLint** | Code quality checking |
| **TypeScript Compiler** | Type checking |
| **Git** | Version control |
| **npm** | Package management |

---

## 🚀 Future Enhancements

### Planned Features:

#### Short-Term (Next 3-6 months):
1. **Enhanced Analytics Dashboard**
   - Detailed performance reports
   - Comparison across candidates
   - Question difficulty analysis

2. **AI-Powered Proctoring**
   - Automatic suspicious activity detection
   - Face recognition validation
   - Behavior pattern analysis

3. **Mobile App Support**
   - Native iOS and Android apps
   - Offline capability for limited scenarios
   - Push notifications

4. **Accessibility Improvements**
   - Screen reader support
   - Keyboard navigation
   - High contrast mode
   - Multiple language support

#### Long-Term (6-12 months):
1. **Advanced Question Types**
   - Video response questions
   - Interactive simulations
   - Collaborative coding challenges

2. **Integration Capabilities**
   - ATS (Applicant Tracking System) integration
   - HR management system connections
   - Calendar scheduling integration

3. **Adaptive Testing**
   - Dynamic difficulty adjustment
   - Personalized question selection
   - Reduced test duration while maintaining accuracy

4. **Enhanced Reporting**
   - Automated report generation
   - Custom report templates
   - Export to various formats (PDF, Excel, etc.)

---

## 📖 Glossary

### Key Terms:

- **Assessment**: A complete test comprising multiple questions and sections
- **Candidate**: The person taking the assessment
- **Token**: Secure, encoded identifier for candidate and assessment
- **Proctoring**: Monitoring and supervising the test-taking process
- **Secure Browser Mode**: Restricted browser environment preventing cheating
- **Section**: A group of questions within an assessment, often with separate timing
- **Question Type**: Format of question (MCQ, Coding, Dynamic, etc.)
- **Tab Switch**: Event when candidate navigates away from test window
- **S3**: Amazon Simple Storage Service - cloud storage for media files
- **API**: Application Programming Interface - backend communication system
- **Redux**: State management system for storing application data
- **Component**: Reusable UI building block in the application

### Technical Concepts (Simplified):

- **Frontend**: The part of the application users see and interact with
- **Backend**: Server-side system processing data and business logic
- **API Endpoint**: Specific URL where frontend communicates with backend
- **Environment Variable**: Configuration value that changes per environment
- **Build**: Process of preparing application code for deployment
- **Deployment**: Publishing application to server for user access

---

## 📞 Contact Information

### For Technical Issues:
- **Development Team**: dev-team@meritedge.com
- **Support Portal**: support.meritedge.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX (24/7 during assessment windows)

### For Business Queries:
- **Product Manager**: product@meritedge.com
- **Account Manager**: accounts@meritedge.com
- **Sales**: sales@meritedge.com

### Documentation:
- **Technical Documentation**: See `README.md` for developers
- **API Documentation**: See `src/config/README.md`
- **Environment Setup**: See `ENV_SETUP.md`
- **Implementation Details**: See `IMPLEMENTATION_COMPLETE.md`

---

## 📝 Document Maintenance

### Version History:

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Oct 16, 2025 | System | Initial KT documentation created |

### Review Schedule:
- **Quarterly Review**: Every 3 months
- **Post-Major Release**: After significant feature additions
- **On-Demand**: When business processes change

### Contributing:
This document should be updated by:
- Product Managers (business process changes)
- Technical Leads (architecture updates)
- Support Team (common issues and resolutions)
- QA Team (testing scenarios and validation)

---

## ✅ Onboarding Checklist

### For New Team Members:

#### Week 1: Understanding the Platform
- [ ] Read this KT documentation thoroughly
- [ ] Watch product demo video
- [ ] Review user journey and key features
- [ ] Understand security and proctoring features
- [ ] Review data management and storage structure

#### Week 2: Technical Setup
- [ ] Set up development environment (see `ENV_SETUP.md`)
- [ ] Access development, staging, and production environments
- [ ] Review codebase structure (`/src` folder)
- [ ] Understand API configuration and endpoints
- [ ] Run application locally and test key features

#### Week 3: Hands-On Experience
- [ ] Take a practice assessment as a candidate
- [ ] Review captured media in S3 storage
- [ ] Test camera and screen capture features
- [ ] Explore different question types
- [ ] Practice with secure browser mode

#### Week 4: Deep Dive
- [ ] Review technical documentation for developers
- [ ] Understand state management (Redux)
- [ ] Learn about component architecture
- [ ] Study API integration patterns
- [ ] Shadow experienced team member on support case

#### Ongoing:
- [ ] Attend weekly team sync meetings
- [ ] Participate in code reviews
- [ ] Contribute to documentation updates
- [ ] Stay updated on new features and releases

---

## 🎓 Training Resources

### Recommended Learning Path:

1. **Business Context** (2-3 hours)
   - Online assessment industry overview
   - Proctoring best practices
   - Compliance and security standards

2. **Product Familiarization** (4-5 hours)
   - Complete assessment as candidate
   - Review admin/reviewer workflow
   - Explore all question types and features

3. **Technical Understanding** (1-2 weeks)
   - React and TypeScript fundamentals
   - State management with Redux
   - AWS S3 and cloud storage concepts
   - API integration patterns

4. **Hands-On Practice** (Ongoing)
   - Work on bug fixes and minor features
   - Participate in testing and QA
   - Shadow customer support cases
   - Contribute to documentation

---

## 🎯 Success Metrics

### Platform Performance:

- **Uptime**: Target 99.9% availability
- **Response Time**: API calls < 500ms average
- **Load Capacity**: Support 1000+ concurrent candidates
- **Error Rate**: < 0.1% of assessment sessions

### Business Metrics:

- **Assessment Completion Rate**: Target > 95%
- **Candidate Satisfaction**: Target > 4.0/5.0
- **Support Ticket Volume**: Target < 5% of assessments
- **Time to Resolution**: Target < 24 hours for critical issues

### Quality Metrics:

- **Code Coverage**: Target > 80% test coverage
- **Build Success Rate**: Target > 95% on first try
- **Security Incidents**: Target zero critical vulnerabilities
- **Performance Score**: Target > 90/100 (Lighthouse)

---

## 🏆 Best Practices

### For Assessment Administrators:

1. **Pre-Assessment**
   - Test assessment flow before sending to candidates
   - Verify all questions display correctly
   - Ensure timing and section configuration is correct
   - Send clear instructions to candidates

2. **During Assessment**
   - Monitor system health and candidate progress
   - Have support team available for issues
   - Track completion rates in real-time
   - Be prepared for technical support cases

3. **Post-Assessment**
   - Review proctoring data systematically
   - Generate reports promptly
   - Store data securely with proper retention
   - Collect feedback for continuous improvement

### For Candidates:

1. **Technical Requirements**
   - Use recommended browsers (Chrome, Firefox, Edge)
   - Ensure stable internet connection (minimum 5 Mbps)
   - Test camera and microphone before assessment
   - Close unnecessary applications

2. **Environment Setup**
   - Find quiet, well-lit location
   - Sit in front of neutral background
   - Ensure face is clearly visible to camera
   - Have valid ID ready if required

3. **During Assessment**
   - Read all instructions carefully
   - Monitor time remaining on each section
   - Answer all questions (skip if unsure, return later)
   - Don't switch tabs or open other applications
   - Ask for help if technical issues occur

---

## 🔐 Compliance & Legal

### Data Protection:
- **GDPR Compliance**: European data protection standards
- **CCPA Compliance**: California privacy requirements
- **Data Retention**: Configured retention periods per regulation
- **Right to Deletion**: Candidate can request data removal

### Assessment Standards:
- **Fair Testing Practices**: Standardized conditions for all candidates
- **Accessibility**: Compliance with WCAG 2.1 guidelines
- **Equal Opportunity**: No bias in question presentation
- **Reasonable Accommodations**: Support for candidates with disabilities

### Terms of Use:
- Candidates must accept terms before starting
- Clear explanation of proctoring and monitoring
- Consent for camera and screen capture
- Data usage and privacy policy acknowledgment

---

## 📚 Additional Resources

### Documentation Files:
- `README.md` - Technical README for developers
- `ENV_SETUP.md` - Environment configuration guide
- `IMPLEMENTATION_COMPLETE.md` - Implementation status and details
- `S3_FOLDER_STRUCTURE.md` - Media storage organization
- `DYNAMIC_QUESTIONS_IMPLEMENTATION.md` - Dynamic questions guide
- `MCQ_DYNAMIC_IMPLEMENTATION.md` - MCQ implementation details

### External References:
- React Documentation: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs
- AWS S3 Documentation: https://docs.aws.amazon.com/s3
- Ant Design Components: https://ant.design
- Tailwind CSS: https://tailwindcss.com

### Video Tutorials:
- Platform Overview (Internal)
- Candidate Experience Walkthrough (Internal)
- Admin Panel Training (Internal)
- Troubleshooting Common Issues (Internal)

---

## 🎬 Conclusion

MeritEdge is a comprehensive, secure, and user-friendly assessment platform designed to streamline the candidate evaluation process. With robust proctoring features, flexible question types, and reliable data management, it serves as a critical tool in modern hiring workflows.

This documentation provides the foundation for understanding the platform from a business and operational perspective. For technical implementation details, refer to the developer-focused documentation files.

### Key Takeaways:
✅ Secure, proctored online assessment platform  
✅ Multiple question types and formats  
✅ Real-time monitoring and data collection  
✅ Cloud-based storage for scalability  
✅ Environment-specific configurations  
✅ Comprehensive security measures  
✅ User-friendly candidate experience  
✅ Audit trail and compliance features  

---

**Document Maintained By**: MeritEdge Product & Development Team  
**For Updates**: Contact product@meritedge.com  
**Last Review**: October 16, 2025  
**Next Review**: January 16, 2026

---

*This document is confidential and intended for internal use by MeritEdge team members and authorized stakeholders.*


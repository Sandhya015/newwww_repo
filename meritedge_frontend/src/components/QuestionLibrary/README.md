# QuestionLibrary Components Structure

This directory contains all components related to question management, organized by their primary usage modules.

## Folder Structure

### 📁 Core/
**Shared components used across multiple modules**

- `QuestionFilter.tsx` - Filter component for questions
- `QuestionHeader.tsx` - Header component for question pages
- `QuestionType.tsx` - Question type display component

### 📁 QuestionAdd/
**Components specifically for question creation**

- `QuestionCreator.tsx` - Main question creation component with forms

### 📁 QuestionLibrary/
**Components for the main question library functionality**

- `MyLibraryQuestion.tsx` - Original My Library question component
- `OtomeytLibraryQuestion.tsx` - Otomeyt Library question component
- `QuestionLibraryDedicatedCreator.tsx` - Dedicated creator for library
- `QuestionLibraryDedicatedList.tsx` - Dedicated list component
- `QuestionLibraryDedicatedMyLibraryQuestion.tsx` - Dedicated My Library component
- `QuestionLibraryDedicatedQuestionList.tsx` - Dedicated question list component
- `QuestionLibraryDedicatedSideBar.tsx` - Dedicated sidebar component
- `QuestionLibrarySideBar.tsx` - Main library sidebar
- `QuestionList.tsx` - Main question list component

### 📁 QuestionSettings/
**Components for question settings (currently empty)**

- Reserved for future question settings components

## Import Paths

### From Pages:
```typescript
// Core components
import QuestionHeader from "../../components/QuestionLibrary/Core/QuestionHeader";

// QuestionLibrary components
import QuestionLibraryDedicatedList from "../../components/QuestionLibrary/QuestionLibrary/QuestionLibraryDedicatedList";

// QuestionAdd components
import QuestionCreator from "../../components/QuestionLibrary/QuestionAdd/QuestionCreator";
```

### From Within Components:
```typescript
// Core components
import QuestionFilter from "../Core/QuestionFilter";

// Cross-module imports
import QuestionCreator from "../QuestionAdd/QuestionCreator";
```

## Benefits of This Structure

1. **Clear Separation**: Components are organized by their primary usage
2. **Easy Navigation**: Developers can quickly find components by module
3. **Reduced Confusion**: No more mixed components in a single folder
4. **Scalable**: Easy to add new components to appropriate modules
5. **Maintainable**: Clear dependencies and relationships

## Migration Notes

- All import paths have been updated
- No functionality has been changed
- All existing features continue to work as before
- The refactoring is purely organizational


QuestionLibrary.tsx (Parent)
    ↓
QuestionLibraryDedicatedList.tsx (fetchCompanyQuestions)
    ↓
QuestionLibraryDedicatedQuestionList.tsx (onRefresh callback)
    ↓
QuestionCreationModal.tsx (createQuestion API)
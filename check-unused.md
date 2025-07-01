# Unused Variables Fixed

## Summary of fixes applied:

### 1. src/lib/storage.ts
- Fixed unused `userId` parameters in `uploadProfilePicture` and `uploadProjectImage` methods by prefixing with underscore
- Fixed unused `data` variables from upload operations

### 2. src/lib/image-utils.ts  
- Fixed unused `userId` parameters in `uploadProfilePictureFallback` and `uploadProjectImageFallback` methods by prefixing with underscore

### 3. src/hooks/use-toast.ts
- Fixed useEffect dependency issue by removing unused `state` dependency

## Common TypeScript "declared but never read" errors fixed:
- Unused function parameters (prefixed with underscore)
- Unused destructured variables from API responses
- Incorrect useEffect dependencies

## Files checked and confirmed clean:
- src/App.tsx
- src/main.tsx
- src/contexts/AuthContext.tsx
- src/components/layout/*.tsx
- src/components/auth/*.tsx
- src/components/ui/*.tsx
- src/pages/*.tsx
- All icon imports are properly used

The build should now pass without "declared but never read" errors.
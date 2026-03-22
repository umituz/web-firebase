# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-21

### ⚠️ BREAKING CHANGES

This is a complete rewrite with Domain-Driven Design architecture. The package structure and API have significantly changed.

#### Package Structure
- **Removed**: Root barrel import (`import { ... } from '@umituz/web-firebase'`)
- **Added**: Subpath imports for each DDD layer
- **Changed**: Service pattern → Repository pattern
- **Changed**: Config-based architecture → DDD architecture

#### Import Changes

**Before (v1.x):**
```typescript
import { AuthService, FirestoreService, StorageService } from '@umituz/web-firebase'
```

**After (v2.0.0):**
```typescript
import { AuthAdapter } from '@umituz/web-firebase/infrastructure'
import { FirestoreAdapter } from '@umituz/web-firebase/infrastructure'
import { StorageAdapter } from '@umituz/web-firebase/infrastructure'
```

#### Initialization Changes

**Before (v1.x):**
```typescript
import { FirebaseService } from '@umituz/web-firebase'

const firebase = new FirebaseService(config)
await firebase.auth.signIn(email, password)
```

**After (v2.0.0):**
```typescript
import { initializeFirebaseApp } from '@umituz/web-firebase/infrastructure'
import { AuthAdapter } from '@umituz/web-firebase/infrastructure'

initializeFirebaseApp(config)
const auth = new AuthAdapter()
await auth.signIn(email, password)
```

### ✨ Added

#### Domain Layer
- User entity with complete profile, settings, subscription model
- File entity with metadata and upload progress tracking
- Value objects for type safety (UserId, Email, FilePath)
- Repository interfaces (IAuthRepository, IUserRepository, IFileRepository)
- Domain-specific error types (AuthError, RepositoryError)

#### Application Layer
- Use cases for authentication (SignInUseCase, SignUpUseCase, ResetPasswordUseCase)
- Use cases for user management (UpdateProfileUseCase, DeleteAccountUseCase)
- Data Transfer Objects (DTOs) for type-safe operations

#### Infrastructure Layer
- AuthAdapter implementing IAuthRepository with Firebase Auth
- FirestoreAdapter implementing IUserRepository with Firestore
- StorageAdapter implementing IFileRepository with Firebase Storage
- Firebase client initialization with singleton pattern
- Complete error handling with domain error mapping

#### Presentation Layer
- useAuth hook for authentication state and operations
- useUser hook for user data management
- useFirestore hook for real-time data synchronization
- useStorage hook for file uploads with progress tracking
- FirebaseProvider for context-based Firebase initialization

#### Package Features
- Subpath exports for optimal tree-shaking
- TypeScript strict mode support
- Zero code duplication
- Complete separation of concerns

### 🔄 Changed

- **Firebase SDK**: Updated from 12.10.0 to 12.11.0
- **Architecture**: Config-based → Domain-Driven Design
- **Pattern**: Service pattern → Repository pattern
- **Error Handling**: Generic errors → Domain-specific errors
- **Type Safety**: Improved with strict typing
- **Bundle Size**: Reduced with subpath exports

### 🗑️ Removed

- Config-based patterns (ConfigBuilder, pre-built configs)
- Service classes (AuthService, FirestoreService, etc.)
- Root barrel import
- Utility functions (moved to infrastructure layer)
- Old hook implementations

### 📝 Migration Guide

See [README.md](./README.md#-migration-from-v1x-to-v200) for detailed migration instructions.

#### Quick Migration Steps

1. Update package:
   ```bash
   npm install @umituz/web-firebase@^2.0.0
   ```

2. Update imports to use subpaths:
   ```typescript
   // Before
   import { AuthService } from '@umituz/web-firebase'

   // After
   import { AuthAdapter } from '@umituz/web-firebase/infrastructure'
   ```

3. Update initialization:
   ```typescript
   // Before
   const firebase = new FirebaseService(config)

   // After
   initializeFirebaseApp(config)
   const auth = new AuthAdapter()
   ```

4. Update error handling:
   ```typescript
   // Before
   try {
     await signIn(email, password)
   } catch (error: any) {
     if (error.code === 'auth/user-not-found') { ... }
   }

   // After
   try {
     await signIn(email, password)
   } catch (error) {
     if (error instanceof AuthError) {
       if (error.code === AuthErrorCode.USER_NOT_FOUND) { ... }
     }
   }
   ```

### 🔧 Dependencies

**Updated:**
- firebase: ^12.10.0 → ^12.11.0
- typescript: ^5.0.0 → ^5.0.0 (no change)
- tsup: ^8.0.0 → ^8.0.0 (no change)

**Peer Dependencies:**
- firebase: ">=12" (unchanged)
- react: ">=18" (unchanged)

## [1.0.5] - Previous Versions

Previous versions used config-based architecture. See v1.0.5 documentation for details.

---

## Versioning Scheme

- **Major version (X.0.0)**: Breaking changes, architecture changes
- **Minor version (0.X.0)**: New features, backward compatible
- **Patch version (0.0.X)**: Bug fixes, minor improvements

## Support

For migration help, questions, or issues:
- Open a GitHub issue
- Check the [README.md](./README.md) for usage examples
- Review the code documentation in the source files

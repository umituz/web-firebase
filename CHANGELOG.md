# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.1] - 2026-03-22

### 🐛 Fixed

- **Environment Variables** - Changed from `process.env` to `import.meta.env` for Vite compatibility
- Firebase configuration now properly reads environment variables in Vite applications

### 🔧 Dependencies

**No changes** - All dependencies remain the same

---

## [3.2.0] - 2026-03-22

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-03-22

### ✨ Added

#### Authentication Configuration
- **AuthConfig** - Centralized configuration system for authentication
- **AuthConfigManager** - Singleton manager for auth configuration
- **initAuthConfig()** - Initialize auth with custom settings
- `googleEnabled` - Enable/disable Google OAuth
- `appleEnabled` - Enable/disable Apple OAuth
- `googleScopes` - Configure custom Google OAuth scopes
- `googleCustomParameters` - Set custom parameters for Google OAuth

#### Google & Apple OAuth Support
- **Google Sign-In** - Full Google OAuth provider support
- **Apple Sign-In** - Full Apple OAuth provider support
- Redirect flow support for better mobile UX
- Custom scopes and parameters support

#### Provider Linking/Unlinking
- **linkGoogle()** - Link Google account to current user
- **linkApple()** - Link Apple account to current user
- **unlinkProvider()** - Unlink a provider from current user
- Support for multiple auth providers per account

#### Token Management
- **getIdToken()** - Get ID token with optional force refresh
- **refreshToken()** - Force refresh ID token

#### Enhanced useAuth Hook
- `signInWithGoogle(useRedirect)` - Google sign-in with redirect option
- `signInWithApple(useRedirect)` - Apple sign-in with redirect option
- Provider management: `linkGoogle()`, `linkApple()`, `unlinkProvider()`
- Token management: `getIdToken()`, `refreshToken()`
- Account management: `updateEmail()`, `updatePassword()`, `deleteAccount()`
- Config access: `googleEnabled`, `appleEnabled`, `emailPasswordEnabled`

#### New Subpath Export
- `@umituz/web-firebase/config` - Direct import of auth configuration

### 🔄 Changed

- **AuthAdapter** - Simplified for Google & Apple only
- **AuthService** - Now uses AuthAdapter internally (facade pattern)
- **useAuth** - Complete rewrite with Google & Apple support
- Configuration is now centralized and type-safe
- Better error handling for Google & Apple OAuth

### 📝 Usage Examples

#### Basic Configuration

```typescript
import { initAuthConfig } from '@umituz/web-firebase/config'

initAuthConfig({
  googleEnabled: true,
  appleEnabled: true,
  googleScopes: ['profile', 'email'],
  googleCustomParameters: {
    prompt: 'select_account',
  },
  autoCreateUserDocument: true,
  defaultUserSettings: {
    theme: 'dark',
    language: 'tr',
  },
})
```

#### OAuth Sign In

```typescript
import { useAuth } from '@umituz/web-firebase/presentation'

function Login() {
  const { signInWithGoogle, signInWithApple } = useAuth()

  return (
    <>
      <button onClick={() => signInWithGoogle()}>Google</button>
      <button onClick={() => signInWithApple()}>Apple</button>
    </>
  )
}
```

#### Provider Linking

```typescript
const { linkGoogle, linkApple, unlinkProvider } = useAuth()

// Link Google to existing account
await linkGoogle()

// Link Apple to existing account
await linkApple()

// Unlink Google
await unlinkProvider('google.com')
```

### 🔧 Dependencies

**No changes** - All dependencies remain the same

---

## [3.0.1] - 2026-03-21

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2026-03-22

### ✨ Added

#### Authentication Configuration
- **AuthConfig** - Centralized configuration system for authentication
- **AuthConfigManager** - Singleton manager for auth configuration
- **initAuthConfig()** - Initialize auth with custom settings
- **OAuthProviderType** - Type for all supported OAuth providers

#### Multiple OAuth Providers
- **Google** - Google OAuth provider (previously supported)
- **Facebook** - Facebook OAuth provider
- **GitHub** - GitHub OAuth provider
- **Twitter** - Twitter OAuth provider
- **Apple** - Apple Sign In provider
- **Microsoft** - Microsoft Azure AD provider
- **Yahoo** - Yahoo OAuth provider
- **LinkedIn** - LinkedIn OAuth provider

#### Auth Configuration Features
- Enable/disable specific OAuth providers
- Configure custom scopes for each provider
- Set custom parameters for OAuth flows
- Enable/disable email/password authentication
- Configure email verification requirement
- Auto-create user documents in Firestore
- Set default user settings (theme, language, timezone, currency, notifications, privacy)
- Configure default subscription plan
- Token refresh settings
- Session persistence options

#### Provider Linking/Unlinking
- **linkOAuthProvider()** - Link OAuth provider to current user
- **unlinkProvider()** - Unlink a provider from current user
- Support for multiple auth providers per account

#### Token Management
- **getIdToken()** - Get ID token with optional force refresh
- **refreshToken()** - Force refresh ID token

#### Enhanced useAuth Hook
- New OAuth methods: `signInWithFacebook()`, `signInWithGithub()`, `signInWithTwitter()`, `signInWithApple()`, `signInWithMicrosoft()`
- Generic `signInWithOAuth(provider, useRedirect)` method
- Provider management: `linkProvider()`, `unlinkProvider()`
- Token management: `getIdToken()`, `refreshToken()`
- Account management: `updateEmail()`, `updatePassword()`, `deleteAccount()`
- Config access: `enabledProviders`, `isEmailPasswordEnabled`

#### New Subpath Export
- `@umituz/web-firebase/config` - Direct import of auth configuration

### 🔄 Changed

- **AuthAdapter** - Enhanced with OAuth provider factory pattern
- **AuthService** - Now uses AuthAdapter internally (facade pattern)
- **useAuth** - Complete rewrite with all new features
- Configuration is now centralized and type-safe
- Better error handling for all OAuth providers

### 📝 Usage Examples

#### Basic Configuration

```typescript
import { initAuthConfig } from '@umituz/web-firebase/config'

initAuthConfig({
  oauthProviders: {
    google: { enabled: true, scopes: ['profile', 'email'] },
    facebook: { enabled: true },
    github: { enabled: true },
  },
  autoCreateUserDocument: true,
  defaultUserSettings: {
    theme: 'dark',
    language: 'tr',
  },
})
```

#### OAuth Sign In

```typescript
import { useAuth } from '@umituz/web-firebase/presentation'

function Login() {
  const { signInWithGoogle, signInWithFacebook, signInWithGithub } = useAuth()

  return (
    <>
      <button onClick={() => signInWithGoogle()}>Google</button>
      <button onClick={() => signInWithFacebook()}>Facebook</button>
      <button onClick={() => signInWithGithub()}>GitHub</button>
    </>
  )
}
```

#### Provider Linking

```typescript
const { linkProvider, unlinkProvider } = useAuth()

// Link Facebook to existing account
await linkProvider('facebook')

// Unlink Google
await unlinkProvider('google.com')
```

### 🔧 Dependencies

**No changes** - All dependencies remain the same

---

## [3.0.1] - 2026-03-21

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

# @umituz/web-firebase

Comprehensive Firebase integration with Domain-Driven Design (DDD) architecture for web applications.

## 🚀 Features

- ✅ **DDD Architecture** - Clean separation of concerns with 4 distinct layers
- ✅ **Type-Safe** - Full TypeScript support with strict typing
- ✅ **Repository Pattern** - Abstract data access from business logic
- ✅ **Use Cases** - Orchestrated business logic operations
- ✅ **React Hooks** - Ready-to-use presentation layer hooks
- ✅ **Error Handling** - Domain-specific error types
- ✅ **Zero Code Duplication** - Package-driven development ready

## 📦 Installation

```bash
npm install @umituz/web-firebase firebase@^12
```

## 🏗️ Architecture

This package follows Domain-Driven Design principles with clear layer separation:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  React Hooks, Providers - UI interactions               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Application Layer                       │
│  Use Cases, DTOs - Business logic orchestration         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                   Domain Layer                           │
│  Entities, Interfaces, Errors - Core business model     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                Infrastructure Layer                      │
│  Firebase Adapters - External service implementations   │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Quick Start

### 1. Initialize Firebase

```typescript
// Initialize Firebase in your app
import { initializeFirebaseApp } from '@umituz/web-firebase/infrastructure'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

initializeFirebaseApp(firebaseConfig)
```

### 2. Use Domain Layer (Types & Interfaces)

```typescript
import type { User, UserProfile } from '@umituz/web-firebase/domain'
import type { IAuthRepository, IUserRepository } from '@umituz/web-firebase/domain'

// Use domain entities in your app
const user: User = {
  profile: {
    email: 'user@example.com',
    displayName: 'John Doe',
    createdAt: Date.now(),
  },
  settings: {
    theme: 'light',
    language: 'en',
  },
  // ... other fields
}
```

### 3. Use Application Layer (Use Cases)

```typescript
import { SignInUseCase, SignUpUseCase } from '@umituz/web-firebase/application'
import { AuthAdapter } from '@umituz/web-firebase/infrastructure'

// Create adapters
const authRepository = new AuthAdapter()
const userRepository = new FirestoreAdapter()

// Create use cases
const signInUseCase = new SignInUseCase(authRepository)
const signUpUseCase = new SignUpUseCase(authRepository)

// Execute use cases
const result = await signInUseCase.execute({
  email: 'user@example.com',
  password: 'Password123',
})
```

### 4. Use Infrastructure Layer (Adapters)

```typescript
import { AuthAdapter, FirestoreAdapter, StorageAdapter } from '@umituz/web-firebase/infrastructure'

// Direct adapter usage
const authAdapter = new AuthAdapter()
await authAdapter.signIn('user@example.com', 'Password123')

const firestoreAdapter = new FirestoreAdapter()
const user = await firestoreAdapter.getUser('user-id')

const storageAdapter = new StorageAdapter()
const result = await storageAdapter.uploadFile('user-id', 'path', file)
```

### 5. Use Presentation Layer (React Hooks)

```typescript
import { FirebaseProvider } from '@umituz/web-firebase/presentation'
import { useAuth } from '@umituz/web-firebase/presentation'

function App() {
  return (
    <FirebaseProvider config={firebaseConfig}>
      <YourApp />
    </FirebaseProvider>
  )
}

function Profile() {
  const { user, loading, signIn, signOut } = useAuth({
    authRepository: new AuthAdapter(),
    userRepository: new FirestoreAdapter(),
  })

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <p>Welcome, {user?.profile.displayName}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

## 📚 Subpath Imports

**⚠️ IMPORTANT:** Do NOT use the root barrel import. Use subpath imports for better tree-shaking and clear dependencies.

### Domain Layer

```typescript
// Entities
import type { User, UserProfile, UserSettings } from '@umituz/web-firebase/domain'
import type { FileMetadata, UploadProgress, UploadResult } from '@umituz/web-firebase/domain'

// Repository Interfaces
import type { IAuthRepository } from '@umituz/web-firebase/domain'
import type { IUserRepository } from '@umituz/web-firebase/domain'
import type { IFileRepository } from '@umituz/web-firebase/domain'

// Errors
import { AuthError, AuthErrorCode } from '@umituz/web-firebase/domain'
import { RepositoryError, RepositoryErrorCode } from '@umituz/web-firebase/domain'
```

### Application Layer

```typescript
// Use Cases
import { SignInUseCase, SignUpUseCase } from '@umituz/web-firebase/application'
import { UpdateProfileUseCase, DeleteAccountUseCase } from '@umituz/web-firebase/application'

// DTOs
import type { SignInDTO, SignUpDTO } from '@umituz/web-firebase/application'
```

### Infrastructure Layer

```typescript
// Firebase Client
import { initializeFirebaseApp, getFirebaseAuth, getFirebaseDB } from '@umituz/web-firebase/infrastructure'

// Adapters
import { AuthAdapter } from '@umituz/web-firebase/infrastructure'
import { FirestoreAdapter } from '@umituz/web-firebase/infrastructure'
import { StorageAdapter } from '@umituz/web-firebase/infrastructure'

// Utils
import { generateUniqueFilename, getFileExtension } from '@umituz/web-firebase/infrastructure'
```

### Presentation Layer

```typescript
// Providers
import { FirebaseProvider } from '@umituz/web-firebase/presentation'

// Hooks
import { useAuth } from '@umituz/web-firebase/presentation'
import { useUser } from '@umituz/web-firebase/presentation'
import { useFirestore } from '@umituz/web-firebase/presentation'
import { useStorage } from '@umituz/web-firebase/presentation'
```

## 🔥 Detailed Usage

### Authentication

```typescript
import { AuthAdapter } from '@umituz/web-firebase/infrastructure'

const auth = new AuthAdapter()

// Sign in with email/password
const credential = await auth.signIn('user@example.com', 'password')

// Sign up
const credential = await auth.signUp('user@example.com', 'password', 'John Doe')

// Sign in with Google
const credential = await auth.signInWithGoogle()

// Sign out
await auth.signOut()

// Password reset
await auth.sendPasswordReset('user@example.com')

// Update profile
await auth.updateProfile({ displayName: 'Jane Doe' })

// Update email
await auth.updateEmail('new@example.com', 'current-password')

// Update password
await auth.updatePassword('current-password', 'new-password')

// Delete account
await auth.deleteAccount('current-password')
```

### User Management (Firestore)

```typescript
import { FirestoreAdapter } from '@umituz/web-firebase/infrastructure'

const firestore = new FirestoreAdapter()

// Get user
const user = await firestore.getUser('user-id')

// Get user by email
const user = await firestore.getUserByEmail('user@example.com')

// Create user
await firestore.createUser('user-id', {
  profile: {
    email: 'user@example.com',
    displayName: 'John Doe',
    createdAt: Date.now(),
  },
})

// Update user
await firestore.updateUser('user-id', {
  'settings.theme': 'dark',
})

// Update profile
await firestore.updateProfile('user-id', {
  displayName: 'Jane Doe',
  photoURL: 'https://...',
})

// Update settings
await firestore.updateSettings('user-id', {
  theme: 'dark',
  language: 'tr',
})

// Update subscription
await firestore.updateSubscription('user-id', {
  plan: 'premium',
  status: 'active',
})

// Update last login
await firestore.updateLastLogin('user-id')

// Delete user
await firestore.deleteUser('user-id')

// Query users
const users = await firestore.queryUsers([
  where('profile.email', '==', 'user@example.com'),
])

// Subscribe to user updates
const unsubscribe = firestore.subscribeToUser(
  'user-id',
  (user) => console.log('User updated:', user),
  (error) => console.error('Error:', error)
)
```

### File Storage

```typescript
import { StorageAdapter } from '@umituz/web-firebase/infrastructure'

const storage = new StorageAdapter()

// Upload file
const result = await storage.uploadFile('user-id', 'path/to/file', file, {
  onProgress: (progress) => console.log(`${progress.progress}%`),
})

// Upload specific types
await storage.uploadImage('user-id', file, 'custom-name.jpg')
await storage.uploadVideo('user-id', file, 'custom-name.mp4')
await storage.uploadDocument('user-id', file, 'custom-name.pdf')
await storage.uploadProfilePicture('user-id', file)

// Get download URL
const url = await storage.getDownloadURL('users/user-id/path/to/file')

// Delete file
await storage.deleteFile('users/user-id/path/to/file')
await storage.deleteImage('user-id', 'filename.jpg')
await storage.deleteVideo('user-id', 'filename.mp4')
await storage.deleteProfilePicture('user-id', 'filename.jpg')
await storage.deleteUserFiles('user-id')

// List files
const urls = await storage.listUserFiles('user-id')
const images = await storage.listUserImages('user-id')
const videos = await storage.listUserVideos('user-id')

// Get metadata
const metadata = await storage.getFileMetadata('users/user-id/file.jpg')

// Query files
const { files, totalCount, hasMore } = await storage.queryFiles('user-id')

// Get storage stats
const stats = await storage.getStorageStats('user-id')

// Validate file
const isValid = storage.validateFile(file, {
  maxSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png'],
})

// Check file types
storage.isImageFile(file)
storage.isVideoFile(file)
storage.isDocumentFile(file)

// Generate unique filename
const filename = storage.generateUniqueFilename('photo.jpg')

// Get file extension
const ext = storage.getFileExtension('photo.jpg')
```

### React Hooks

```typescript
import {
  useAuth,
  useUser,
  useFirestore,
  useStorage,
} from '@umituz/web-firebase/presentation'

function MyComponent() {
  // Auth hook
  const {
    user: firebaseUser,
    user: userData,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  } = useAuth({
    authRepository: new AuthAdapter(),
    userRepository: new FirestoreAdapter(),
  })

  // User hook
  const { user, loading: userLoading } = useUser({
    userRepository: new FirestoreAdapter(),
    userId: firebaseUser?.uid,
  })

  // Storage hook
  const {
    uploadFile,
    uploadImage,
    uploadProfilePicture,
    deleteFile,
    uploading,
    progress,
    error: storageError,
  } = useStorage({
    fileRepository: new StorageAdapter(),
    userId: firebaseUser?.uid,
  })
}
```

## 🔄 Migration from v1.x to v2.0.0

Version 2.0.0 is a **breaking change** with complete DDD architecture. Here's how to migrate:

### Before (v1.x)

```typescript
import { FirebaseService, AuthService } from '@umituz/web-firebase'

const service = new FirebaseService(config)
await service.auth.signIn(email, password)
```

### After (v2.0.0)

```typescript
import { initializeFirebaseApp } from '@umituz/web-firebase/infrastructure'
import { AuthAdapter } from '@umituz/web-firebase/infrastructure'

initializeFirebaseApp(config)
const auth = new AuthAdapter()
await auth.signIn(email, password)
```

### Key Changes

1. **Subpath imports required** - No more root barrel imports
2. **Repository pattern** - Use adapters instead of services
3. **Error types** - Domain-specific errors instead of generic errors
4. **Use cases** - Business logic in application layer
5. **Types** - Import domain types separately

### Migration Steps

1. Update package version:
   ```bash
   npm install @umituz/web-firebase@^2.0.0
   ```

2. Update imports:
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
   ```

4. Update method calls:
   ```typescript
   // Before - service pattern
   const user = await firebase.auth.getUser(uid)

   // After - repository pattern
   const user = await firestoreAdapter.getUser(uid)
   ```

## 📦 Package Structure

```
src/
├── domain/                    # Core business model
│   ├── entities/             # Domain entities
│   │   ├── user.entity.ts
│   │   └── file.entity.ts
│   ├── interfaces/           # Repository interfaces
│   │   ├── auth.repository.interface.ts
│   │   ├── user.repository.interface.ts
│   │   └── file.repository.interface.ts
│   └── errors/              # Domain errors
│       ├── auth.errors.ts
│       └── repository.errors.ts
│
├── application/              # Business logic
│   ├── use-cases/           # Use cases
│   │   ├── auth/
│   │   │   ├── sign-in.use-case.ts
│   │   │   ├── sign-up.use-case.ts
│   │   │   └── reset-password.use-case.ts
│   │   └── user/
│   │       ├── update-profile.use-case.ts
│   │       └── delete-account.use-case.ts
│   └── dto/                 # Data Transfer Objects
│       ├── auth.dto.ts
│       └── user.dto.ts
│
├── infrastructure/           # External integrations
│   ├── firebase/           # Firebase adapters
│   │   ├── client.ts
│   │   ├── auth.adapter.ts
│   │   ├── firestore.adapter.ts
│   │   └── storage.adapter.ts
│   └── utils/              # Utility functions
│       └── storage.util.ts
│
└── presentation/            # UI layer
    ├── hooks/              # React hooks
    │   ├── useAuth.ts
    │   ├── useUser.ts
    │   ├── useFirestore.ts
    │   └── useStorage.ts
    └── providers/          # Context providers
        └── FirebaseProvider.tsx
```

## 🎯 Use Cases

- **Social Media Apps** - User profiles, posts, media storage
- **E-commerce** - Product catalogs, user accounts, order management
- **SaaS** - Subscription management, user settings, analytics
- **Chat Apps** - Real-time messaging, user presence
- **Blogs/CMS** - Content management, media uploads

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please follow our DDD architecture principles when contributing.

Made with ❤️ by umituz

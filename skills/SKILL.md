# @umituz/web-firebase Integration Skill

## 🎯 Overview

Profesyonel Firebase entegrasyonu için rehber. Bu skill sayesinde:
- Kod tekrarı olmadan temiz repository pattern'i
- Type-safe query builder kullanımı
- Real-time listeners
- Production-ready error handling

## 📦 Installation

```bash
# Install the package
npm install @umituz/web-firebase

# Or update to latest
npm install @umituz/web-firebase@latest
```

## 🏗️ Architecture

### Layer Structure

```
@umituz/web-firebase/
├── infrastructure/       # Firebase adapters & low-level operations
│   ├── firebase/
│   │   ├── client.ts        # Firebase initialization
│   │   ├── auth.adapter.ts   # Auth helpers
│   │   ├── firestore.adapter.ts
│   │   └── storage.adapter.ts
│   ├── services/
│   │   ├── firestore.repository.ts  # Base repository
│   │   └── query.builder.ts       # Query builder
│   └── utils/
└── application/         # Use cases & DTOs
```

## 🚀 Quick Start

### 1. Initialize Firebase

```typescript
// src/config/firebase.config.ts
import { initializeFirebase } from '@umituz/web-firebase';
import type { FirebaseConfig } from '@umituz/web-firebase';

const config: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

initializeFirebase(config);
```

### 2. Create Repository

```typescript
// src/repositories/user.repository.ts
import { FirestoreRepository } from '@umituz/web-firebase';
import type { User } from '@/models/user.model';

class UserRepository extends FirestoreRepository<User> {
  constructor() {
    super('users'); // Collection name
  }

  // Business logic only - CRUD handled by FirestoreRepository
  async getActiveUsers() {
    return this.getAll([where('status', '==', 'active')], undefined, true);
  }
}

export const userRepository = new UserRepository();
```

### 3. Use Repository

```typescript
// ✅ CORRECT - Using repository API
const users = await userRepository.getActiveUsers();

// ❌ WRONG - Direct Firebase imports (code duplication)
import { collection, query, where, getDocs } from 'firebase/firestore';
const db = getFirestore();
const q = query(collection(db, 'users'), where('status', '==', 'active'));
const snap = await getDocs(q);
```

## 🎯 Repository Pattern

### Basic CRUD

```typescript
import { FirestoreRepository } from '@umituz/web-firebase';

class ProductRepository extends FirestoreRepository<Product> {
  constructor() {
    super('products');
  }

  // Create with auto ID
  async createProduct(data: Omit<Product, 'id'>): Promise<string> {
    return this.createWithAutoId(data);
  }

  // Read by ID
  async getProduct(id: string): Promise<Product | null> {
    return this.getById(id);
  }

  // Update
  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await this.update(id, data);
  }

  // Delete
  async deleteProduct(id: string): Promise<void> {
    await this.delete(id);
  }
}
```

### Nested Collections

```typescript
class UserProjectRepository extends FirestoreRepository<Project> {
  constructor() {
    super('projects');
  }

  // Projects in users/{userId}/projects
  async getUserProjects(userId: string): Promise<Project[]> {
    return this.getAll([], `users/${userId}`);
  }

  async createProject(userId: string, data: Omit<Project, 'id'>): Promise<string> {
    return this.createWithAutoId(data, `users/${userId}`);
  }

  async updateProject(userId: string, projectId: string, data: Partial<Project>): Promise<void> {
    await this.update(projectId, data, `users/${userId}`);
  }
}
```

### Sub-Collections

```typescript
class OrganisationRepository extends FirestoreRepository<Organisation> {
  constructor() {
    super('organisations');
  }

  // Get members from users/{userId}/organisations/{orgId}/members
  async getMembers(organisationId: string): Promise<OrganisationMember[]> {
    return this.getSubCollection<OrganisationMember>(
      organisationId,
      'members',
      [where('isActive', '==', true)]
    );
  }

  // Add member to sub-collection
  async addMember(organisationId: string, member: Omit<OrganisationMember, 'id' | 'organisationId'>): Promise<string> {
    return this.addToSubCollection(OrganisationMember>(organisationId, 'members', member);
  }
}
```

## 🔍 Query Builder

### Fluent API

```typescript
import { QueryBuilder, createQueryBuilder, where, orderBy, limit } from '@umituz/web-firebase';

// Option 1: Using QueryBuilder class
const queryBuilder = new QueryBuilder<User>('users');
const activeUsers = await queryBuilder
  .where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .exec();

// Option 2: Using helper function
const queryBuilder = createQueryBuilder<User>('users');
const users = await queryBuilder
  .where('role', '==', 'admin')
  .orderBy('email', 'asc')
  .limit(5)
  .execOne();

// Option 3: In repository
class UserRepository extends FirestoreRepository<User> {
  async findRecentAdmins(limit = 10) {
    return createQueryBuilder<User>('users')
      .where('role', '==', 'admin')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .exec();
  }
}
```

### Query Constraints

```typescript
import { where, orderBy, limit as limitFn, startAfter } from '@umituz/web-firebase';

// Complex query
const results = await repository.getAll([
  where('status', '==', 'active'),
  where('role', 'in', ['admin', 'moderator']),
  orderBy('createdAt', 'desc'),
  limitFn(20)
], 'users/parentId');
```

## 📡 Real-Time Listeners

### Using onQuery Helper

```typescript
import { onQuery, where, orderBy } from '@umituz/web-firebase';

// Subscribe to query changes
const unsubscribe = onQuery<User>(
  'users',
  [where('status', '==', 'active'), orderBy('lastLogin', 'desc')],
  (users) => {
    console.log('Active users updated:', users.length);
    // Update React state, etc.
  }
);

// Cleanup on unmount
return () => unsubscribe();
```

### In React Component

```typescript
import { useEffect } from 'react';
import { onQuery, where, orderBy } from '@umituz/web-firebase';

function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = onQuery<User>(
      'users',
      [where('status', '==', 'active'), orderBy('name', 'asc')],
      setUsers
    );

    return () => unsubscribe();
  }, []);

  return <div>{users.length} active users</div>;
}
```

## 🔄 Pagination

### Cursor-Based Pagination

```typescript
import { paginate, where, orderBy, limit as limitFn } from '@umituz/web-firebase';

class PostRepository extends FirestoreRepository<Post> {
  async getPaginatedPosts(pageSize = 20, startAfterDoc?: any) {
    const { data, hasMore, lastDoc } = await paginate<Post>(
      'posts',
      [where('published', '==', true), orderBy('createdAt', 'desc')],
      pageSize,
      startAfterDoc
    );

    return {
      posts: data,
      hasMore,
      nextCursor: lastDoc
    };
  }
}

// Usage in component
const [posts, setPosts] = useState<Post[]>([]);
const [cursor, setCursor] = useState<any>(null);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const result = await postRepository.getPaginatedPosts(20, cursor);
  setPosts(prev => [...prev, ...result.posts]);
  setCursor(result.nextCursor);
  setHasMore(result.hasMore);
};
```

## ⚡ Batch Operations

### Using Repository Batch Method

```typescript
class OrderRepository extends FirestoreRepository<Order> {
  async batchUpdateStatus(orderIds: string[], status: OrderStatus) {
    const operations = orderIds.map(id => ({
      type: 'update' as const,
      id,
      data: { status }
    }));

    await this.batch(operations, 'users/userId/orders');
  }
}
```

### Custom Batch

```typescript
import { writeBatch, doc } from 'firebase/firestore';
import { getFirebaseDB } from '@umituz/web-firebase';

async function batchUpdateDocuments() {
  const db = getFirebaseDB();
  if (!db) return;

  const batch = writeBatch(db);

  // Add operations
  operations.forEach(({ id, data }) => {
    const ref = doc(db, 'collection', id);
    batch.update(ref, data);
  });

  await batch.commit();
}
```

## 🛡️ Error Handling

### Repository Error Handling

```typescript
class UserRepository extends FirestoreRepository<User> {
  async getUserById(id: string): Promise<User> {
    const user = await this.getById(id);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async getByEmailSafe(email: string): Promise<User | null> {
    try {
      const results = await this.getAll([where('email', '==', email)], undefined, true);
      return results[0] || null;
    } catch (error) {
      console.error('Failed to fetch user by email:', error);
      return null;
    }
  }
}
```

### Global Error Handler

```typescript
// src/services/error-handler.ts
import { getFirebaseDB } from '@umituz/web-firebase';

export function handleFirebaseError(error: unknown): never {
  if (error instanceof Error) {
    if (error.code === 'permission-denied') {
      throw new Error('Insufficient permissions');
    }
    if (error.code === 'not-found') {
      throw new Error('Resource not found');
    }
  }

  throw new Error('An unexpected error occurred');
}
```

## 🎨 Best Practices

### ✅ DO's

1. **Always use FirestoreRepository**
   ```typescript
   class MyRepo extends FirestoreRepository<MyType> {
     constructor() { super('collection'); }
   }
   ```

2. **Use QueryBuilder for complex queries**
   ```typescript
   const results = await createQueryBuilder('users')
     .where('active', '==', true)
     .orderBy('name', 'asc')
     .limit(10)
     .exec();
   ```

3. **Handle errors gracefully**
   ```typescript
   try {
     const user = await repository.getById(id);
     if (!user) throw new Error('User not found');
   } catch (error) {
     // Log and handle
   }
   ```

4. **Use type-safe operations**
   ```typescript
   interface User { id: string; name: string; }
   const user = await repository.getById<User>(id);
   ```

### ❌ DON'Ts

1. **Don't import raw Firebase functions in app code**
   ```typescript
   // ❌ WRONG
   import { collection, query, where, getDocs } from 'firebase/firestore';

   // ✅ CORRECT
   import { FirestoreRepository, where } from '@umituz/web-firebase';
   ```

2. **Don't create duplicate CRUD logic**
   ```typescript
   // ❌ WRONG
   async getUser(id: string) {
     const db = getFirestore();
     const docRef = doc(db, 'users', id);
     const snap = await getDoc(docRef);
     return { id: snap.id, ...snap.data() };
   }

   // ✅ CORRECT
   async getUser(id: string) {
     return this.getById(id);
   }
   ```

3. **Don't hardcode collection paths**
   ```typescript
   // ❌ WRONG
   async getUsers() {
     return this.getAll([], 'users/userId/custom');
   }

   // ✅ CORRECT - Create dedicated repository
   class CustomRepository extends FirestoreRepository<Custom> {
     constructor() { super('custom'); }
   }
   ```

4. **Don't forget error handling**
   ```typescript
   // ❌ WRONG
   const user = await this.getById(id);
   return user.name; // Will crash if user is null

   // ✅ CORRECT
   const user = await this.getById(id);
   if (!user) return null;
   return user.name;
   ```

## 📚 Common Patterns

### Singleton Pattern

```typescript
// src/repositories/user.repository.ts
class UserRepository extends FirestoreRepository<User> {
  private static instance: UserRepository;

  constructor() {
    super('users');
  }

  static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }
}

export const userRepository = UserRepository.getInstance();
```

### Factory Pattern

```typescript
// src/repositories/index.ts
function createRepository<T extends DocumentData>(
  collectionName: string
): FirestoreRepository<T> {
  class DynamicRepository extends FirestoreRepository<T> {
    constructor() {
      super(collectionName);
    }
  }
  return new DynamicRepository();
}

export const userRepo = createRepository<User>('users');
```

### Context Pattern

```typescript
// src/contexts/RepositoryContext.tsx
import { createContext, useContext } from 'react';
import { userRepository } from '@/repositories';

const RepositoryContext = createContext({
  userRepository,
});

export function useRepositories() {
  return useContext(RepositoryContext);
}
```

## 🚀 Advanced Features

### Transactions

```typescript
import { runTransaction } from 'firebase/firestore';
import { getFirebaseDB } from '@umituz/web-firebase';

async function transferFunds(
  fromUserId: string,
  toUserId: string,
  amount: number
) {
  const db = getFirebaseDB();
  if (!db) throw new Error('Firebase not initialized');

  await runTransaction(db, async (transaction) {
    const fromRef = doc(db, 'users', fromUserId);
    const toRef = doc(db, 'users', toUserId);

    const fromSnap = await transaction.get(fromRef);
    const toSnap = await transaction.get(toRef);

    const fromBalance = fromSnap.data()?.balance || 0;

    if (fromBalance < amount) {
      throw new Error('Insufficient funds');
    }

    transaction.update(fromRef, { balance: fromBalance - amount });
    transaction.update(toRef, { balance: toBalance + amount });
  });
}
```

### Aggregation Queries

```typescript
class AnalyticsRepository extends FirestoreRepository<Analytics> {
  async getStatsByDateRange(startDate: Date, endDate: Date) {
    // For complex aggregations, consider:
    // 1. Using Firestore aggregates (if available)
    // 2. Client-side aggregation for small datasets
    // 3. Cloud Functions for large datasets

    const data = await this.getAll([
      where('date', '>=', startDate.toISOString()),
      where('date', '<=', endDate.toISOString())
    ]);

    // Aggregate in memory (for small datasets)
    return data.reduce((acc, curr) => {
      acc.totalViews += curr.views || 0;
      acc.totalClicks += curr.clicks || 0;
      return acc;
    }, { totalViews: 0, totalClicks: 0 });
  }
}
```

## 🔧 Troubleshooting

### Firebase Not Initialized

```typescript
import { isFirebaseInitialized } from '@umituz/web-firebase';

if (!isFirebaseInitialized()) {
  console.error('Firebase not initialized. Call initializeFirebase() first.');
}
```

### Collection Not Found

```typescript
async function safeGet(id: string) {
  const result = await repository.getById(id);
  if (!result) {
    console.warn(`Document ${id} not found in collection`);
    return null;
  }
  return result;
}
```

### Permission Errors

```typescript
import { FirebaseError } from '@umituz/web-firebase';

try {
  await repository.delete(id);
} catch (error) {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      // Show user-friendly error
      throw new Error('You don\'t have permission to delete this resource');
    }
  }
}
```

## 📝 Migration Guide

### From Raw Firebase to Repository Pattern

**Before (❌):**
```typescript
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';

async function getActiveUsers() {
  const db = getFirestore();
  const q = query(collection(db, 'users'), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
```

**After (✅):**
```typescript
import { FirestoreRepository, where } from '@umituz/web-firebase';

class UserRepository extends FirestoreRepository<User> {
  constructor() {
    super('users');
  }

  async getActiveUsers() {
    return this.getAll([where('status', '==', 'active')]);
  }
}
```

## 🎓 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Query Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [TypeScript Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html)

## 🤝 Contributing

When contributing to @umituz/web-firebase:

1. Follow existing repository pattern
2. Add type safety for all public APIs
3. Document new features in this SKILL.md
4. Include unit tests for new functionality
5. Follow semantic versioning

---

**Last Updated:** March 23, 2026
**Version:** 3.3.4
**Package:** @umituz/web-firebase

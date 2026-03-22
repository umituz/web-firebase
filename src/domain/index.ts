/**
 * Domain Layer
 * Subpath: @umituz/web-firebase/domain
 */

/**
 * Domain Layer Public API
 * @description Exports all domain entities, value objects, interfaces, and errors
 */

// Entities
export type { FirebaseUser, FirebaseTimestamp } from './entities/firebase.entity'
export * from './entities/user.entity'
export * from './entities/file.entity'
export * from './entities/timestamp.entity'

// Value Objects
export * from './value-objects/email.vo'
export * from './value-objects/user-id.vo'
export * from './value-objects/file-path.vo'

// Interfaces
export * from './interfaces/repository.interface'
export * from './interfaces/auth.repository.interface'
export * from './interfaces/user.repository.interface'
export * from './interfaces/file.repository.interface'

// Errors
export * from './errors/auth.errors'
export * from './errors/repository.errors'

// Config
export * from './config/auth.config'

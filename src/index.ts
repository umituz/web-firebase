/**
 * @umituz/web-firebase
 * Comprehensive Firebase integration with DDD architecture
 *
 * ONEMLI: App'ler bu root barrel'i kullanMAMALI.
 * Subpath import kullanin:
 * - "@umituz/web-firebase/domain" - Domain entities, value objects, interfaces
 * - "@umituz/web-firebase/application" - Use cases and DTOs
 * - "@umituz/web-firebase/infrastructure" - Firebase adapters
 * - "@umituz/web-firebase/presentation" - React hooks and providers
 */

// Domain entities, value objects, interfaces, errors
export * from './domain'

// Application use cases and DTOs
export * from './application'

// Infrastructure Firebase adapters
export * from './infrastructure'

// Presentation hooks and providers
export * from './presentation'

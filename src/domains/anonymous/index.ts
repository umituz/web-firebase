/**
 * Anonymous Domain Exports
 * Re-exports all anonymous authentication functionality
 */

export { AnonymousAuthService } from './services/anonymous-auth.service';
export { AnonymousUserRepository } from './repositories/anonymous-user.repository';
export * from './entities/anonymous-user.entity';
export * from './types/anonymous-auth.types';
export * from './repositories/anonymous-user.repository.interface';

// Singleton instance for easy import
import { AnonymousAuthService } from './services/anonymous-auth.service';
import { AnonymousUserRepository } from './repositories/anonymous-user.repository';

// Default export singleton
export const anonymousAuthService = new AnonymousAuthService(new AnonymousUserRepository());

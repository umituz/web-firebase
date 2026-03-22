/**
 * Email Value Object
 * @description Immutable email address value object with validation
 */

export class Email {
  private readonly value: string
  private readonly validated: boolean

  constructor(email: string) {
    this.value = email.trim().toLowerCase()
    this.validated = this.isValid()
    if (!this.validated) {
      throw new Error(`Invalid email address: ${email}`)
    }
  }

  /**
   * Validate email format
   */
  private isValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(this.value)
  }

  /**
   * Get email value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Get local part (before @)
   */
  getLocalPart(): string {
    return this.value.split('@')[0]
  }

  /**
   * Get domain part (after @)
   */
  getDomain(): string {
    return this.value.split('@')[1] || ''
  }

  /**
   * Check if email is from a specific domain
   */
  isFromDomain(domain: string): boolean {
    return this.getDomain() === domain.toLowerCase()
  }

  /**
   * Check if email is from a corporate domain (not gmail, yahoo, etc.)
   */
  isCorporate(): boolean {
    const freeDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'protonmail.com',
    ]
    return !freeDomains.includes(this.getDomain())
  }

  /**
   * Mask email for display (e.g., u***@gmail.com)
   */
  mask(): string {
    const [local, domain] = this.value.split('@')
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`
    }
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value
  }

  /**
   * Check equality with another email
   */
  equals(other: Email): boolean {
    return this.value === other.value
  }

  /**
   * Create Email from string (returns null if invalid)
   */
  static create(email: string): Email | null {
    try {
      return new Email(email)
    } catch {
      return null
    }
  }
}

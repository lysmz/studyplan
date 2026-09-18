export class SessionRequiredError extends Error {
  constructor() {
    super('Authentication is required.')
    this.name = 'SessionRequiredError'
  }
}

export class SessionService {
  private currentUserId: number | null = null

  start(userId: number): void {
    this.currentUserId = userId
  }

  clear(): void {
    this.currentUserId = null
  }

  getCurrentUserId(): number | null {
    return this.currentUserId
  }

  requireCurrentUserId(): number {
    if (this.currentUserId === null) throw new SessionRequiredError()
    return this.currentUserId
  }
}

/**
 * SessionManager
 *
 * Generates and manages TradingView WebSocket session IDs.
 * Session IDs follow the format: prefix + 12 random lowercase letters
 *
 * Examples:
 * - Quote session: qs_abcdefghijkl
 * - Chart session: cs_mnopqrstuvwx
 */
export class SessionManager {
  private activeSessions: Set<string> = new Set();

  /**
   * Generate a random session ID with the given prefix
   * @param prefix - Session prefix (e.g., 'qs_' for quotes, 'cs_' for charts)
   * @returns Random session ID
   */
  private generateSessionId(prefix: string): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let randomString = '';

    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters[randomIndex];
    }

    return prefix + randomString;
  }

  /**
   * Generate a quote session ID (qs_ prefix)
   * @returns Quote session ID
   */
  public generateQuoteSession(): string {
    const sessionId = this.generateSessionId('qs_');
    this.activeSessions.add(sessionId);
    return sessionId;
  }

  /**
   * Generate a chart session ID (cs_ prefix)
   * @returns Chart session ID
   */
  public generateChartSession(): string {
    const sessionId = this.generateSessionId('cs_');
    this.activeSessions.add(sessionId);
    return sessionId;
  }

  /**
   * Generate a stream session ID (st_ prefix)
   * @returns Stream session ID
   */
  public generateStreamSession(): string {
    const sessionId = this.generateSessionId('st_');
    this.activeSessions.add(sessionId);
    return sessionId;
  }

  /**
   * Check if a session is active
   * @param sessionId - Session ID to check
   * @returns True if session is active
   */
  public isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  /**
   * Destroy a session
   * @param sessionId - Session ID to destroy
   */
  public destroySession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Destroy all active sessions
   */
  public destroyAllSessions(): void {
    this.activeSessions.clear();
  }

  /**
   * Get count of active sessions
   * @returns Number of active sessions
   */
  public getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Get all active session IDs
   * @returns Array of active session IDs
   */
  public getActiveSessions(): string[] {
    return Array.from(this.activeSessions);
  }
}

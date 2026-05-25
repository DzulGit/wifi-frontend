/**
 * Auth Cookie Utilities
 * Handles setting and clearing the auth token cookie for server-side middleware authentication
 */

const AUTH_COOKIE_NAME = 'authToken'
const COOKIE_EXPIRY_DAYS = 7

/**
 * Set authentication cookie (client-side)
 * Used after successful login to enable middleware authentication
 * @param token - JWT token from backend
 */
export function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') {
    // Silently fail on server-side (shouldn't be called there)
    return
  }

  const expiryDate = new Date()
  expiryDate.setTime(expiryDate.getTime() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  const expiryString = expiryDate.toUTCString()

  // Set cookie with SameSite=Strict for CSRF protection
  // Note: httpOnly cannot be set from client-side; set it in Set-Cookie header from backend
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; expires=${expiryString}; path=/; SameSite=Strict`
}

/**
 * Clear authentication cookie (client-side)
 * Used on logout to remove middleware authentication
 */
export function clearAuthCookie(): void {
  if (typeof document === 'undefined') {
    // Silently fail on server-side
    return
  }

  // Set expiry to past date to delete cookie
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
}

/**
 * Get auth cookie name (for middleware use)
 * @returns Cookie name used for auth token storage
 */
export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME
}

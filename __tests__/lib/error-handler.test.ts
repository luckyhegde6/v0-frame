import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export required functions', async () => {
    const module = await import('@/lib/error-handler')
    
    expect(typeof module.logError).toBe('function')
    expect(typeof module.logCritical).toBe('function')
    expect(typeof module.logWarning).toBe('function')
    expect(typeof module.logInfo).toBe('function')
    expect(typeof module.handleApiError).toBe('function')
    expect(typeof module.handleCriticalError).toBe('function')
    expect(typeof module.showSuccess).toBe('function')
    expect(typeof module.showNonBlockingError).toBe('function')
  })

  it('should have getErrorLogs and clearErrorLogs functions', async () => {
    const module = await import('@/lib/error-handler')
    
    expect(typeof module.getErrorLogs).toBe('function')
    expect(typeof module.clearErrorLogs).toBe('function')
  })
})

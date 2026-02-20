'use client'

import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info'

interface ErrorLog {
  message: string
  severity: ErrorSeverity
  context?: string
  timestamp: Date
  stack?: string
}

const errorLogs: ErrorLog[] = []

export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs]
}

export function clearErrorLogs(): void {
  errorLogs.length = 0
}

function addToErrorLog(
  message: string,
  severity: ErrorSeverity,
  context?: string,
  stack?: string
): void {
  const entry: ErrorLog = {
    message,
    severity,
    context,
    timestamp: new Date(),
    stack,
  }
  errorLogs.push(entry)

  if (errorLogs.length > 100) {
    errorLogs.shift()
  }
}

export function logError(
  message: string,
  context?: string,
  error?: Error
): void {
  console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error)
  addToErrorLog(message, 'error', context, error?.stack)
}

export function logCritical(
  message: string,
  context?: string,
  error?: Error
): void {
  console.error(`[CRITICAL] ${context ? `[${context}] ` : ''}${message}`, error)
  addToErrorLog(message, 'critical', context, error?.stack)
}

export function logWarning(
  message: string,
  context?: string
): void {
  console.warn(`[WARNING] ${context ? `[${context}] ` : ''}${message}`)
  addToErrorLog(message, 'warning', context)
}

export function logInfo(
  message: string,
  context?: string
): void {
  console.log(`[INFO] ${context ? `[${context}] ` : ''}${message}`)
  addToErrorLog(message, 'info', context)
}

export function handleApiError(
  error: unknown,
  context?: string,
  showToUser: boolean = true
): string {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  const fullContext = context ? `${context}: ${message}` : message

  if (showToUser) {
    toast.error(fullContext, {
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      duration: 5000,
    })
  }

  logError(message, context, error instanceof Error ? error : undefined)
  return message
}

export function handleCriticalError(
  error: unknown,
  context?: string
): string {
  const message = error instanceof Error ? error.message : 'A critical error occurred'
  const fullContext = context ? `${context}: ${message}` : message

  toast.error(fullContext, {
    icon: <AlertCircle className="w-5 h-5 text-destructive" />,
    duration: 10000,
  })

  logCritical(message, context, error instanceof Error ? error : undefined)
  return message
}

export function showSuccess(message: string): void {
  toast.success(message, {
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    duration: 3000,
  })
}

export function showInfo(message: string): void {
  toast.info(message, {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    duration: 4000,
  })
}

export function showWarning(message: string): void {
  toast.warning(message, {
    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    duration: 5000,
  })
}

export function showNonBlockingError(message: string, context?: string): void {
  toast.error(message, {
    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    duration: 6000,
  })

  logWarning(message, context)
}

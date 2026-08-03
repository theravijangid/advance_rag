import { config } from 'dotenv'

config()

export function getRequiredEnvVar(envVarName: string): string {
  const value = process.env[envVarName]
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${envVarName}`)
  }
  return value
}

export function getOptionalEnvVar(envVarName: string, defaultValue: string): string {
  return process.env[envVarName] || defaultValue
}

export function getRequiredNumericEnvVar(envVarName: string): number {
  const value = getRequiredEnvVar(envVarName)
  const numericValue = Number(value)
  if (isNaN(numericValue)) {
    throw new Error(`Environment variable ${envVarName} must be a valid number`)
  }
  return numericValue
}

export function getBooleanEnvVar(envVarName: string): boolean {
  const value = process.env[envVarName]
  return ['1', 'true', 'yes', 'on'].includes(value?.toLowerCase() || '')
}

export function validateEnv(requiredVars: string[]): void {
  const missingVars = requiredVars.filter((varName) => !(varName in process.env))
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

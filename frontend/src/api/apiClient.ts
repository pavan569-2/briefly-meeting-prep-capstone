import { supabase } from '../lib/supabaseClient'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.')
    this.name = 'SessionExpiredError'
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function executeRequest(endpoint: string, options: RequestInit): Promise<Response> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, options)
  return response
}

export async function apiClient(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders()
  
  const reqHeaders: Record<string, string> = {}
  
  // Merge auth headers safely
  if (headers) {
    const authHeaders = new Headers(headers)
    authHeaders.forEach((value, key) => {
      reqHeaders[key] = value
    })
  }
  
  // Convert any user-provided headers to a Record so we can merge them easily
  if (options.headers) {
    const userHeaders = new Headers(options.headers)
    userHeaders.forEach((value, key) => {
      reqHeaders[key] = value
    })
  }

  // Do not send Content-Type for GET/DELETE without a body
  if (options.body && !Object.keys(reqHeaders).some(k => k.toLowerCase() === 'content-type')) {
    reqHeaders['Content-Type'] = 'application/json'
  }
  
  const initialOptions: RequestInit = {
    ...options,
    headers: reqHeaders,
  }

  let response = await executeRequest(endpoint, initialOptions)

  // 1. Check for 401 and attempt exactly one refresh
  if (response.status === 401) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError || !refreshData.session) {
      throw new SessionExpiredError()
    }
    
    // Retry once with the new token
    const newHeaders = {
      ...initialOptions.headers,
      'Authorization': `Bearer ${refreshData.session.access_token}`
    }
    
    response = await executeRequest(endpoint, {
      ...initialOptions,
      headers: newHeaders,
    })
    
    // If it still fails with 401, throw the expired error
    if (response.status === 401) {
      throw new SessionExpiredError()
    }
  }

  // 2. Safe error parsing
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.'
    try {
      const errorData = await response.clone().json()
      if (errorData && typeof errorData.error === 'string') {
        errorMessage = errorData.error
      }
    } catch {
      // Body wasn't JSON, rely on fallback message
    }

    if (response.status === 400) throw new ApiError(400, errorMessage || 'Invalid request')
    if (response.status === 404) throw new ApiError(404, errorMessage || 'Not found')
    if (response.status === 429) throw new ApiError(429, errorMessage || 'Too many requests. Please try again later.')
    throw new ApiError(response.status, errorMessage)
  }

  return response
}

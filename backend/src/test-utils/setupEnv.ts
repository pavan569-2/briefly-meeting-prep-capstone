/**
 * Must be the very first import in every test file, before any production module.
 * Sets fake env vars so env.ts validation passes without real credentials.
 * Values are clearly synthetic and cannot reach any real external service.
 */
process.env.ANTHROPIC_API_KEY         = 'test-anthropic-key'
process.env.ANTHROPIC_MODEL           = 'claude-test-model'
process.env.SUPABASE_URL              = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.FRONTEND_URL              = 'http://localhost:5173'
process.env.PORT                      = '3001'

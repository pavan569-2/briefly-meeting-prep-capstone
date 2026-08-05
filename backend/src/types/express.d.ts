// Augments the Express Request interface to include the authenticated user
// attached by requireAuth middleware. Using express-serve-static-core because
// that is where Express's base Request type is declared.
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string
      email: string
    }
  }
}

export {}

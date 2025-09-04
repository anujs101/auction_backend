import { env } from './environment';

export const securityConfig = {
  // Rate limiting configuration
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: env.NODE_ENV === 'production' ? 100 : 200, // requests per window
      message: 'Too many requests from this IP, please try again later'
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: env.NODE_ENV === 'production' ? 10 : 50, // auth attempts per window
      message: 'Too many authentication attempts, please try again later'
    },
    bid: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: env.NODE_ENV === 'production' ? 10 : 20, // bids per window
      message: 'Too many bid attempts, please wait before placing another bid'
    },
    supply: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: env.NODE_ENV === 'production' ? 10 : 20, // supply offers per window
      message: 'Too many supply offers, please wait before placing another offer'
    }
  },

  // CORS configuration
  cors: {
    origin: env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || false
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Helmet security headers
  helmet: {
    frameguard: { action: 'deny' as const },
    contentSecurityPolicy: env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    } : false,
    hsts: env.NODE_ENV === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false
  },

  // JWT configuration
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: '24h',
    algorithm: 'HS256' as const
  },

  // Request validation
  validation: {
    maxRequestSize: '10mb',
    strictJson: true
  }
};

// Security configuration for the COCOON platform

export const securityConfig = {
  // Rate limiting configuration
  rateLimit: {
    // General rate limit for all routes
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === "development" ? 1000 : 500, // Increased for production
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    },
    
    // Rate limit for authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === "development" ? 100 : 50, // Increased for production
      message: "Too many authentication attempts, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    },
    
    // Rate limit for link code endpoints
    linkCode: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === "development" ? 50 : 20, // Increased for production
      message: "Too many link code attempts, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    },
  },
  
  // Helmet configuration
  helmet: {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // Other helmet options
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  },
  
  // CORS configuration - Emergency fix for production
  cors: {
    origin: true, // Allow all origins temporarily for debugging
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  },
  
  // Input validation configuration
  validation: {
    // Password requirements
    password: {
      minLength: 6,
      requireLetter: true,
      requireNumber: true,
    },
    
    // Email validation
    email: {
      normalize: true,
    },
    
    // Name validation
    name: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s]+$/,
    },
    
    // Room name validation
    roomName: {
      minLength: 3,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_()]+$/,
    },
    
    // Link code validation
    linkCode: {
      length: 6,
      pattern: /^[0-9]+$/,
    },
    
    // Invite code validation
    inviteCode: {
      length: 6,
      pattern: /^[A-Z0-9]+$/,
    },
  },
  
  // Session and cookie configuration
  session: {
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
    },
  },
  
  // Request size limits
  requestLimits: {
    json: "10mb",
    urlencoded: "10mb",
  },
  
  // Development settings
  development: {
    disableRateLimit: process.env.DISABLE_RATE_LIMIT === "true",
    disableHelmet: process.env.DISABLE_HELMET === "true",
  },
};

// Export individual configurations for easy import
export const { rateLimit, helmet, cors, validation, session, requestLimits, development } = securityConfig;

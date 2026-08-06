import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again after 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many file uploads, please try again after a minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const { z } = require('zod');
const { createError } = require('./errorHandler');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(createError(422, 'Validation failed', details));
    }
    req.validated = result.data;
    next();
  };
}

const schemas = {
  register: z.object({
    body: z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(8).max(72),
    }),
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8).max(72),
    }),
  }),
  oauthExchange: z.object({
    body: z.object({
      // base64url of 32 random bytes is 43 chars; allow some slack.
      code: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/, 'Malformed sign-in code'),
    }),
  }),
  createApiKey: z.object({
    body: z.object({
      name: z.string().min(1).max(100),
    }),
  }),
};

module.exports = { validate, schemas };

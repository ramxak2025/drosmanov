import * as Joi from 'joi';

export const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('30d'),
  SMS_RU_API_ID: Joi.string().required(),
  VAPID_PUBLIC_KEY: Joi.string().default(''),
  VAPID_PRIVATE_KEY: Joi.string().default(''),
  VAPID_SUBJECT: Joi.string().default(''),
  TELEGRAM_BOT_TOKEN: Joi.string().default(''),
  UPLOAD_DIR: Joi.string().default('/app/uploads'),
  MAX_FILE_SIZE_MB: Joi.number().default(20),
});

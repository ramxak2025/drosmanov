/** Допустимые MIME-типы для загрузки */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/** Максимальный размер файла в байтах (20 МБ) */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Максимальное разрешение изображения */
export const MAX_IMAGE_DIMENSION = 1920;

/** Качество WebP при конвертации */
export const WEBP_QUALITY = 85;

/** TTL access token в секундах (15 минут) */
export const ACCESS_TOKEN_TTL = 15 * 60;

/** TTL refresh token в днях */
export const REFRESH_TOKEN_TTL_DAYS = 30;

/** TTL OTP кода в минутах */
export const OTP_TTL_MINUTES = 10;

/** Максимум OTP-кодов на номер в час */
export const OTP_MAX_PER_HOUR = 3;

/** Максимум попыток проверки одного OTP */
export const OTP_MAX_ATTEMPTS = 3;

/** Длина OTP кода */
export const OTP_LENGTH = 4;

/** Формат телефона */
export const PHONE_REGEX = /^\+7\d{10}$/;

/** Категории услуг */
export const SERVICE_CATEGORIES = [
  'Терапия',
  'Хирургия',
  'Гигиена',
  'Ортодонтия',
  'Имплантация',
  'Эстетика',
] as const;

/** Статусы зубов для карты */
export const TOOTH_STATUSES = [
  'healthy',
  'filled',
  'extracted',
  'crown',
  'implant',
  'caries',
] as const;

/** Номера зубов (FDI нотация) */
export const TOOTH_NUMBERS = [
  // Верхняя челюсть, правая сторона
  '18', '17', '16', '15', '14', '13', '12', '11',
  // Верхняя челюсть, левая сторона
  '21', '22', '23', '24', '25', '26', '27', '28',
  // Нижняя челюсть, левая сторона
  '31', '32', '33', '34', '35', '36', '37', '38',
  // Нижняя челюсть, правая сторона
  '41', '42', '43', '44', '45', '46', '47', '48',
] as const;

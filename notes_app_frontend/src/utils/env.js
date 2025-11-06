export const getEnv = (key, fallback = undefined) => {
  const value = process.env[key];
  if (typeof value === 'undefined' || value === '') {
    return fallback;
  }
  return value;
};

// PUBLIC_INTERFACE
export function requireEnv(keys = []) {
  /** Ensures required environment variables are present for runtime hints. */
  const missing = [];
  keys.forEach((k) => {
    if (!process.env[k]) missing.push(k);
  });
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `Missing required environment variables: ${missing.join(
        ', '
      )}. Please set them in your .env file.`
    );
  }
  return missing.length === 0;
}

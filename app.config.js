const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const raw = fs.readFileSync(filePath, 'utf8');

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    env[key] = rest.join('=').trim();
  });

  return env;
}

const envPath = path.resolve(__dirname, '.env');
const env = parseEnvFile(envPath);
const apiUrl = env.EXPO_PUBLIC_API_BASE_URL;

if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required in .env');
}

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...((appJson.expo && appJson.expo.extra) || {}),
      EXPO_PUBLIC_API_BASE_URL: apiUrl
    }
  }
};

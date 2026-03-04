import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:3000';

const getMetroHost = (): string | null => {
  try {
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    if (!scriptURL) {
      return null;
    }

    const parsed = new URL(scriptURL);
    return parsed.hostname || null;
  } catch {
    return null;
  }
};

const normalizeApiUrl = (apiUrl: string): string => {
  if (!apiUrl) {
    return DEFAULT_API_URL;
  }

  // Remove trailing slash only
  return apiUrl.replace(/\/$/, '');
};

const resolveLocalhostForMobile = (apiUrl: string): string => {
  const isLocalhost = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiUrl);
  if (!isLocalhost || Platform.OS === 'web') {
    return apiUrl;
  }

  if (Platform.OS === 'android') {
    return apiUrl.replace(/localhost|127\.0\.0\.1/i, '10.0.2.2');
  }

  const metroHost = getMetroHost();
  if (!metroHost || metroHost === 'localhost' || metroHost === '127.0.0.1') {
    return apiUrl;
  }

  return apiUrl.replace(/localhost|127\.0\.0\.1/i, metroHost);
};

export const getApiUrl = (): string => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
  const normalized = normalizeApiUrl(configuredUrl);

  if (!__DEV__) {
    return normalized;
  }

  return resolveLocalhostForMobile(normalized);
};

export const getApiBaseUrl = (): string => getApiUrl().replace(/\/api$/, '');

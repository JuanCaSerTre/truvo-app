import { Linking, Platform } from 'react-native';

/** Best-effort open of the device's default mail app. Falls back gracefully across platforms. */
export const openMailApp = async () => {
  const candidates = Platform.select({
    ios: ['message://', 'mailto:'],
    android: ['mailto:'],
    default: ['mailto:'],
  }) as string[];

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      // try the next candidate
    }
  }

  try {
    await Linking.openURL('mailto:');
    return true;
  } catch {
    return false;
  }
};

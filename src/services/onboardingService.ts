import AsyncStorage from '@react-native-async-storage/async-storage';

const onboardingKey = (userId: string) => `truvo:onboardingComplete:${userId}`;

export const onboardingService = {
  async hasCompleted(userId: string): Promise<boolean> {
    return AsyncStorage.getItem(onboardingKey(userId)).then((value) => value === 'true');
  },

  async markCompleted(userId: string): Promise<void> {
    await AsyncStorage.setItem(onboardingKey(userId), 'true');
  },
};

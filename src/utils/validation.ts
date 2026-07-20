const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const isValidEmail = (value: string) => emailPattern.test(normalizeEmail(value));

export interface PasswordRule {
  key: string;
  label: string;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { key: 'length', label: '8 characters', test: (v) => v.length >= 8 },
  { key: 'uppercase', label: 'Uppercase', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', label: 'Number', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'Special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const passwordScore = (value: string) => passwordRules.filter((rule) => rule.test(value)).length;

export const isStrongPassword = (value: string) => passwordScore(value) === passwordRules.length;

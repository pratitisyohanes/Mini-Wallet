import { PASSWORD_MIN_LENGTH } from '../config/constants.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;
const PHONE_PATTERN = /^(\+62|62|0)8[1-9]\d{6,11}$/;

export function getEmailError(email) {
  if (!email.trim()) return 'Email wajib diisi.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Format email tidak valid.';
  return null;
}

export function getPasswordError(password) {
  if (!password) return 'Password wajib diisi.';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  }
  return null;
}

export function getUsernameError(username) {
  if (!username.trim()) return 'Username wajib diisi.';
  if (!USERNAME_PATTERN.test(username.trim())) {
    return 'Username 3-30 karakter, hanya huruf, angka, dan underscore.';
  }
  return null;
}

export function getPhoneError(phone) {
  if (!phone.trim()) return 'Nomor HP wajib diisi.';
  if (!PHONE_PATTERN.test(phone.trim())) return 'Format nomor HP tidak valid. Contoh: 081234567890.';
  return null;
}

export function getRecipientError(recipient) {
  const value = recipient.trim();
  if (!value) return 'Email atau nomor HP penerima wajib diisi.';
  if (value.includes('@')) return getEmailError(value);
  if (!PHONE_PATTERN.test(value)) return 'Masukkan email atau nomor HP yang valid.';
  return null;
}

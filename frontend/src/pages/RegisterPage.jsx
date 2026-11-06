import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseApiError } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import TextField from '../components/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSubmitAction } from '../hooks/useSubmitAction.js';
import {
  getEmailError,
  getPasswordError,
  getPhoneError,
  getUsernameError,
} from '../validators/auth.js';

const INITIAL_VALUES = { username: '', email: '', phone: '', password: '' };

export default function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const clientErrors = {
    username: getUsernameError(values.username),
    email: getEmailError(values.email),
    phone: getPhoneError(values.phone),
    password: getPasswordError(values.password),
  };
  const isFormValid = Object.values(clientErrors).every((error) => !error);

  const visibleError = (field) =>
    serverFieldErrors[field] ?? (touched[field] ? clientErrors[field] : null);

  const { run: submitRegistration, isSubmitting } = useSubmitAction(async () => {
    setErrorMessage('');
    setServerFieldErrors({});
    try {
      const payload = {
        username: values.username.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      };
      await register(payload);
      await login({ email: payload.email, password: payload.password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setServerFieldErrors(fieldErrors);
      setErrorMessage(message);
    }
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setServerFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleBlur(event) {
    setTouched((current) => ({ ...current, [event.target.name]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTouched({ username: true, email: true, phone: true, password: true });
    if (isFormValid) submitRegistration();
  }

  return (
    <AuthLayout
      title="Buat akun baru"
      subtitle="Wallet Anda dibuat otomatis dengan saldo Rp0."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Alert>{errorMessage}</Alert>
        <TextField
          id="username"
          label="Username"
          autoComplete="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={visibleError('username')}
        />
        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={visibleError('email')}
        />
        <TextField
          id="phone"
          type="tel"
          label="Nomor HP"
          autoComplete="tel"
          placeholder="081234567890"
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={visibleError('phone')}
        />
        <TextField
          id="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={visibleError('password')}
          hint="Minimal 8 karakter."
        />
        <SubmitButton isSubmitting={isSubmitting} disabled={!isFormValid} loadingText="Mendaftar...">
          Daftar
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}

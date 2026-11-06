import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseApiError } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import TextField from '../components/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSubmitAction } from '../hooks/useSubmitAction.js';
import { getEmailError } from '../validators/auth.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const errors = {
    email: getEmailError(values.email),
    password: values.password ? null : 'Password wajib diisi.',
  };
  const isFormValid = !errors.email && !errors.password;

  const { run: submitLogin, isSubmitting } = useSubmitAction(async () => {
    setErrorMessage('');
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(parseApiError(error).message);
    }
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleBlur(event) {
    setTouched((current) => ({ ...current, [event.target.name]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (isFormValid) submitLogin();
  }

  return (
    <AuthLayout
      title="Masuk ke akun Anda"
      subtitle="Kelola saldo, top up, dan transfer dalam satu tempat."
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Daftar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Alert>{errorMessage}</Alert>
        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email ? errors.email : null}
        />
        <TextField
          id="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password ? errors.password : null}
        />
        <SubmitButton isSubmitting={isSubmitting} disabled={!isFormValid} loadingText="Masuk...">
          Masuk
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}

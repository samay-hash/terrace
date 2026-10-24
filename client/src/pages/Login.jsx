import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { safeNext } from "../lib/navigation.js";
import { AuthLayout } from "../components/auth/AuthLayout.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PasswordInput, TextInput } from "../components/ui/Field.jsx";
import { Notice } from "../components/ui/Feedback.jsx";
import styles from "../components/auth/AuthForm.module.css";

export default function Login() {
  useDocumentTitle("Sign in");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={next} replace />;

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((x) => ({ ...x, [field]: undefined }));
  };

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) found.email = "Enter the email you signed up with.";
    if (!values.password) found.password = "Enter your password.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const { user: signedIn } = await login({ email: values.email.trim(), password: values.password });
      navigate(signedIn.role === "admin" && next === "/" ? "/admin" : next, { replace: true });
    } catch (error) {
      setSubmitting(false);
      setErrors(error.fields);
      setFormError(error.message);
    }
  }

  return (
    <AuthLayout
      heading="Welcome back."
      subheading="Sign in to check out faster, follow your deliveries and keep your bag on every device."
      quote="Oh, you're back. Your bag missed you. I didn't."
    >
      <div className={styles.head}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.sub}>Use the email and password for your Terrace account.</p>
      </div>
      <form className={styles.fields} onSubmit={onSubmit} noValidate>
        {formError && <Notice tone="error">{formError}</Notice>}
        <TextInput label="Email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} autoFocus />
        <PasswordInput label="Password" autoComplete="current-password" value={values.password} onChange={set("password")} error={errors.password} />
        <Button type="submit" size="lg" block loading={submitting} className={styles.submit}>
          Sign in
        </Button>
      </form>
      <p className={styles.switch}>
        New to Terrace? <Link to={`/signup${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
      </p>
      <Link to="/" className={styles.back}>
        Back to the store
      </Link>
    </AuthLayout>
  );
}

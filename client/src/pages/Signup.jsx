import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { AuthLayout } from "../components/auth/AuthLayout.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PasswordInput, TextInput } from "../components/ui/Field.jsx";
import { Notice } from "../components/ui/Feedback.jsx";
import { safeNext } from "../lib/navigation.js";
import styles from "../components/auth/AuthForm.module.css";

// Same rules the API enforces; checked here first for instant feedback.
const RULES = [
  { id: "length", label: "8+ characters", test: (p) => p.length >= 8 },
  { id: "letter", label: "A letter", test: (p) => /[A-Za-z]/.test(p) },
  { id: "number", label: "A number", test: (p) => /\d/.test(p) },
];

export default function Signup() {
  useDocumentTitle("Create an account");
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [values, setValues] = useState({ name: "", email: "", password: "" });
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
    if (values.name.trim().length < 2) found.name = "Enter your name (at least 2 characters).";
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) found.email = "Enter a valid email address.";
    const failed = RULES.find((r) => !r.test(values.password));
    if (failed) found.password = `Password needs ${failed.label.toLowerCase()}.`;
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      toast.success("Account created. Welcome to Terrace.");
      navigate(next, { replace: true });
    } catch (error) {
      setSubmitting(false);
      setErrors(error.fields);
      if (!Object.keys(error.fields).length) setFormError(error.message);
    }
  }

  return (
    <AuthLayout
      heading="Good gear starts with an account."
      subheading="An account keeps your bag on every device, speeds up checkout and lets you follow each order to your door."
    >
      <div className={styles.head}>
        <h1 className={`display ${styles.title}`}>Create your account</h1>
        <p className={styles.sub}>Takes under a minute. No card needed.</p>
      </div>
      <form className={styles.fields} onSubmit={onSubmit} noValidate>
        {formError && <Notice tone="error">{formError}</Notice>}
        <TextInput label="Name" autoComplete="name" value={values.name} onChange={set("name")} error={errors.name} autoFocus />
        <TextInput label="Email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} />
        <PasswordInput label="Password" autoComplete="new-password" value={values.password} onChange={set("password")} error={errors.password} />
        <ul className={styles.rules} aria-label="Password requirements">
          {RULES.map((rule) => (
            <li key={rule.id} data-ok={rule.test(values.password) ? "" : undefined}>
              {rule.label}
            </li>
          ))}
        </ul>
        <Button type="submit" size="lg" block loading={submitting} className={styles.submit}>
          Create account
        </Button>
      </form>
      <p className={styles.legal}>
        By creating an account you agree to our terms of sale and <Link to="/help">returns policy</Link>.
      </p>
    </AuthLayout>
  );
}

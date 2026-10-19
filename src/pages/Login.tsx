import { useState } from "react";
import { Alert, Button, Divider, Form, Input } from "antd";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthCard from "../components/auth/AuthCard";
import GoogleButton from "../components/auth/GoogleButton";
import { authErrorMessage, signInWithEmail } from "../database/auth";
import { isFirebaseConfigured } from "../database/firebase";
import { useAppSelector } from "../store/hooks";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status } = useAppSelector((state) => state.auth);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Where RequireAuth bounced the user from, if anywhere.
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (status === "ready" && user) {
    return <Navigate to={user.emailVerified ? from : "/verify-email"} replace />;
  }

  const submit = async (values: { email: string; password: string }) => {
    setBusy(true);
    setError(null);
    try {
      const signedIn = await signInWithEmail(values.email.trim(), values.password);
      navigate(signedIn.emailVerified ? from : "/verify-email", { replace: true });
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to open your resumes."
      footer={
        <>
          New to CapitalCV? <Link to="/signup" state={{ from }}>Create an account</Link>
        </>
      }
    >
      <GoogleButton from={from} />
      <Divider plain>or sign in with email</Divider>

      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} role="alert" />}

      <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={!isFirebaseConfigured}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Enter your email address." },
            { type: "email", message: "That email address does not look right." },
          ]}
        >
          <Input size="large" type="email" autoComplete="email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Enter your password." }]}
          extra={<Link to="/forgot-password">Forgot your password?</Link>}
        >
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <Button block size="large" type="primary" htmlType="submit" loading={busy}>
          Sign in
        </Button>
      </Form>
    </AuthCard>
  );
}

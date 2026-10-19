import { useState } from "react";
import { Alert, Button, Checkbox, Divider, Form, Input } from "antd";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthCard from "../components/auth/AuthCard";
import GoogleButton from "../components/auth/GoogleButton";
import { authErrorMessage, signUpWithEmail } from "../database/auth";
import { isFirebaseConfigured } from "../database/firebase";
import { useAppSelector } from "../store/hooks";

interface Values {
  name: string;
  email: string;
  password: string;
  confirm: string;
  agree: boolean;
}

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status } = useAppSelector((state) => state.auth);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (status === "ready" && user && !busy) {
    return <Navigate to={user.emailVerified ? from : "/verify-email"} replace />;
  }

  const submit = async (values: Values) => {
    setBusy(true);
    setError(null);
    try {
      await signUpWithEmail(values.name.trim(), values.email.trim(), values.password);
      navigate("/verify-email", { replace: true });
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Build, save and download your resume — free."
      footer={
        <>
          Already have an account? <Link to="/login" state={{ from }}>Sign in</Link>
        </>
      }
    >
      <GoogleButton from={from} label="Sign up with Google" />
      <Divider plain>or sign up with email</Divider>

      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} role="alert" />}

      <Form<Values> layout="vertical" onFinish={submit} requiredMark={false} disabled={!isFirebaseConfigured}>
        <Form.Item
          label="Full name"
          name="name"
          rules={[{ required: true, whitespace: true, message: "Enter your name." }]}
        >
          <Input size="large" autoComplete="name" maxLength={80} />
        </Form.Item>
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
          extra="At least 8 characters, with a letter and a number."
          rules={[
            { required: true, message: "Choose a password." },
            { min: 8, message: "Use at least 8 characters." },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
              message: "Include at least one letter and one number.",
            },
          ]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Confirm password"
          name="confirm"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Confirm your password." },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue("password") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("The passwords do not match.")),
            }),
          ]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error("Please accept the terms to continue.")),
            },
          ]}
        >
          <Checkbox>
            I agree to the <Link to="/terms" target="_blank">Terms</Link> and{" "}
            <Link to="/privacy" target="_blank">Privacy Policy</Link>.
          </Checkbox>
        </Form.Item>
        <Button block size="large" type="primary" htmlType="submit" loading={busy}>
          Create account
        </Button>
      </Form>
    </AuthCard>
  );
}

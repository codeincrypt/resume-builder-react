import { useState } from "react";
import { Alert, Button, Form, Input, Result } from "antd";
import { FirebaseError } from "firebase/app";
import { Link } from "react-router-dom";

import AuthCard from "../components/auth/AuthCard";
import { authErrorMessage, sendResetEmail } from "../database/auth";
import { isFirebaseConfigured } from "../database/firebase";

export default function ForgotPassword() {
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async ({ email }: { email: string }) => {
    setBusy(true);
    setError(null);
    try {
      await sendResetEmail(email.trim());
      setSentTo(email.trim());
    } catch (e) {
      // Say the same thing whether or not the address has an account, so this
      // form cannot be used to discover who is registered.
      if (e instanceof FirebaseError && e.code === "auth/user-not-found") {
        setSentTo(email.trim());
      } else {
        setError(authErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCard title="Check your email">
        <Result
          status="success"
          subTitle={`If an account exists for ${sentTo}, we've sent a link to reset the password. It may take a minute to arrive — check spam too.`}
          extra={<Link to="/login">Back to sign in</Link>}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={<Link to="/login">Back to sign in</Link>}
    >
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
        <Button block size="large" type="primary" htmlType="submit" loading={busy}>
          Send reset link
        </Button>
      </Form>
    </AuthCard>
  );
}

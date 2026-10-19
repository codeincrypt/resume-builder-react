import { useEffect, useState } from "react";
import { Alert, App, Button, Space } from "antd";
import { Navigate, useNavigate } from "react-router-dom";

import AuthCard from "../components/auth/AuthCard";
import {
  authErrorMessage,
  logOut,
  refreshUser,
  resendVerification,
} from "../database/auth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setUser } from "../store/slices/authSlice";

const COOLDOWN_SECONDS = 45;

export default function VerifyEmail() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user, status } = useAppSelector((state) => state.auth);

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);

  // Firebase does not announce when the link was clicked in another tab, so
  // look again every few seconds and move on automatically.
  useEffect(() => {
    if (!user || user.emailVerified) return;
    const timer = setInterval(async () => {
      try {
        const fresh = await refreshUser();
        if (fresh?.emailVerified) dispatch(setUser(fresh));
      } catch {
        // Transient; the next tick or the button will retry.
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [user, dispatch]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (status === "initializing") return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerified) return <Navigate to="/dashboard" replace />;

  const resend = async () => {
    setSending(true);
    try {
      await resendVerification();
      message.success("Verification email sent.");
      setCooldown(COOLDOWN_SECONDS);
    } catch (error) {
      message.error(authErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const check = async () => {
    setChecking(true);
    setNotYet(false);
    try {
      const fresh = await refreshUser();
      if (fresh?.emailVerified) {
        dispatch(setUser(fresh));
        navigate("/dashboard", { replace: true });
      } else {
        setNotYet(true);
      }
    } catch (error) {
      message.error(authErrorMessage(error));
    } finally {
      setChecking(false);
    }
  };

  const switchAccount = async () => {
    await logOut();
    navigate("/login", { replace: true });
  };

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        <>
          We sent a verification link to <strong>{user.email}</strong>. Open it, then come
          back here — this page continues on its own.
        </>
      }
    >
      {notYet && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Not verified yet."
          description="Click the link in the email first. It can take a minute to arrive — check your spam folder too."
          role="status"
        />
      )}
      <Space orientation="vertical" style={{ width: "100%" }} size={12}>
        <Button block size="large" type="primary" loading={checking} onClick={check}>
          I've verified my email
        </Button>
        <Button block size="large" loading={sending} disabled={cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend verification email"}
        </Button>
        <Button block type="link" onClick={switchAccount}>
          Use a different account
        </Button>
      </Space>
    </AuthCard>
  );
}

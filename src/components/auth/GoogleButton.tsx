import { useState } from "react";
import { GoogleOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { useNavigate } from "react-router-dom";

import { authErrorMessage, signInWithGoogle } from "../../database/auth";
import { isFirebaseConfigured } from "../../database/firebase";

export default function GoogleButton({
  from,
  label = "Continue with Google",
}: {
  from: string;
  label?: string;
}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const click = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
      const text = authErrorMessage(error);
      // Closing the popup is a choice, not a failure worth shouting about.
      if (!/cancelled/i.test(text)) message.error(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      block
      size="large"
      icon={<GoogleOutlined />}
      loading={busy}
      disabled={!isFirebaseConfigured}
      onClick={click}
    >
      {label}
    </Button>
  );
}

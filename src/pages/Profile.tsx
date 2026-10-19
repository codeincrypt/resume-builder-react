import { useState } from "react";
import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Form, Input, Modal, Space } from "antd";
import { Link, useNavigate } from "react-router-dom";

import {
  authErrorMessage,
  changePassword,
  deleteAuthAccount,
  isRecentLoginError,
  reauthenticate,
  updateDisplayName,
} from "../database/auth";
import { deleteAllUserData, listResumes } from "../database/request";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setUser } from "../store/slices/authSlice";

export default function Profile() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAppSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;
  const isPassword = user.provider === "password";

  const saveName = async () => {
    setSavingName(true);
    try {
      dispatch(setUser(await updateDisplayName(name.trim())));
      message.success("Name updated.");
    } catch (error) {
      message.error(authErrorMessage(error));
    } finally {
      setSavingName(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const resumes = await listResumes(user.uid);
      const payload = {
        exportedAt: new Date().toISOString(),
        account: { email: user.email, displayName: user.displayName },
        resumes,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "capitalcv-data.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      message.error((error as Error).message || "Couldn't export your data.");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // Fresh sign-in first: Firebase refuses to delete an account otherwise,
      // and we must not remove the data and then fail to remove the account.
      await reauthenticate(isPassword ? deletePassword : undefined);
      await deleteAllUserData(user.uid);
      await deleteAuthAccount();
      message.success("Your account and data have been deleted.");
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteError(
        isRecentLoginError(error)
          ? "For your security, sign in again and retry."
          : authErrorMessage(error),
      );
      setDeleting(false);
    }
  };

  return (
    <div className="profile">
      <h1>Account &amp; privacy</h1>

      <Card title="Profile" className="profile__card">
        <Form layout="vertical" component={false}>
          <Form.Item label="Display name" htmlFor="profile-name">
            <Space.Compact style={{ width: "100%" }}>
              <Input id="profile-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
              <Button
                type="primary"
                loading={savingName}
                disabled={!name.trim() || name.trim() === user.displayName}
                onClick={saveName}
              >
                Save
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="Email" htmlFor="profile-email">
            <Input id="profile-email" value={user.email} readOnly />
          </Form.Item>
          <p className="muted">
            Signed in with {isPassword ? "email and password" : "Google"}.
          </p>
        </Form>
      </Card>

      {isPassword && <PasswordCard />}

      <Card title="Your data" className="profile__card">
        <p>
          Your resumes (and any original files you chose to keep) belong to you. Only you can read
          them. Read how we handle them in the <Link to="/privacy">privacy policy</Link>.
        </p>
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={exportData}>
          Download all my data (JSON)
        </Button>
      </Card>

      <Card title="Delete account" className="profile__card profile__card--danger">
        <p>
          Permanently deletes your account, every resume and every uploaded file. This can't be
          undone.
        </p>
        <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteOpen(true)}>
          Delete my account…
        </Button>
      </Card>

      <Modal
        title="Delete your account?"
        open={deleteOpen}
        onCancel={() => !deleting && setDeleteOpen(false)}
        okText="Delete everything"
        okButtonProps={{ danger: true, disabled: confirmText !== "DELETE" || (isPassword && !deletePassword) }}
        confirmLoading={deleting}
        onOk={deleteAccount}
        destroyOnHidden
      >
        <p>
          This permanently deletes your account, all of your resumes and any uploaded files.
        </p>
        {deleteError && <Alert type="error" showIcon title={deleteError} style={{ marginBottom: 12 }} role="alert" />}
        <Form layout="vertical" component={false}>
          {isPassword ? (
            <Form.Item label="Your password" htmlFor="delete-password">
              <Input.Password
                id="delete-password"
                value={deletePassword}
                autoComplete="current-password"
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </Form.Item>
          ) : (
            <p className="muted">You'll be asked to sign in with Google again to confirm.</p>
          )}
          <Form.Item label={<>Type <strong>DELETE</strong> to confirm</>} htmlFor="delete-confirm">
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function PasswordCard() {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm<{ current: string; next: string; confirm: string }>();

  const submit = async (values: { current: string; next: string }) => {
    setBusy(true);
    try {
      await changePassword(values.current, values.next);
      message.success("Password changed.");
      form.resetFields();
    } catch (error) {
      message.error(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Change password" className="profile__card">
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <Form.Item label="Current password" name="current" rules={[{ required: true, message: "Enter your current password." }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          label="New password"
          name="next"
          rules={[
            { required: true, message: "Choose a new password." },
            { min: 8, message: "Use at least 8 characters." },
            { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: "Include at least one letter and one number." },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Confirm new password"
          name="confirm"
          dependencies={["next"]}
          rules={[
            { required: true, message: "Confirm the new password." },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue("next") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("The passwords do not match.")),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={busy}>
          Change password
        </Button>
      </Form>
    </Card>
  );
}

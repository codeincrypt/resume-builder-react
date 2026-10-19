import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="The page you're looking for doesn't exist or has moved."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Back to home
        </Button>
      }
    />
  );
}

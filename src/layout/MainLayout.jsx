import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { Row, Col } from "antd";

import Headers from "../components/Header";

const MainLayout = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <>
      <Headers />
      <div className="margin-top">
        <Row justify="center">
          <Col span={20}>{children}</Col>
        </Row>
      </div>
    </>
  );
};

export default MainLayout;

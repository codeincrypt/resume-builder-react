import { Col, Row } from "antd";
import React from "react";

const Login = () => {
  return (
    <div className="page-hiw">
      <Row justify="center">
        <Col span={20}>
          <Row justify="center">
            <Col span={12}>
              <h1 className="heading1 text-center">Log In</h1>
            </Col>
            <Col span={16} className="text-center">
              <p className="paragraph2">We are happy to see you back!</p>

              <a href="/auth/google_oauth2?" className="main-btn danger-btn">
                Google
              </a>
              <p className="paragraph2">I am not registered — Sign Up</p>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Login;

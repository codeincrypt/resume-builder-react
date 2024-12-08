import React from "react";
import { useNavigate } from "react-router-dom";

import { useGoogleLogin } from '@react-oauth/google';
import { Col, Row, Button } from "antd";
import { FaGoogle } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const googlelogin = () => {
    // navigate("/resume-template")
  }
  
  const login = useGoogleLogin({
    onSuccess: tokenResponse => console.log(tokenResponse),
    
  });

  
  return (
    <Row 
    justify="center" 
    align="middle" 
    style={{ minHeight: '100vh' }}
  >
    <Col span={24} style={{ textAlign: 'center' }}>
      <Row justify="center">
        <Col span={12}>
          <h1 className="heading1">Log In</h1>
        </Col>
        <Col span={16}>
          <p className="paragraph2">We are happy to see you back!</p>
          <Button danger size="large" type="primary" icon={<FaGoogle />} className="btn-large" onClick={() => login()}>
            Google
          </Button>
          <p className="paragraph2">I am not registered — Sign Up</p>
        </Col>
      </Row>
    </Col>
  </Row>
  );
};

export default Login;

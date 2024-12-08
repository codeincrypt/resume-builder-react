import React from "react";
import { Link } from "react-router-dom";

import { Layout, Menu, Button, Row, Col, Flex } from "antd";

const { Header } = Layout;

const Headers = () => {
  const logo =
    "https://res.cloudinary.com/dpevovkcg/image/upload/v1733678889/logo_kpeqxl.svg";
  return (
    <Layout>
      <Header className="nav__content">
        <Row justify="space-between" align="center" className="nav__bar">
          <img src={logo} alt="resume builder" style={{ height: "40px" }} />
          <Col span={12}>
            <Flex justify="flex-end">
              <Link className="menu-item" to="/">Home</Link>
              <Link className="menu-item" to="/about">About</Link>
              <Button className="menu-item" type="primary" size="large" href="/signup">
                Sign Up
              </Button>
            </Flex>
          </Col>
        </Row>
      </Header>
    </Layout>
  );
};

export default Headers;

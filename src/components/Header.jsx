import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Layout, Button, Row, Col, Avatar, Dropdown, Menu, Flex } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { googleLogout } from "@react-oauth/google";

import { logout } from "../store/slices/authSlice";
import { logo } from "./Constant";

const { Header } = Layout;

const Headers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const logOut = () => {
    googleLogout();
    dispatch(logout());
  };

  const menu = (
    <Menu>
      <Menu.Item key="1">
        <Link to="/">Resume</Link>
      </Menu.Item>
      <Menu.Item key="2">
        <Link to="/templates">Templates</Link>
      </Menu.Item>
      {user && (
        <Menu.Item key="3">
          <Link to="/profile">
            <Avatar src={user?.picture} /> {user?.name}
          </Link>
        </Menu.Item>
      )}
      {isAuthenticated ? (
        <Menu.Item key="4" onClick={logOut}>
          Logout
        </Menu.Item>
      ) : (
        <Menu.Item key="5" onClick={() => navigate("/login")}>
          Login
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <Layout>
      <Header className="nav__content">
        <Row justify="space-between" align="middle" className="nav__bar">
          {/* Logo Section */}
          <Col>
              <Link to="/">
            <Flex align="middle">
                <img
                  src={logo}
                  alt="resume builder"
                  style={{ height: "40px" }}
                />
            </Flex>
              </Link>
          </Col>

          {/* Desktop Navigation */}
          <Col xs={0} md={16}>
            <Row justify="end" align="middle" gutter={16}>
              <Col>
                <Link className="menu-item" to="/home">
                  Home
                </Link>
              </Col>
              <Col>
                <Link className="menu-item" to="/my-resume">
                  Resume
                </Link>
              </Col>
              <Col>
                <Link className="menu-item" to="/resume-template">
                  Templates
                </Link>
              </Col>
              {user && (
                <Col>
                  <Link className="menu-item" to="/profile">
                    <Avatar src={user?.picture} /> {user?.name}
                  </Link>
                </Col>
              )}
              <Col>
                {isAuthenticated ? (
                  <Button type="primary" size="large" onClick={logOut}>
                    Logout
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </Button>
                )}
              </Col>
            </Row>
          </Col>

          {/* Mobile Navigation */}
          <Col xs={24} md={0}>
            <Dropdown overlay={menu} trigger={["click"]}>
              <MenuOutlined style={{ fontSize: "24px", cursor: "pointer" }} />
            </Dropdown>
          </Col>
        </Row>
      </Header>
    </Layout>
  );
};

export default Headers;

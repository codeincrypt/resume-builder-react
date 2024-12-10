import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Layout, Button, Row, Col, Flex } from "antd";
import { googleLogout } from "@react-oauth/google";

import { logout } from "../store/slices/authSlice";

const { Header } = Layout;

const Headers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const logo =
    "https://res.cloudinary.com/dpevovkcg/image/upload/v1733678889/logo_kpeqxl.svg";

  const logOut = () => {
    googleLogout();
    dispatch(logout());
  };
  console.log("user", user);
  return (
    <Layout>
      <Header className="nav__content">
        <Row justify="space-between" align="center" className="nav__bar">
          <Link to="/">
            <img src={logo} alt="resume builder" style={{ height: "40px" }} />
          </Link>
          <Col span={12}>
            <Flex justify="flex-end">
              <Link className="menu-item" to="/">
                Resume
              </Link>
              <Link className="menu-item" to="/templates">
                Templates
              </Link>
              {user && (
                <Link className="menu-item" to="/templates">
                  {user?.name}
                </Link>
              )}

              {isAuthenticated ? (
                <Button
                  className="menu-item"
                  type="primary"
                  size="large"
                  onClick={() => logOut()}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  className="menu-item"
                  type="primary"
                  size="large"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
              )}
            </Flex>
          </Col>
        </Row>
      </Header>
    </Layout>
  );
};

export default Headers;

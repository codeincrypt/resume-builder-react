import { useState } from "react";
import {
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { App, Avatar, Button, Drawer, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { authErrorMessage, logOut } from "../database/auth";
import { useAppSelector } from "../store/hooks";
import Logo from "./Logo";

const NAV = [
  { to: "/templates", label: "Templates" },
  { to: "/#features", label: "Features" },
  { to: "/#how-it-works", label: "How It Works" },
];

export default function Header() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAppSelector((state) => state.auth.user);
  const signedIn = !!user?.emailVerified;
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logOut();
      setOpen(false);
      navigate("/");
    } catch (error) {
      message.error(authErrorMessage(error));
    }
  };

  const menu: MenuProps["items"] = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">My resumes</Link>,
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to="/profile">Account & privacy</Link>,
    },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Sign out", onClick: handleLogout },
  ];

  const navLinks = (onClick?: () => void) =>
    NAV.map((item) =>
      // Hash links point into the landing page; NavLink would mark them all
      // "active" whenever the path is "/".
      item.to.includes("#") ? (
        <Link key={item.to} to={item.to} className="site-header__link" onClick={onClick}>
          {item.label}
        </Link>
      ) : (
        <NavLink key={item.to} to={item.to} className="site-header__link" onClick={onClick}>
          {item.label}
        </NavLink>
      ),
    );

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Logo to={signedIn ? "/dashboard" : "/"} />

        <nav className="site-header__nav" aria-label="Main">
          {navLinks()}
        </nav>

        <div className="site-header__actions">
          {signedIn ? (
            <>
              <Button type="primary" onClick={() => navigate("/dashboard")}>
                My resumes
              </Button>
              <Dropdown menu={{ items: menu }} trigger={["click"]} placement="bottomRight">
                <button className="avatar-button" aria-label="Account menu">
                  <Avatar src={user?.photoURL || undefined} size={34}>
                    {(user?.displayName || user?.email || "?")[0]?.toUpperCase()}
                  </Avatar>
                </button>
              </Dropdown>
            </>
          ) : (
            <>
              <Button type="text" onClick={() => navigate("/login")}>
                Sign In
              </Button>
              <Button type="primary" onClick={() => navigate("/signup")}>
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          className="site-header__burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <MenuOutlined />
        </button>
      </div>

      <Drawer
        title="Menu"
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        size={280}
      >
        <nav className="drawer-nav" aria-label="Mobile">
          {navLinks(() => setOpen(false))}
          {signedIn ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                My resumes
              </Link>
              <Link to="/profile" onClick={() => setOpen(false)}>
                Account & privacy
              </Link>
              <Button block onClick={handleLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button block onClick={() => { setOpen(false); navigate("/login"); }}>
                Sign In
              </Button>
              <Button block type="primary" onClick={() => { setOpen(false); navigate("/signup"); }}>
                Get Started
              </Button>
            </>
          )}
        </nav>
      </Drawer>
    </header>
  );
}

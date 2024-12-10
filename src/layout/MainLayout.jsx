import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Headers from "../components/Header";

const MainLayout = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <>
      <Headers />
      <div className="margin-top">{children}</div>
    </>
  );
};

export default MainLayout;

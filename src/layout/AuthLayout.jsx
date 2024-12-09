import React from "react";
import { Navigate } from "react-router-dom";

import { useSelector } from "react-redux";

import Headers from "../components/Header";

const MainLayout = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <Headers />
      {children}
    </>
  );
};

export default MainLayout;

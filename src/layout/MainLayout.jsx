import React from "react";
import { useSelector } from "react-redux";
import Headers from "../components/Header";
import { Navigate } from "react-router-dom";

const MainLayout = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  console.log({ isAuthenticated });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Headers />
      <div className="margin-top">{children}</div>
    </>
  );
};

export default MainLayout;

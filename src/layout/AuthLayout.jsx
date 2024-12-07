import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Layout } from "antd";

const MainLayout = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  console.log({ isAuthenticated });

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" />;
  // }

  return (
    <>
      {children}
    </>
  );
};

export default MainLayout;

import { lazy } from "react";

// import Login from "./../containers/auth/Login";
import Users from "../page/Users";
import Home from "../page/Home";

export const AuthRouter = [
  {
    path: "/login",
    exact: true,
    component: Home,
  },
];

export const MainRouter = [
  {
    path: "/",
    exact: true,
    component: Home
  },
  {
    path: "/user",
    exact: true,
    component: Users
  },
  {
    path: "/users",
    exact: true,
    component: Users
  },
];
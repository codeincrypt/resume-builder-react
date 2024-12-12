
import Home from "../main/Home";
import Login from "../auth/Login";
import ResumeTemplate from "../main/ResumeTemplate";

import CreateResume from "../page/CreateResume";
import Profile from "../page/Profile";
import MyResume from "../page/MyResume";

export const AuthRouter = [
  {
    path: "/login",
    exact: true,
    component: Login,
  },
  {
    path: "/",
    exact: true,
    component: Home,
  },
  {
    path: "/home",
    exact: true,
    component: Home,
  },
];

export const MainRouter = [
  {
    path: "/resume-template",
    exact: true,
    component: ResumeTemplate,
  },
  {
    path: "/profile",
    exact: true,
    component: Profile,
  },
  {
    path: "/my-resume",
    exact: true,
    component: MyResume,
  },
  {
    path: "/create-resume",
    exact: true,
    component: CreateResume,
  },
];

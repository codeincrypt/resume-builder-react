
import Home from "../page/Home";
import ResumeTemplate from "../page/ResumeTemplate";
import CreateResume from "../page/CreateResume";
import Login from "../auth/Login";
import Profile from "../page/Profile";

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
    path: "/create-resume",
    exact: true,
    component: CreateResume,
  },
];

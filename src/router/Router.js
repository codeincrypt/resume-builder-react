
import Home from "../page/Home";
import ResumeTemplate from "../page/ResumeTemplate";
import CreateResume from "../page/CreateResume";
import Login from "../auth/Login";

export const AuthRouter = [
  {
    path: "/login",
    exact: true,
    component: Login,
  },
];

export const MainRouter = [
  {
    path: "/",
    exact: true,
    component: Home,
  },
  {
    path: "/resume-template",
    exact: true,
    component: ResumeTemplate,
  },
  {
    path: "/create-resume",
    exact: true,
    component: CreateResume,
  },
];

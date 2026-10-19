import type { ComponentType } from "react";
import { createElement, lazy } from "react";
import { Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";

// Entry pages load with the app; everything else is split into its own chunk
// so the landing page doesn't download the editor, the upload parser, etc.
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Editor = lazy(() => import("../pages/Editor"));
const Upload = lazy(() => import("../pages/Upload"));
const Create = lazy(() => import("../pages/CreateResume"));
const Profile = lazy(() => import("../pages/Profile"));
const Templates = lazy(() => import("../pages/ResumeTemplate"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));
const Privacy = lazy(() => import("../pages/Legal").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("../pages/Legal").then((m) => ({ default: m.Terms })));
const Contact = lazy(() => import("../pages/Legal").then((m) => ({ default: m.Contact })));

export interface AppRoute {
  path: string;
  component: ComponentType;
  /** Document title (suffixed with the product name); pages may override it. */
  title?: string;
}

const redirect = (to: string): ComponentType => () =>
  createElement(Navigate, { to, replace: true });

/** Public routes — header + footer, no sign-in required. */
export const publicRoutes: AppRoute[] = [
  { path: "/", component: Home },
  { path: "/home", component: redirect("/") },
  { path: "/templates", component: Templates, title: "Resume templates" },
  { path: "/login", component: Login, title: "Sign in" },
  { path: "/signup", component: Signup, title: "Create your account" },
  { path: "/forgot-password", component: ForgotPassword, title: "Reset your password" },
  { path: "/verify-email", component: VerifyEmail, title: "Verify your email" },
  { path: "/privacy", component: Privacy, title: "Privacy Policy" },
  { path: "/terms", component: Terms, title: "Terms of Use" },
  { path: "/contact", component: Contact, title: "Contact" },
];

/** Behind sign-in, inside the standard page chrome (MainLayout gates). */
export const protectedRoutes: AppRoute[] = [
  { path: "/dashboard", component: Dashboard, title: "My resumes" },
  { path: "/create", component: Create, title: "Create a resume" },
  { path: "/upload", component: Upload, title: "Upload a resume" },
  { path: "/profile", component: Profile, title: "Account & privacy" },
  { path: "/my-resume", component: redirect("/dashboard") },
];

/** Behind sign-in, full-bleed: the editor draws its own toolbar. */
export const editorRoutes: AppRoute[] = [
  { path: "/editor/:id", component: Editor, title: "Editor" },
];

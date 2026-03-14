import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { VerifyClaim } from "./pages/VerifyClaim";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { TrendingNews } from "./pages/TrendingNews";
import { UrlInvestigation } from "./pages/UrlInvestigation";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/verify",
    Component: VerifyClaim,
  },
  {
    path: "/verify-image",
    Component: VerifyClaim,
  },
  {
    path: "/history",
    Component: History,
  },
  {
    path: "/url-investigation",
    Component: UrlInvestigation,
  },
  {
    path: "/trending",
    Component: TrendingNews,
  },
  {
    path: "/settings",
    Component: Settings,
  },
]);
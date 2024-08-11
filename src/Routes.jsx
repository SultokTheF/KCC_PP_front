import { Route, Routes } from "react-router-dom";
import {
  Login,
  Registration,

  PageNotFound
} from './components';

import {
  // User
  UserDashboard,
  UserProfile,
  UserGraphs,

  // Dispatcher
  DispatcherProfile

  // Admin
} from "./modules";

const Router = ({ userRole }) => {
  return (
    <Routes>
      {!userRole && (
        <>
          <Route path="*" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
        </>
      )}

      {userRole === "USER" && (
        <>
          <Route path="/" element={<UserProfile />} />
          <Route path="/dashboard" element={<UserDashboard />} />

          <Route path="/graphs" element={<UserGraphs />} />
          <Route path="*" element={<PageNotFound />} />
        </>
      )}

      {userRole === "DISPATCHER" && (
        <>
          <Route path="/" element={<DispatcherProfile />} />
          <Route path="*" element={<PageNotFound />} />
        </>
      )}

      {userRole === "ADMIN" && (
        <>
        </>
      )}

      {/* Default route for unknown roles or unauthorized access */}
      {/* <Route path="*" element={<PageNotFound />} /> */}
    </Routes>
  );
};

const AppRoutes = ({ userRole }) => {
  return <Router userRole={userRole} />;
};

export default AppRoutes;

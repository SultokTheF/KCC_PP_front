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
  DispatcherProfile,
  DispatcherDashboard,

  // Admin
  AdminProfile,
  AdminHoliday,
  AdminDirections,
  AdminPredictionTariffs,
  AdminIndProvTariffs,
  AdminProviders,
  AdminReportTariffs
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
          <Route path="/dashboard" element={<DispatcherDashboard />} />
          <Route path="*" element={<PageNotFound />} />
        </>
      )}

      {userRole === "ADMIN" && (
        <>
          <Route path="/" element={<AdminProfile />} />
          <Route path="/holidays" element={<AdminHoliday />} />
          <Route path="/tariffs/directions" element={<AdminDirections />} />
          <Route path="/tariffs/prediction" element={<AdminPredictionTariffs />} />
          <Route path="/tariffs/ind-prov" element={<AdminIndProvTariffs />} />
          <Route path="/tariffs/providers" element={<AdminProviders />} />
          <Route path="/reports/hour-report" element={<AdminReportTariffs />} />

          <Route path="*" element={<PageNotFound />} />
        </>
      )}
    </Routes>
  );
};

const AppRoutes = ({ userRole }) => {
  return <Router userRole={userRole} />;
};

export default AppRoutes;

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
  UserHoursTable,
  UserTableOverview,
  UserFormConstructor,
  UserDisbalance,

  // Dispatcher
  DispatcherProfile,
  DispatcherDashboard,
  DispatcherFormContructor,
  DispatcherTableOverview,
  DispatcherGraphs,
  DispatcherDisbalance,

  // Admin
  AdminProfile,
  AdminHoliday,
  AdminDirections,
  AdminPredictionTariffs,
  AdminIndProvTariffs,
  AdminProviders,
  AdminReportTariffs,
  AdminGraphs,
  AdminDisbalance,
  AdminHistory,
  AdminSubjectsList,
  AdminSingleSubject,
  AdminObjectsList,
  AdminSingleObject,
  AdminSubjectPlans,
  AdminUsersList,
  AdminSingleUser,
  AdminHoursTable,
  AdminVolumes,
  AdminFormContructor,
  AdminTableOverview,
  AdminFormulaConstructor
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
          <Route path="/hours-table" element={<UserHoursTable />} />
          <Route path="/forms/table" element={<UserTableOverview />} />
          <Route path="/forms/table/:id" element={<UserFormConstructor />} />
          <Route path="/reports/export" element={<UserDisbalance />} />
          <Route path="*" element={<PageNotFound />} />
        </>
      )}

      {userRole === "DISPATCHER" && (
        <>
          <Route path="/" element={<DispatcherProfile />} />
          <Route path="/dashboard" element={<DispatcherDashboard />} />
          <Route path="/reports/export" element={<DispatcherDisbalance />} />
          <Route path="/forms/table" element={<DispatcherTableOverview />} />
          <Route path="/forms/table/:id" element={<DispatcherFormContructor />} />
          <Route path="/graphs" element={<DispatcherGraphs />} />
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
          <Route path="/tariffs/volumes" element={<AdminVolumes />} />
          <Route path="/reports/hour-report" element={<AdminReportTariffs />} />
          <Route path="/reports/graphs" element={<AdminGraphs />} />
          <Route path="/reports/disbalance" element={<AdminDisbalance />} />
          <Route path="/reports/history" element={<AdminHistory />} />
          <Route path="/reports/hour-table" element={<AdminHoursTable />} />
          <Route path="/forms/table" element={<AdminTableOverview />} />
          <Route path="/forms/table/:id" element={<AdminFormContructor />} />
          <Route path="/forms/formula" element={<AdminFormulaConstructor />} />

          <Route path="/subjects" element={<AdminSubjectsList />} />
          <Route path="/subjects/:id" element={<AdminSingleSubject />} />
          <Route path="/objects" element={<AdminObjectsList />} />
          <Route path="/objects/:id" element={<AdminSingleObject />} />
          <Route path="/subjects/plan/:subjectId" element={<AdminSubjectPlans />} />
          <Route path="/users" element={<AdminUsersList />} />
          <Route path="/users/:id" element={<AdminSingleUser />} />

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

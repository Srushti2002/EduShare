import { Routes, Route, useLocation } from 'react-router-dom';
import SignupLogin from '../src/pages/Auth/SignupLogin';
import StudentDashboard from '../src/pages/Student/StudentDashboard';
import TopBar from './components/TopBar';
import MentorDashboard from '../src/pages/Mentor/MentorDashboard';
import ViewPlaylist from './components/ViewPlaylist';
import MentorProfile from './pages/Mentor/MentorProfile';
import StudentProfile from './pages/Student/StudentProfile';
import PlaylistTest from './components/PlaylistTest';
import ProtectedRoute from './components/ProtectedRoute';

const protectedRoutes = [
  { path: "/student-dashboard", element: <StudentDashboard /> },
  { path: "/mentor-dashboard", element: <MentorDashboard /> },
  { path: "/view-playlist/:id", element: <ViewPlaylist /> },
  { path: "/profile", element: <MentorProfile /> },
  { path: "/mentor/:mentorId", element: <MentorProfile /> },
  { path: "/student-profile", element: <StudentProfile /> },
  { path: "/playlist/:id/test", element: <PlaylistTest /> },
];

const App = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/" && <TopBar />}
      <Routes>
        <Route path="/" element={<SignupLogin />} />
        {protectedRoutes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<ProtectedRoute>{element}</ProtectedRoute>}
          />
        ))}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </>
  );
};

export default App;
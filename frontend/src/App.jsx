import { HashRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import GuidePage from "./pages/GuidePage";
import VotingPage from "./pages/VotingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CreateVotingPage from "./pages/CreateVotingPage";
import MyVotingsPage from "./pages/MyVotingsPage";
import MyCreatedVotingsPage from "./pages/MyCreatedVotingsPage";
import ManageVotesPage from "./pages/ManageVotesPage";
import ProfilePage from "./pages/ProfilePage";
import { IotaProvider } from "./context/IotaProvider";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import "./App.css";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <IotaProvider>
      <HashRouter>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.8)", // Darker background for readability
              color: "#f8fafc",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "12px 20px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              fontSize: "0.95rem",
              fontWeight: 500,
            },
            success: {
              icon: "✅", // Or using default green check
              style: {
                borderLeft: "4px solid #10B981",
              },
            },
            error: {
              icon: "❌",
              style: {
                borderLeft: "4px solid #EF4444",
              },
            },
          }}
        />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="guide" element={<GuidePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />

              <Route
                path="create"
                element={
                  <ProtectedRoute allowedRoles={["organizer"]}>
                    <CreateVotingPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="vote/:id"
                element={
                  <ProtectedRoute>
                    <VotingPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="my-votings"
                element={
                  <ProtectedRoute allowedRoles={["voter"]}>
                    <MyVotingsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="my-created"
                element={
                  <ProtectedRoute allowedRoles={["organizer"]}>
                    <MyCreatedVotingsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="manage-votes/:eventId"
                element={
                  <ProtectedRoute allowedRoles={["organizer"]}>
                    <ManageVotesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </HashRouter>
    </IotaProvider>
  );
}

export default App;

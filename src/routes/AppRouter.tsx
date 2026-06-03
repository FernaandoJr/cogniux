import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { ProfessorLayout } from "@/routes/ProfessorLayout";
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage } from "@/pages/AuthPage";
import { Dashboard } from "@/components/Dashboard";
import { ExamsPage } from "@/pages/ExamsPage";
import { ExamCreatorPage } from "@/pages/ExamCreatorPage";
import { ExamDetailPage } from "@/pages/ExamDetailPage";
import { OnlineExam } from "@/components/OnlineExam";
import { SeedPage } from "@/pages/SeedPage";
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/portal" element={<Navigate to="/auth" replace />} />
      <Route path="/online/:examId" element={<OnlineExam />} />

      <Route element={<ProtectedRoute />}>
        {/* Pages with sidebar layout */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/create" element={<ExamCreatorPage />} />
        <Route path="/exams/:id/edit" element={<ExamCreatorPage />} />
        <Route path="/exams/:id" element={<Navigate to="overview" replace />} />
        <Route path="/exams/:id/:tab" element={<ExamDetailPage />} />

        {/* Other protected pages use the landing navbar via ProfessorLayout */}
        <Route element={<ProfessorLayout />}>
          <Route path="/exam/:id" element={<Navigate to="overview" replace />} />
          <Route path="/exam/:id/:tab" element={<Navigate to="/exams" replace />} />
          <Route path="/seed" element={<SeedPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

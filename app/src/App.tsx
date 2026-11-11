import { Route, Routes } from "react-router-dom";
import AdminPage from "@/pages/AdminPage";
import AuthScreen from "@/pages/AuthScreen";
import HomePage from "@/pages/HomePage";
import BookReaderPage from "@/pages/BookReaderPage";
import LibraryPage from "@/pages/LibraryPage";
import LibraryWorkspacePreview from "@/pages/LibraryWorkspacePreview";
import ReadingPage from "@/pages/ReadingPage";
import SourcesPreview from "@/pages/SourcesPreview";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/signin" element={<AuthScreen />} />
      <Route path="/prototype/library-workspace" element={<LibraryWorkspacePreview />} />
      <Route path="/prototype/sources" element={<SourcesPreview />} />
      <Route path="/reading/:slug" element={<ReadingPage />} />
      <Route path="/reading/book/:bookSlug/page/:pageNum" element={<BookReaderPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

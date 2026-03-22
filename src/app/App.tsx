import { Routes, Route } from 'react-router-dom';
import { SharedLayout } from './layout/SharedLayout';
import { HomePage } from './routes/HomePage';
import { EditorPage } from './routes/EditorPage';
import { ChangelogPage } from './routes/ChangelogPage';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

export function App() {
  return (
    <Routes>
      <Route element={<SharedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
      </Route>
      <Route path="/editor" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
    </Routes>
  );
}

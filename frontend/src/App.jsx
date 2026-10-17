import { Routes, Route, Navigate } from 'react-router-dom';
import { useLibrary } from './context/LibraryContext.jsx';
import Layout from './components/Layout.jsx';
import InicioPage from './pages/InicioPage.jsx';
import CatalogoPage from './pages/CatalogoPage.jsx';
import LibroPage from './pages/LibroPage.jsx';
import PrestamosPage from './pages/PrestamosPage.jsx';
import DevolucionesPage from './pages/DevolucionesPage.jsx';
import ReservasPage from './pages/ReservasPage.jsx';
import RecomendacionesPage from './pages/RecomendacionesPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';
import EstructurasPage from './pages/EstructurasPage.jsx';

/**
 * Rutas de la plataforma de la Biblioteca UAO.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function App() {
  const { ready, error } = useLibrary();

  return (
    <Layout>
      {error ? (
        <div className="loading">No se pudo cargar la biblioteca: {error}</div>
      ) : !ready ? (
        <div className="loading">
          <span className="spinner" aria-hidden="true" /> Cargando la biblioteca…
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<InicioPage />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
          <Route path="/libros/:id" element={<LibroPage />} />
          <Route path="/prestamos" element={<PrestamosPage />} />
          <Route path="/devoluciones" element={<DevolucionesPage />} />
          <Route path="/reservas" element={<ReservasPage />} />
          <Route path="/recomendaciones" element={<RecomendacionesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/estructuras" element={<EstructurasPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Layout>
  );
}

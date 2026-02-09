import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { ClientesList, ClienteDetail } from './features/clientes';
import { ProyectosList, ProyectoDetail } from './features/proyectos';

function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Bienvenido al sistema de gestión de P&L de Redbee.
      </p>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-2">Próximamente.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          {/* Clientes */}
          <Route path="/clientes" element={<ClientesList />} />
          <Route path="/clientes/:id" element={<ClienteDetail />} />
          {/* Proyectos */}
          <Route path="/proyectos" element={<ProyectosList />} />
          <Route path="/proyectos/:id" element={<ProyectoDetail />} />
          {/* Otros módulos (próximamente) */}
          <Route
            path="/contratos"
            element={<PlaceholderPage title="Contratos" />}
          />
          <Route path="/pnl" element={<PlaceholderPage title="P&L" />} />
          <Route
            path="/rolling"
            element={<PlaceholderPage title="Rolling" />}
          />
          <Route
            path="/configuracion"
            element={<PlaceholderPage title="Configuración" />}
          />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

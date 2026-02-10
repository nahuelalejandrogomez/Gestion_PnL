import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, Database } from 'lucide-react';
import { api } from '@/lib/api';

export function AdminPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleResetPerfiles = async () => {
    if (!confirm('¿Estás seguro? Esto eliminará todos los perfiles existentes y creará 27 nuevos perfiles + el tarifario BASE template.')) {
      return;
    }

    setIsResetting(true);
    setResult(null);

    try {
      const { data } = await api.post('/admin/reset-perfiles');
      setResult({
        success: true,
        message: `✅ Reset completado exitosamente!`,
        data,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Error al ejecutar el reset',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800">Admin Panel</h1>
        <p className="text-stone-500 mt-2">Operaciones administrativas y mantenimiento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Reset Perfiles y Seed Tarifario BASE
          </CardTitle>
          <CardDescription>
            Elimina todos los perfiles existentes y carga 27 perfiles nuevos con el tarifario template BASE.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠️ Operación destructiva</p>
                <p>Esta acción eliminará:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Todas las líneas de tarifarios</li>
                  <li>Todos los recursos</li>
                  <li>Todas las líneas de plan de proyectos</li>
                  <li>Todos los perfiles existentes</li>
                </ul>
                <p className="mt-2">Y creará:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>27 perfiles nuevos (Dev backend Jr/Ssr/Sr, etc.)</li>
                  <li>Cliente TEMPLATES</li>
                  <li>Tarifario BASE template con rates en USD</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleResetPerfiles}
            disabled={isResetting}
            variant="destructive"
            className="w-full"
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ejecutando Reset...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Ejecutar Reset de Perfiles
              </>
            )}
          </Button>

          {result && (
            <div
              className={`rounded-md p-4 ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.success && result.data && (
                    <div className="mt-3 text-sm text-green-700 space-y-1">
                      <p>• Dependencias eliminadas: {result.data.deletedDependencies}</p>
                      <p>• Perfiles creados: {result.data.createdPerfiles}</p>
                      <p>• Cliente TEMPLATES: {result.data.templatesCliente}</p>
                      <p>• Líneas en tarifario BASE: {result.data.baseTarifarioLineas}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * RollingPage - Dashboard consolidado P&L todos clientes
 * ÉPICA 1 US-003: Selector año con URL sync
 * ÉPICA 2 US-005: Integración RfActualsTable
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YearSelector } from './shared/YearSelector';
import { RfActualsTable } from './RfActualsTable';
import type { ActiveTab } from '../types/rolling.types';

export function RollingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const currentYear = now.getFullYear();

  // Parse year from URL or default to current
  const yearParam = searchParams.get('year');
  const initialYear = yearParam ? Number(yearParam) : currentYear;

  // Validate year (2020 <= year <= current + 1)
  const validYear = initialYear >= 2020 && initialYear <= currentYear + 1
    ? initialYear
    : currentYear;

  const [year, setYear] = useState(validYear);
  const [activeTab, setActiveTab] = useState<ActiveTab>('rf-actuals');

  const handleTabChange = (newTab: string) => {
    const from = activeTab;
    const to = newTab as ActiveTab;

    console.log('[Rolling] Tab changed', {
      from,
      to,
      timestamp: Date.now(),
    });

    setActiveTab(to);
  };

  const handleYearChange = (newYear: number) => {
    const from = year;

    console.log('[Rolling] Year changed', {
      from,
      to: newYear,
      timestamp: Date.now(),
    });

    setYear(newYear);
    setSearchParams({ year: String(newYear) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Rolling Forecast</h1>
          <p className="text-sm text-stone-500 mt-1">
            Consolidado P&L de todos los clientes
          </p>
        </div>
        <YearSelector year={year} onChange={handleYearChange} />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="rf-actuals">RF Actuals</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pnls">PNLs Reales</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="rf-actuals" className="mt-6">
          <RfActualsTable year={year} />
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card className="border-stone-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-stone-500">
                Revenue - En desarrollo
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnls" className="mt-6">
          <Card className="border-stone-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">PNLs Reales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-stone-500">
                PNLs Reales - En desarrollo
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <Card className="border-stone-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-stone-500">
                Dashboard - En desarrollo
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { YearSelector } from './shared/YearSelector';

type ActiveTab = 'rf-actuals' | 'revenue' | 'pnls' | 'dashboard';

export function RollingPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<ActiveTab>('rf-actuals');

  const handleTabChange = (value: string) => {
    const from = activeTab;
    const to = value as ActiveTab;
    
    console.log('[Rolling] Tab changed', { 
      from, 
      to, 
      timestamp: Date.now() 
    });
    
    setActiveTab(to);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Rolling</h1>
        <YearSelector year={year} onChange={setYear} />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rf-actuals">RF Actuals</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pnls">PNLs Reales</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="rf-actuals">
          <Card>
            <CardContent className="p-6">
              <p className="text-stone-500">RF Actuals - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardContent className="p-6">
              <p className="text-stone-500">Revenue - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnls">
          <Card>
            <CardContent className="p-6">
              <p className="text-stone-500">PNLs Reales - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card>
            <CardContent className="p-6">
              <p className="text-stone-500">Dashboard - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Интерфейсы данных
interface VehiclePerformancePoint {
    plateNumber: string;
    totalMileage: number;
    costPerKm: number;
}

interface TripEfficiencyPoint {
    date: string;
    consumptionPer100Km: number;
}

interface AnalyticsData {
  top5VehiclesByMileage: Record<string, number>;
  totalFuelCost: number;
  totalRepairCost: number;
  fleetPerformanceMatrix?: VehiclePerformancePoint[];
  vehicleEfficiencyTrend?: TripEfficiencyPoint[];
  vehicleFuelCost?: number;
  vehicleRepairCost?: number;
}

interface DashboardChartsProps {
  data: AnalyticsData | null;
  selectedVehicleId: number | null;
  vehicleCount: number;
}

// Типы для графиков
interface TooltipPayloadItem {
    color: string;
    name: string;
    value: number | string;
    unit?: string;
    payload: unknown;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

interface ScatterPayloadItem {
    payload: VehiclePerformancePoint;
}

interface ScatterTooltipProps {
    active?: boolean;
    payload?: ScatterPayloadItem[];
}

interface ComparisonDataPoint {
    name: string;
    value?: number;
    'Текущее ТС'?: number;
    'Среднее по парку'?: number;
    [key: string]: string | number | undefined;
}

const CHART_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#7c3aed', // violet-600
];

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-border shadow-md rounded-lg p-3 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-bold">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('ru-RU') : entry.value}
              {entry.unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ScatterTooltip = ({ active, payload }: ScatterTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-950 border border-border shadow-md rounded-lg p-3 text-sm">
        <p className="font-bold mb-2 text-base text-blue-600 dark:text-blue-400">{data.plateNumber}</p>
        <div className="space-y-1">
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Пробег:</span>
            <span className="font-mono font-medium">{data.totalMileage.toLocaleString()} км</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Стоимость 1 км:</span>
            <span className="font-mono font-medium">{data.costPerKm} BYN</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data, selectedVehicleId, vehicleCount }) => {
  if (!data) return <div className="p-8 text-center text-muted-foreground animate-pulse">Загрузка аналитики...</div>;

  // ИСПРАВЛЕНИЕ: Добавлена защита || {} на случай пустых данных
  const barData = Object.entries(data.top5VehiclesByMileage || {}).map(([key, value]) => ({
    name: key,
    mileage: value || 0,
  }));

  // ИСПРАВЛЕНИЕ: Добавлены || 0 для защиты математики
  let comparisonData: ComparisonDataPoint[] = [];
  let isComparisonChart = false;

  if (selectedVehicleId) {
    isComparisonChart = true;
    const avgFuel = vehicleCount > 0 ? (data.totalFuelCost || 0) / vehicleCount : 0;
    const avgRepair = vehicleCount > 0 ? (data.totalRepairCost || 0) / vehicleCount : 0;
    
    comparisonData = [
      { 
        name: 'Топливо', 
        'Текущее ТС': data.vehicleFuelCost || 0, 
        'Среднее по парку': avgFuel 
      },
      { 
        name: 'Ремонт', 
        'Текущее ТС': data.vehicleRepairCost || 0, 
        'Среднее по парку': avgRepair 
      },
    ];
  } else {
    comparisonData = [
      { name: 'Топливо', value: data.totalFuelCost || 0 },
      { name: 'Ремонт', value: data.totalRepairCost || 0 },
    ];
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-8">
      
      {/* ГРАФИК 1: Топ-5 ТС по пробегу */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Топ-5 ТС по пробегу</CardTitle>
          <CardDescription>Лидеры по эксплуатации в парке (км)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                <Bar 
                  dataKey="mileage" 
                  fill={CHART_COLORS[0]} 
                  name="Пробег" 
                  radius={[4, 4, 0, 0]} 
                  unit=" км"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ГРАФИК 2: Затраты */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedVehicleId ? 'Сравнение затрат (ТС vs Среднее)' : 'Структура расходов парка'}
          </CardTitle>
          <CardDescription>
            {selectedVehicleId ? 'Насколько затраты этого ТС отличаются от средних по парку' : 'Соотношение общих затрат на ГСМ и Ремонты'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              {isComparisonChart ? (
                 <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }}/>
                    <Bar dataKey="Текущее ТС" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} unit=" BYN" />
                    <Bar dataKey="Среднее по парку" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} unit=" BYN" />
                 </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={comparisonData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 2 + 2]} stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ГРАФИК 3: Матрица Эффективности */}
      {!selectedVehicleId && data.fleetPerformanceMatrix && (
        <Card className="col-span-1 md:col-span-2 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="text-lg">Матрица эффективности автопарка</CardTitle>
            <CardDescription>Анализ соотношения использования (Пробег) и эффективности (Стоимость 1 км).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    dataKey="totalMileage" 
                    name="Пробег" 
                    unit=" км" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: 'Общий пробег (км)', position: 'insideBottom', offset: -10, fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="costPerKm" 
                    name="Стоимость" 
                    unit=" BYN" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: 'Стоимость 1 км (BYN)', angle: -90, position: 'insideLeft', fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <ZAxis range={[100, 100]} /> 
                  <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Транспортные средства" data={data.fleetPerformanceMatrix} fill={CHART_COLORS[0]} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ГРАФИК 4: Динамика расхода */}
      {selectedVehicleId && data.vehicleEfficiencyTrend && (
        <Card className="col-span-1 md:col-span-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Динамика эффективности расхода топлива</CardTitle>
            <CardDescription>Изменение расхода л/100км по поездкам (Тренд)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.vehicleEfficiencyTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="consumptionPer100Km" 
                    stroke={CHART_COLORS[3]} 
                    strokeWidth={3}
                    dot={{ r: 4, fill: CHART_COLORS[3] }}
                    activeDot={{ r: 6 }}
                    name="Расход л/100км"
                    unit=" л"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
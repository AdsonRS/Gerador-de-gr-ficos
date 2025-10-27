
import React, { forwardRef } from 'react';
import { 
    LineChart, Line, 
    BarChart, Bar,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import type { Parameter, ChartType, AspectRatio } from '../types';

interface DataChartProps {
  chartData: any[];
  uniqueAmbientes: string[];
  parameter: Parameter;
  chartType: ChartType;
  lineColors: { [key: string]: string };
  chartColors: {
      background: string;
      text: string;
      grid: string;
      tooltip: string;
  };
  showDots: boolean;
  strokeWidth: number;
  aspectRatio: AspectRatio;
  valueRange: { min: string; max: string };
}

const DataChart = forwardRef<HTMLDivElement, DataChartProps>(({ 
    chartData, 
    uniqueAmbientes, 
    parameter, 
    chartType, 
    lineColors, 
    chartColors, 
    showDots,
    strokeWidth,
    aspectRatio,
    valueRange,
}, ref) => {
    
    if (chartData.length === 0) {
        return <p className="text-center py-10" style={{ color: chartColors.text }}>Nenhum dado para exibir no período selecionado.</p>;
    }

    const parameterUnits: { [key in Parameter]: string } = {
        'Temperatura': '°C',
        'Umidade': '%',
        'CO2': 'ppm',
    };
    const unit = parameterUnits[parameter] || '';

    const formatDateTick = (tickItem: number) => new Date(tickItem).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const formatTooltipLabel = (label: number) => new Date(label).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const getAspectRatioClass = (ratio: AspectRatio) => {
        switch (ratio) {
            case '16:9': return 'aspect-[16/9]';
            case '4:3': return 'aspect-[4/3]';
            case '1:1': return 'aspect-[1]';
            default: return 'h-96 min-h-[400px]';
        }
    };

    const yDomainMin = valueRange.min !== '' ? parseFloat(valueRange.min) : 'auto';
    const yDomainMax = valueRange.max !== '' ? parseFloat(valueRange.max) : 'auto';

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 5, right: 20, left: 10, bottom: 25 },
        };
        const commonComponents = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    stroke={chartColors.text}
                    tick={{ fontSize: 12, fill: chartColors.text }} 
                    angle={-30} 
                    textAnchor="end" 
                    height={50}
                    tickFormatter={formatDateTick}
                />
                <YAxis 
                    stroke={chartColors.text} 
                    tick={{ fontSize: 12, fill: chartColors.text }} 
                    tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                    domain={[yDomainMin, yDomainMax]}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: chartColors.tooltip, borderColor: chartColors.grid, color: chartColors.text, backdropFilter: 'blur(4px)' }}
                    formatter={(value: number, name: string) => [`${new Intl.NumberFormat('pt-BR').format(value)} ${unit}`, name]}
                    labelFormatter={formatTooltipLabel}
                    labelStyle={{ fontWeight: 'bold', color: chartColors.text }}
                />
                <Legend wrapperStyle={{ color: chartColors.text, bottom: 0 }} />
            </>
        );

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {commonComponents}
                        {uniqueAmbientes.map((ambiente) => (
                            <Bar
                                key={ambiente}
                                dataKey={ambiente}
                                name={ambiente}
                                fill={lineColors[ambiente] || '#ffffff'}
                            />
                        ))}
                    </BarChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        {commonComponents}
                        {uniqueAmbientes.map((ambiente) => (
                            <Area
                                key={ambiente}
                                type="monotone"
                                dataKey={ambiente}
                                name={ambiente}
                                stroke={lineColors[ambiente] || '#ffffff'}
                                fill={lineColors[ambiente] || '#ffffff'}
                                fillOpacity={0.6}
                                strokeWidth={strokeWidth}
                                dot={showDots ? { r: 3, fill: lineColors[ambiente] || '#ffffff' } : false}
                                activeDot={showDots ? { r: 6 } : false}
                                connectNulls
                            />
                        ))}
                    </AreaChart>
                );
            case 'line':
            default:
                return (
                    <LineChart {...commonProps}>
                        {commonComponents}
                        {uniqueAmbientes.map((ambiente) => (
                            <Line
                                key={ambiente}
                                type="monotone"
                                dataKey={ambiente}
                                name={ambiente}
                                stroke={lineColors[ambiente] || '#ffffff'}
                                strokeWidth={strokeWidth}
                                dot={showDots ? { r: 3, fill: lineColors[ambiente] || '#ffffff' } : false}
                                activeDot={showDots ? { r: 6 } : false}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                );
        }
    };

    return (
        <div 
            ref={ref}
            className="p-2 md:p-6 rounded-lg shadow-xl" 
            style={{ backgroundColor: chartColors.background, transition: 'background-color 0.3s' }}
        >
            <h3 className="text-xl font-semibold mb-4 text-center" style={{ color: chartColors.text }}>{`Evolução de ${parameter}`}</h3>
            
            <div className={getAspectRatioClass(aspectRatio)}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
});

export default DataChart;
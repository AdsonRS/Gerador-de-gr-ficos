
import React from 'react';
import type { AspectRatio, Parameter } from '../types';

// Declare XLSX from CDN for TypeScript
declare const XLSX: any;

interface CustomizationPanelProps {
  uniqueAmbientes: string[];
  lineColors: { [key: string]: string };
  onLineColorChange: (ambiente: string, color: string) => void;
  showDots: boolean;
  onShowDotsChange: (show: boolean) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  valueRange: { min: string; max: string };
  onValueRangeChange: (range: { min: string; max: string }) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  chartData: any[];
  parameter: Parameter;
  chartColors: { background: string; text: string };
  onChartColorChange: (key: 'background' | 'text', color: string) => void;
  palettes: { [key: string]: string[] };
  selectedPalette: string;
  onPaletteChange: (paletteName: string) => void;
  onDownloadChart: () => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  uniqueAmbientes,
  lineColors,
  onLineColorChange,
  showDots,
  onShowDotsChange,
  strokeWidth,
  onStrokeWidthChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  valueRange,
  onValueRangeChange,
  aspectRatio,
  onAspectRatioChange,
  chartData,
  parameter,
  chartColors,
  onChartColorChange,
  palettes,
  selectedPalette,
  onPaletteChange,
  onDownloadChart,
}) => {
    
  const handleExport = () => {
    if (chartData.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    // Remove the internal timestamp property before exporting
    const exportData = chartData.map(({ timestamp, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, parameter);
    XLSX.writeFile(workbook, `dados_${parameter}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleValueRangeChange = (field: 'min' | 'max', value: string) => {
    onValueRangeChange({ ...valueRange, [field]: value });
  };

  const aspectRatios: { id: AspectRatio, name: string }[] = [
    { id: 'auto', name: 'Auto' },
    { id: '16:9', name: '16:9' },
    { id: '4:3', name: '4:3' },
    { id: '1:1', name: '1:1' },
  ];

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 p-4 md:p-6 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700">
      <h2 className="text-xl font-bold text-center mb-6 text-cyan-600 dark:text-cyan-300">Painel de Personalização</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Display & Style */}
        <div className="space-y-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-2">Exibição e Estilo</h3>
           
           {/* Chart Background Color */}
            <div className="flex items-center justify-between">
                <label htmlFor="bg-color-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">Cor de Fundo</label>
                <input
                    type="color"
                    id="bg-color-picker"
                    value={chartColors.background}
                    onChange={(e) => onChartColorChange('background', e.target.value)}
                    className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                    title="Selecionar cor de fundo do gráfico"
                />
            </div>

            {/* Chart Text Color */}
            <div className="flex items-center justify-between">
                <label htmlFor="text-color-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">Cor do Texto</label>
                <input
                    type="color"
                    id="text-color-picker"
                    value={chartColors.text}
                    onChange={(e) => onChartColorChange('text', e.target.value)}
                    className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                    title="Selecionar cor do texto do gráfico"
                />
            </div>
           
           {/* Show Dots Toggle */}
           <label htmlFor="show-dots-toggle" className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mostrar Pontos</span>
            <div className="relative inline-flex items-center">
                <input
                    type="checkbox"
                    id="show-dots-toggle"
                    className="sr-only peer"
                    checked={showDots}
                    onChange={(e) => onShowDotsChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </div>
           </label>
           
           {/* Stroke Width Slider */}
           <div className="space-y-2">
            <label htmlFor="stroke-width-slider" className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>Espessura da Linha</span>
                <span className="font-mono text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">{strokeWidth}px</span>
            </label>
            <input
                type="range"
                id="stroke-width-slider"
                min="1"
                max="10"
                step="1"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
           </div>

           {/* Aspect Ratio */}
           <div className="space-y-2">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proporção do Gráfico</label>
             <div className="flex flex-wrap gap-2">
                {aspectRatios.map(ratio => (
                    <button
                        key={ratio.id}
                        onClick={() => onAspectRatioChange(ratio.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                            aspectRatio === ratio.id
                            ? 'bg-cyan-500 text-white shadow'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >{ratio.name}</button>
                ))}
             </div>
           </div>
        </div>
        
        {/* Column 2: Color Palettes & Individual Colors */}
        <div className="space-y-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
           <h3 className="font-semibold text-lg text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-2">Paletas e Cores</h3>
            
            {/* Palettes */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paletas de Cores</label>
                <div className="flex flex-col gap-2">
                    {Object.entries(palettes).map(([name, colors]) => (
                        <button key={name} onClick={() => onPaletteChange(name)}
                            className={`w-full text-left p-2 rounded-md transition-all duration-200 border-2 ${selectedPalette === name ? 'border-cyan-500 scale-105' : 'border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</span>
                            <div className="flex mt-1.5 space-x-1">
                                {(colors as string[]).slice(0, 5).map(color => <div key={color} className="w-1/5 h-3 rounded" style={{ backgroundColor: color }}></div>)}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

           {/* Individual Line Colors */}
           <div className="space-y-4 pt-4 border-t border-gray-300 dark:border-gray-600">
           <h4 className="font-semibold text-md text-gray-800 dark:text-white">Cores (Ambientes)</h4>
           <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 max-h-48 overflow-y-auto">
            {uniqueAmbientes.length > 0 ? uniqueAmbientes.map((ambiente) => (
                <div key={ambiente} className="flex items-center justify-between">
                    <label htmlFor={`color-picker-${ambiente}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{ambiente}</label>
                     <input 
                        type="color" 
                        id={`color-picker-${ambiente}`}
                        value={lineColors[ambiente] || '#ffffff'}
                        onChange={(e) => onLineColorChange(ambiente, e.target.value)}
                        className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                        title={`Selecionar cor para ${ambiente}`}
                     />
                </div>
            )) : <p className="text-xs text-gray-500 dark:text-gray-400 col-span-2">Nenhum ambiente encontrado.</p>}
            </div>
          </div>
        </div>

        {/* Column 3: Data & Filters */}
        <div className="space-y-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
           <h3 className="font-semibold text-lg text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-2">Dados e Filtros</h3>

            {/* Date Range Filter */}
            <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por Período</label>
                 <div className="flex flex-col sm:flex-row gap-2">
                     <input
                         type="date"
                         value={startDate}
                         onChange={(e) => onStartDateChange(e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2"
                         title="Data de Início"
                     />
                     <input
                         type="date"
                         value={endDate}
                         onChange={(e) => onEndDateChange(e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2"
                         title="Data Final"
                     />
                 </div>
            </div>

            {/* Value Range Filter */}
            <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ajuste de Eixo ({parameter})</label>
                 <div className="flex flex-col sm:flex-row gap-2">
                     <input
                         type="number"
                         placeholder="Mínimo"
                         value={valueRange.min}
                         onChange={(e) => handleValueRangeChange('min', e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2"
                         title="Valor Mínimo do Eixo"
                     />
                     <input
                         type="number"
                         placeholder="Máximo"
                         value={valueRange.max}
                         onChange={(e) => handleValueRangeChange('max', e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2"
                         title="Valor Máximo do Eixo"
                     />
                 </div>
            </div>

            {/* Export & Download Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-300 dark:border-gray-600">
                 <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-emerald-500 text-white hover:bg-emerald-600 shadow"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Exportar Dados (XLSX)
                 </button>
                 <button
                    onClick={onDownloadChart}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-sky-500 text-white hover:bg-sky-600 shadow"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Baixar Gráfico (PNG)
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CustomizationPanel;
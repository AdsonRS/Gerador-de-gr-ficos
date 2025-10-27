
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { SampleData, Parameter, ChartType, AspectRatio } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DataChart from './components/DataChart';
import Spinner from './components/Spinner';
import CustomizationPanel from './components/CustomizationPanel';

// Declare htmlToImage from CDN for TypeScript
declare const htmlToImage: any;

const palettes = {
    'Floresta': ['#2d6a4f', '#40916c', '#52b788', '#95d5b2', '#7f5539', '#b08968', '#ddb892', '#ede0d4'],
    'Oceano': ['#0077b6', '#00b4d8', '#90e0ef', '#ade8f4', '#caf0f8', '#03045e', '#023e8a', '#0096c7'],
    'Metrópole': ['#212529', '#495057', '#adb5bd', '#003566', '#006d77', '#ffc300', '#6c757d', '#dee2e6'],
    'Vulcão': ['#d00000', '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08', '#9d0208', '#6a040f'],
    'Monocromático': ['#004d40', '#00796b', '#009688', '#4db6ac', '#80cbc4', '#b2dfdb', '#e0f2f1', '#64b5f6'],
};

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [data, setData] = useState<SampleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedParam, setSelectedParam] = useState<Parameter>('Temperatura');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showDots, setShowDots] = useState<boolean>(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof palettes>('Floresta');
  
  const [chartColors, setChartColors] = useState({
    background: '#1f2937', // gray-800
    text: '#f3f4f6', // gray-100
    grid: 'rgba(107, 114, 128, 0.2)',
    tooltip: 'rgba(31, 41, 55, 0.8)',
  });
  const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
  
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  
  // Reset value filter when parameter changes
  useEffect(() => {
    setValueRange({ min: '', max: '' });
  }, [selectedParam]);

  useEffect(() => {
    if (theme === 'dark') {
      setChartColors({
        background: '#1f2937', // gray-800
        text: '#f3f4f6', // gray-100
        grid: 'rgba(107, 114, 128, 0.2)', // gray-500
        tooltip: 'rgba(31, 41, 55, 0.8)',
      });
    } else {
      setChartColors({
        background: '#ffffff', // white
        text: '#111827', // gray-900
        grid: 'rgba(55, 65, 81, 0.2)', // gray-700
        tooltip: 'rgba(249, 250, 251, 0.8)',
      });
    }
  }, [theme]);

  const handleDataParsed = (parsedData: SampleData[]) => {
    setData(parsedData);
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setData([]);
  };

  const parameters: Parameter[] = ['Temperatura', 'Umidade', 'CO2'];
  const chartTypes: { id: ChartType, name: string }[] = [
      { id: 'line', name: 'Linha' },
      { id: 'bar', name: 'Barras' },
      { id: 'area', name: 'Área' }
  ];

  const filteredData = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return data.filter(item => {
        // Date filter
        const itemDate = item.Data;
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;

        return true;
    });
  }, [data, startDate, endDate]);

  const uniqueAmbientes = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    return [...new Set(filteredData.map(item => item.Ambiente))].sort();
  }, [filteredData]);

  useEffect(() => {
    const palette = palettes[selectedPalette];
    const initialLineColors = uniqueAmbientes.reduce((acc, ambiente, index) => {
      acc[ambiente] = palette[index % palette.length];
      return acc;
    }, {} as { [key: string]: string });
    setLineColors(initialLineColors);
  }, [uniqueAmbientes, selectedPalette]);

  const handleLineColorChange = (ambiente: string, color: string) => {
    setLineColors(prev => ({ ...prev, [ambiente]: color }));
  };

  const handleChartColorChange = (key: 'background' | 'text', color: string) => {
    setChartColors(prev => ({ ...prev, [key]: color }));
  }

  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
        return [];
    }
    const pivotedData: { [key: string]: any } = {};

    filteredData.forEach(row => {
        const dateStr = row.Data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        if (!pivotedData[dateStr]) {
            pivotedData[dateStr] = { Data: dateStr, timestamp: row.Data.getTime() };
        }
        pivotedData[dateStr][row.Ambiente] = row[selectedParam];
    });

    return Object.values(pivotedData).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredData, selectedParam]);
  
  const handleDownloadChart = () => {
    if (chartRef.current === null) {
      alert("Não foi possível encontrar o gráfico para baixar.");
      return;
    }
    htmlToImage.toPng(chartRef.current, { 
        cacheBust: true,
        backgroundColor: chartColors.background,
     })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `grafico-${selectedParam}-${new Date().toISOString().slice(0,10)}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Ocorreu um erro ao baixar o gráfico:', err);
        alert("Ocorreu um erro ao baixar o gráfico.");
      });
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 font-sans">
      <Header theme={theme} setTheme={setTheme} />
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="max-w-3xl mx-auto">
          <FileUpload onDataParsed={handleDataParsed} onError={handleError} setIsLoading={setIsLoading} />
          {error && <p className="mt-4 text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
        </div>
        
        {isLoading && <Spinner />}

        {data.length > 0 && !isLoading && (
          <>
            <CustomizationPanel 
                uniqueAmbientes={uniqueAmbientes}
                lineColors={lineColors}
                onLineColorChange={handleLineColorChange}
                showDots={showDots}
                onShowDotsChange={setShowDots}
                strokeWidth={strokeWidth}
                onStrokeWidthChange={setStrokeWidth}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                valueRange={valueRange}
                onValueRangeChange={setValueRange}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                chartData={chartData}
                parameter={selectedParam}
                chartColors={chartColors}
                onChartColorChange={handleChartColorChange}
                palettes={palettes}
                selectedPalette={selectedPalette}
                onPaletteChange={setSelectedPalette}
                onDownloadChart={handleDownloadChart}
            />
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 md:p-6 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
                <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium self-center mr-2">Parâmetro:</span>
                    {parameters.map((param) => (
                      <button
                        key={param}
                        onClick={() => setSelectedParam(param)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          selectedParam === param
                            ? 'bg-cyan-500 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {param}
                      </button>
                    ))}
                </div>
                 <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium self-center mr-2">Tipo de Gráfico:</span>
                    {chartTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setChartType(type.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                chartType === type.id
                                ? 'bg-indigo-500 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {type.name}
                        </button>
                    ))}
                 </div>
              </div>
              
              <DataChart 
                ref={chartRef}
                chartData={chartData}
                uniqueAmbientes={uniqueAmbientes}
                parameter={selectedParam}
                chartType={chartType}
                lineColors={lineColors}
                chartColors={chartColors}
                showDots={showDots}
                strokeWidth={strokeWidth}
                aspectRatio={aspectRatio}
                valueRange={valueRange}
              />
            </div>
          </>
        )}

        {!isLoading && data.length === 0 && (
           <div className="text-center text-gray-600 dark:text-gray-500 mt-12 p-8 bg-white/50 dark:bg-gray-800/30 rounded-lg max-w-3xl mx-auto">
             <h2 className="text-2xl font-semibold mb-2">Bem-vindo!</h2>
             <p>Para começar, envie sua planilha de dados no formato .xlsx.</p>
             <p>O aplicativo irá visualizar automaticamente os dados de Temperatura, Umidade e CO2 ao longo do tempo.</p>
           </div>
        )}
      </main>

       <footer className="text-center p-4 text-gray-600 dark:text-gray-500 text-sm mt-8">
         <p>Desenvolvido com React, TailwindCSS, e Recharts.</p>
       </footer>
    </div>
  );
};

export default App;
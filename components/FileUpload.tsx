
import React, { useState, useCallback } from 'react';
import type { SampleData, RawSheetData } from '../types';

// Declare XLSX from CDN for TypeScript
declare const XLSX: any;

interface FileUploadProps {
  onDataParsed: (data: SampleData[]) => void;
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
}

// Helper function to parse numbers that might be in pt-BR or other formats
const parsePtNumber = (value: string | number | undefined): number => {
    if (typeof value === 'number') {
        // Heuristic: If temperature or humidity values are large integers, they were
        // likely entered without the intended decimal places.
        // e.g., A value read as 3435168 is interpreted as 34.35168.
        if (Number.isInteger(value) && Math.abs(value) > 1000) {
            return value / 100000;
        }
        return value;
    }
    if (typeof value === 'string') {
        const hasComma = value.includes(',');
        const dotCount = (value.match(/\./g) || []).length;
        let cleanedValue = value;

        if (hasComma) {
            // Handles pt-BR format like "1.234,56" -> "1234.56"
            cleanedValue = value.replace(/\./g, '').replace(',', '.');
        } else if (dotCount > 1) {
            // Handles formats with multiple dots as thousand separators like "1.234.567" -> "1234567"
             cleanedValue = value.replace(/\./g, '');
        }
        
        const num = parseFloat(cleanedValue);
        if (isNaN(num)) return 0;

        // Apply same heuristic for strings that become large integers
        if (Number.isInteger(num) && Math.abs(num) > 1000) {
            return num / 100000;
        }
        return num;
    }
    return 0;
};


// Helper function to parse Excel dates (which can be numbers or strings)
const parseExcelDate = (excelDate: number | string | undefined): Date | null => {
    if (typeof excelDate === 'number') {
        // The formula converts the Excel serial number to a UTC timestamp for midnight.
        const utcMilliseconds = (excelDate - 25569) * 86400000;
        const date = new Date(utcMilliseconds);

        // To prevent timezone-related "off-by-one-day" errors, we create a new Date object
        // using the UTC components of the parsed date. This effectively creates a date
        // at midnight in the local timezone with the correct day, month, and year.
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }
    if (typeof excelDate === 'string') {
        // Handle DD/MM/YYYY format
        const parts = excelDate.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                 // This correctly creates a new Date object at midnight in the local timezone.
                 return new Date(year, month, day);
            }
        }
    }
    return null;
};


const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed, onError, setIsLoading }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
        onError('Por favor, envie um arquivo .xlsx válido.');
        return;
    }
    
    setIsLoading(true);
    setFileName(file.name);
    onError('');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            if (!data) throw new Error("Não foi possível ler o arquivo.");
            
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const jsonData: RawSheetData[] = XLSX.utils.sheet_to_json(worksheet, {
                header: ['Temperatura', 'Umidade', 'CO2', 'Data', 'Ambiente'],
                range: 1 // Skip header row in the file
            });

            if (jsonData.length === 0) throw new Error("A planilha está vazia ou em formato incorreto.");

            const parsedData: SampleData[] = jsonData
              .map((row, index) => {
                  const date = parseExcelDate(row.Data);
                  if (!date || !row.Ambiente || row.Temperatura === undefined || row.Umidade === undefined || row.CO2 === undefined) {
                      console.warn(`Pulando linha ${index + 2}: dados essenciais ausentes.`);
                      return null;
                  }
                  
                  return {
                      Temperatura: parsePtNumber(row.Temperatura),
                      Umidade: parsePtNumber(row.Umidade),
                      CO2: parseFloat(String(row.CO2).replace(',', '.')) || 0, // Ensure CO2 is also parsed correctly
                      Data: date,
                      Ambiente: String(row.Ambiente),
                  };
              })
              .filter((item): item is SampleData => item !== null);
            
            if (parsedData.length === 0) throw new Error("Nenhuma linha de dados válida foi encontrada na planilha.");

            onDataParsed(parsedData);
        } catch (error) {
            console.error("Erro ao processar o arquivo:", error);
            let message = "Ocorreu um erro ao processar o arquivo. Verifique o formato e o conteúdo.";
            if (error instanceof Error) message = error.message;
            onError(message);
        } finally {
            setIsLoading(false);
        }
    };
    reader.onerror = () => {
        onError('Falha ao ler o arquivo.');
        setIsLoading(false);
    }
    reader.readAsArrayBuffer(file);
  }, [onDataParsed, onError, setIsLoading]);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [handleFile]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        handleFile(event.target.files[0]);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-xl border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors duration-300">
      <div 
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="flex flex-col items-center justify-center text-center"
      >
        <input type="file" id="file-upload" className="hidden" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFileChange}/>
        <label htmlFor="file-upload" className="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-white">Arraste e solte seu arquivo .xlsx aqui</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">ou</p>
            <span className="mt-2 inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Selecione um arquivo</span>
        </label>
        {fileName && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Arquivo selecionado: {fileName}</p>}
      </div>
    </div>
  );
};

export default FileUpload;
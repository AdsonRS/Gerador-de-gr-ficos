
export interface SampleData {
  Temperatura: number;
  Umidade: number;
  CO2: number;
  Data: Date;
  Ambiente: string;
}

export type Parameter = 'Temperatura' | 'Umidade' | 'CO2';
export type ChartType = 'line' | 'bar' | 'area';
export type AspectRatio = 'auto' | '16:9' | '4:3' | '1:1';

// Type definition for raw data read from the spreadsheet
export type RawSheetData = {
  'Temperatura'?: number | string;
  'Umidade'?: number | string;
  'CO2'?: number | string;
  'Data'?: number | string;
  'Ambiente'?: string;
  [key: string]: any;
};
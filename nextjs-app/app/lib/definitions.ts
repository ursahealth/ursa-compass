export type AnalysisArrayElement =
  | false
  | { measureField: string; chartData: any };
export type AnalysisArray = AnalysisArrayElement[];
export type TableDetail = {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
};
export type TableDetailsArray = TableDetail[];

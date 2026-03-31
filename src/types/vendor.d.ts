declare module "papaparse" {
  export type ParseResult<T> = {
    data: T[];
    errors: Array<{ message: string }>;
  };

  export type ParseConfig = {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
  };

  const Papa: {
    parse<T>(input: string, config?: ParseConfig): ParseResult<T>;
  };

  export default Papa;
}

declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export function getDocument(source: { data: Uint8Array }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str?: string }>;
        }>;
      }>;
    }>;
  };
}

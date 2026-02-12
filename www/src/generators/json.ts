import { SchemaTable } from './types';

export const JsonGenerator = {
    generateSchema: (tables: SchemaTable[] | SchemaTable): string => {
        return JSON.stringify(tables, null, 4);
    }
};

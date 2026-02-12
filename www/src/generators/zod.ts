import { SchemaTable } from './types';

export const ZodGenerator = {
    generateSchema: (table: SchemaTable): string => {
        const schemaName = table.name.charAt(0).toUpperCase() + table.name.slice(1) + 'Schema';
        const lines: string[] = [];
        
        lines.push(`import { z } from 'zod';`);
        lines.push(``);
        lines.push(`export const ${schemaName} = z.object({`);

        table.columns.forEach(col => {
            let zodType = 'z.string()';
            const type = col.type.toLowerCase();

            if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
                zodType = 'z.number()';
            } else if (type.includes('bool') || type.includes('tinyint(1)')) {
                zodType = 'z.boolean()';
            } else if (type.includes('date') || type.includes('time')) {
                zodType = 'z.date()';
            }

            let chain = `  ${col.name}: ${zodType}`;
            if (col.nullable) chain += '.nullable()';
            if (!col.nullable && col.default === null) {
                // Not nullable but no default might mean required
            }
            
            lines.push(chain + ',');
        });

        lines.push(`});`);
        lines.push(``);
        lines.push(`export type ${table.name.charAt(0).toUpperCase() + table.name.slice(1)} = z.infer<typeof ${schemaName}>;`);
        
        return lines.join('\n');
    }
};

import { SchemaTable } from './types';

export const MermaidGenerator = {
    generateERD: (tables: SchemaTable[]): string => {
        const lines: string[] = ['erDiagram'];

        tables.forEach(table => {
            lines.push(`    ${table.name} {`);
            table.columns.forEach(col => {
                const type = col.type.split('(')[0];
                const key = col.key === 'PRI' ? 'PK' : col.key === 'MUL' ? 'FK' : '';
                lines.push(`        ${type} ${col.name} ${key}`);
            });
            lines.push(`    }`);
        });

        // Add relations
        const addedRelations = new Set<string>();
        tables.forEach(table => {
            table.relations.forEach(rel => {
                const relKey = [table.name, rel.referencedTable].sort().join('-');
                if (!addedRelations.has(relKey)) {
                    lines.push(`    ${table.name} ||--o{ ${rel.referencedTable} : "references"`);
                    addedRelations.add(relKey);
                }
            });
        });

        return lines.join('\n');
    }
};

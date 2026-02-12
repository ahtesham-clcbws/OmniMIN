import { SchemaTable } from './types';

export const GoGenerator = {
    generateStruct: (table: SchemaTable): string => {
        const structName = table.name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
        const lines: string[] = [];
        
        lines.push(`type ${structName} struct {`);

        table.columns.forEach(col => {
            const fieldName = col.name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
            let goType = 'string';
            const type = col.type.toLowerCase();

            if (type.includes('int')) {
                goType = type.includes('unsigned') ? 'uint64' : 'int64';
            } else if (type.includes('decimal') || type.includes('float') || type.includes('double')) {
                goType = 'float64';
            } else if (type.includes('bool') || type.includes('tinyint(1)')) {
                goType = 'bool';
            } else if (type.includes('date') || type.includes('time')) {
                goType = 'time.Time';
            }

            if (col.nullable) {
                if (goType === 'string') goType = 'sql.NullString';
                else if (goType.includes('int')) goType = 'sql.NullInt64';
                else if (goType === 'float64') goType = 'sql.NullFloat64';
                else if (goType === 'bool') goType = 'sql.NullBool';
                else if (goType === 'time.Time') goType = 'sql.NullTime';
                else goType = '*' + goType;
            }

            lines.push(`    ${fieldName.padEnd(20)} ${goType.padEnd(15)} \`db:"${col.name}" json:"${col.name}"\``);
        });

        lines.push(`}`);
        return lines.join('\n');
    }
};

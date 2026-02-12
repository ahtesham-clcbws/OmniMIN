import { SchemaTable } from './types';

export const LaravelGenerator = {
    generateMigration: (table: SchemaTable): string => {
        const lines: string[] = [];
        const hasSoftDeletes = table.columns.some(c => c.name === 'deleted_at');
        const hasTimestamps = table.columns.some(c => c.name === 'created_at') && table.columns.some(c => c.name === 'updated_at');

        lines.push(`<?php`);
        lines.push(``);
        lines.push(`use Illuminate\\Database\\Migrations\\Migration;`);
        lines.push(`use Illuminate\\Database\\Schema\\Blueprint;`);
        lines.push(`use Illuminate\\Support\\Facades\\Schema;`);
        lines.push(``);
        lines.push(`return new class extends Migration`);
        lines.push(`{`);
        lines.push(`    /**`);
        lines.push(`     * Run the migrations.`);
        lines.push(`     */`);
        lines.push(`    public function up(): void`);
        lines.push(`    {`);
        lines.push(`        Schema::create('${table.name}', function (Blueprint $table) {`);
        
        table.columns.forEach(col => {
            if (col.name === 'created_at' || col.name === 'updated_at' || col.name === 'deleted_at') return;

            let line = `            $table->`;
            const type = col.type.toLowerCase();
            
            if (col.extra?.includes('auto_increment')) {
                line += `id()`;
            } else if (type.includes('bigint')) {
                line += `bigInteger('${col.name}')`;
            } else if (type.includes('int')) {
                line += `integer('${col.name}')`;
            } else if (type.includes('varchar')) {
                const length = type.match(/\((\d+)\)/)?.[1] || '255';
                line += `string('${col.name}', ${length})`;
            } else if (type.includes('text')) {
                line += `text('${col.name}')`;
            } else if (type.includes('bool') || type.includes('tinyint(1)')) {
                line += `boolean('${col.name}')`;
            } else if (type.includes('datetime') || type.includes('timestamp')) {
                line += `timestamp('${col.name}')`;
            } else if (type.includes('date')) {
                line += `date('${col.name}')`;
            } else if (type.includes('decimal')) {
                const precision = type.match(/\((\d+),(\d+)\)/);
                if (precision) {
                    line += `decimal('${col.name}', ${precision[1]}, ${precision[2]})`;
                } else {
                    line += `decimal('${col.name}')`;
                }
            } else if (type.includes('json')) {
                line += `json('${col.name}')`;
            } else {
                line += `string('${col.name}') /* ${col.type} */`;
            }

            if (col.nullable) line += `->nullable()`;
            if (col.default !== null && col.default !== undefined) {
                if (col.default.toLowerCase() === 'current_timestamp') {
                    line += `->useCurrent()`;
                } else {
                    line += `->default('${col.default}')`;
                }
            }
            if (col.key === 'UNI') line += `->unique()`;
            
            lines.push(line + ';');
        });

        // Relations
        table.relations.forEach(rel => {
            lines.push(`            $table->foreign('${rel.column}')->references('${rel.referencedColumn}')->on('${rel.referencedTable}')->onDelete('cascade');`);
        });

        if (hasTimestamps) lines.push(`            $table->timestamps();`);
        if (hasSoftDeletes) lines.push(`            $table->softDeletes();`);

        lines.push(`        });`);
        lines.push(`    }`);
        lines.push(``);
        lines.push(`    /**`);
        lines.push(`     * Reverse the migrations.`);
        lines.push(`     */`);
        lines.push(`    public function down(): void`);
        lines.push(`    {`);
        lines.push(`        Schema::dropIfExists('${table.name}');`);
        lines.push(`    }`);
        lines.push(`};`);

        return lines.join('\n');
    },

    generateModel: (table: SchemaTable, namespace = 'App\\Models'): string => {
        const className = table.name.charAt(0).toUpperCase() + table.name.slice(1);
        const fillable = table.columns
            .filter(c => !c.extra?.includes('auto_increment') && !['created_at', 'updated_at', 'deleted_at'].includes(c.name))
            .map(c => `        '${c.name}'`);

        return `<?php

namespace ${namespace};

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class ${className} extends Model
{
    /** @use HasFactory<\\Database\\Factories\\${className}Factory> */
    use HasFactory;

    protected $table = '${table.name}';
    
    protected $fillable = [
${fillable.join(',\n')}
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
${table.columns.filter(c => c.type.includes('json') || c.type.includes('bool')).map(c => `            '${c.name}' => '${c.type.includes('json') ? 'array' : 'boolean'}',`).join('\n')}
        ];
    }

    // Relations
${table.relations.map(rel => {
    const relMethod = rel.referencedTable.charAt(0).toLowerCase() + rel.referencedTable.slice(1);
    const relClass = rel.referencedTable.charAt(0).toUpperCase() + rel.referencedTable.slice(1);
    return `
    public function ${relMethod}(): BelongsTo
    {
        return $this->belongsTo(${relClass}::class, '${rel.column}');
    }`;
}).join('\n')}
}`;
    }
};

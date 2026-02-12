import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { dbApi } from '@/api/db';

export function useDesignerData(currentDb: string | null) {
    // 1. Fetch Tables List
    const { data: tables, isLoading: loadingTables } = useQuery({
        queryKey: ['tables', currentDb],
        queryFn: () => dbApi.getTables(currentDb!),
        enabled: !!currentDb
    });

    // 2. Fetch Columns (Parallel) - Note: Bottleneck for large DBs
    const tableQueries = useQueries({
        queries: (tables || []).map(t => ({
            queryKey: ['columns', currentDb, t.name],
            queryFn: async () => {
                const res = await dbApi.executeQuery(currentDb!, `SHOW COLUMNS FROM \`${t.name}\``);
                return { 
                    table: t.name, 
                    columns: res[0].rows ? res[0].rows.map((r: any[]) => ({ 
                        Field: r[0], Type: r[1], Null: r[2], Key: r[3], Default: r[4], Extra: r[5] 
                    })) : [] 
                };
            },
            enabled: !!tables
        }))
    });

    // 3. Fetch Relations
    const { data: relations } = useQuery({
        queryKey: ['relations', currentDb],
        queryFn: async () => {
            const res = await dbApi.getRelations(currentDb!);
            return res.rows || [];
        },
        enabled: !!currentDb
    });

    const loadedSchemas = useMemo(() => {
        return tableQueries
            .filter(q => q.data)
            .map(q => q.data!);
    }, [tableQueries.map(q => q.data)]); // Stable dependency on data changes only

    return {
        tables,
        loadingTables,
        relations,
        loadedSchemas
    };
}

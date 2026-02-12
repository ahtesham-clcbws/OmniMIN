import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { InsertRowForm } from './InsertRowForm';
import { Loader2 } from 'lucide-react';

export function TableInsert() {
    const { dbName, tableName, serverId } = useParams();
    const navigate = useNavigate();

    // Fetch Columns
    const { data: columns, isLoading } = useQuery({
        queryKey: ['structure', dbName, tableName],
        queryFn: async () => {
            const res = await dbApi.executeQuery(dbName!, `DESCRIBE \`${tableName}\``);
            return res[0].rows.map((r: any[]) => ({
                Field: r[0],
                Type: r[1],
                Null: r[2],
                Key: r[3],
                Default: r[4],
                Extra: r[5]
            }));
        },
        enabled: !!dbName && !!tableName
    });

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (!columns) return <div className="p-8 text-center opacity-50">Failed to load table structure</div>;

    return (
        <div className="h-full p-4 overflow-hidden">
             <InsertRowForm 
                db={dbName!}
                table={tableName!}
                columns={columns}
                onSuccess={() => {
                     // Navigate back to browser (Browse) on success to confirm insertion
                     navigate(`/server/${serverId}/${dbName}/table/${tableName}`);
                }}
                onCancel={() => navigate(-1)}
             />
        </div>
    );
}

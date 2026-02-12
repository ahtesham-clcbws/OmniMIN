import React from 'react';
import { Outlet } from 'react-router-dom';
import { ViewTabs } from '../common/ViewTabs';

export function DatabaseLayout() {
    return (
        <div className="h-full flex flex-col bg-main text-text-main overflow-hidden">
            {/* secondary toolbar */}
            <ViewTabs />

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                <Outlet />
            </div>
        </div>
    );
}

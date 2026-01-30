import React from 'react';

export const CardSkeleton = () => (
    <div className="card bg-base-200 shadow-sm animate-pulse">
        <div className="card-body p-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-base-300" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-base-300 rounded w-3/4" />
                    <div className="h-3 bg-base-300 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-3 bg-base-300 rounded w-full" />
                <div className="h-3 bg-base-300 rounded w-5/6" />
                <div className="h-3 bg-base-300 rounded w-4/6" />
            </div>
            <div className="card-actions justify-end mt-4">
                <div className="h-8 bg-base-300 rounded w-24" />
                <div className="h-8 bg-base-300 rounded w-24" />
            </div>
        </div>
    </div>
);

export const DashboardCardSkeleton = () => (
    <div className="card bg-base-200 animate-pulse transition-all">
        <div className="card-body p-4">
            <div className="flex items-center gap-3">
                <div className="avatar">
                    <div className="w-12 h-12 rounded-full bg-base-300" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-base-300 rounded w-2/3" />
                    <div className="h-3 bg-base-300 rounded w-1/2" />
                </div>
            </div>
        </div>
    </div>
);

export const AnalysisSkeleton = () => (
    <div className="bg-base-300/30 p-4 rounded-xl border border-base-content/5 mt-4 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-4 bg-base-300 rounded w-32" />
                <div className="h-4 bg-base-300 rounded w-20" />
            </div>
            <div className="h-6 bg-base-300 rounded w-24" />
        </div>
        <div className="mt-4 space-y-3">
            <div className="h-3 bg-base-300 rounded w-full" />
            <div className="h-3 bg-base-300 rounded w-11/12" />
            <div className="h-3 bg-base-300 rounded w-4/5" />
        </div>
        <div className="mt-4 flex gap-2">
            <div className="h-5 bg-base-300 rounded-full w-24" />
            <div className="h-5 bg-base-300 rounded-full w-32" />
        </div>
    </div>
);

export const MemberCardSkeleton = () => (
    <div className="bg-base-200 p-4 rounded-xl animate-pulse">
        <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-base-300" />
            <div className="h-5 bg-base-300 rounded w-2/3" />
            <div className="h-4 bg-base-300 rounded w-1/2" />
            <div className="h-8 bg-base-300 rounded w-full mt-2" />
        </div>
    </div>
);

export const ListSkeleton = () => (
    <div className="card bg-base-200 shadow-sm animate-pulse mb-3">
        <div className="card-body p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-base-300 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-base-300 rounded w-1/3" />
                        <div className="flex gap-2">
                            <div className="h-3 bg-base-300 rounded w-20" />
                            <div className="h-3 bg-base-300 rounded w-20" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="h-8 bg-base-300 rounded w-full sm:w-20" />
                    <div className="h-8 bg-base-300 rounded w-full sm:w-20" />
                </div>
            </div>
        </div>
    </div>
);

import React from 'react';

interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
}

export function Table<T extends { id: string }>({
    columns,
    data,
    onRowClick,
    emptyMessage = 'No data available',
}: TableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-text-secondary">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} className={column.className}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr
                            key={row.id}
                            onClick={() => onRowClick?.(row)}
                            className={onRowClick ? 'cursor-pointer' : ''}
                        >
                            {columns.map((column) => (
                                <td key={column.key} className={column.className}>
                                    {column.render
                                        ? column.render(row)
                                        : (row as Record<string, unknown>)[column.key]?.toString()}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
}: PaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="pagination">
            <span className="pagination-info">
                Showing {startItem} to {endItem} of {totalItems} results
            </span>
            <div className="pagination-buttons">
                <button
                    className="btn btn-secondary"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    Previous
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

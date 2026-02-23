
import { useState, useMemo } from 'react';

interface UsePaginationProps {
  data: any[];
  pageSize: number;
  initialPage?: number;
}

export function usePagination<T>({ data, pageSize, initialPage = 1 }: UsePaginationProps & { data: T[] }) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const previousPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    totalItems: data.length,
    pageSize,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, data.length)
  };
}

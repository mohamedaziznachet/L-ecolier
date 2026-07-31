import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}) => {
  if (totalPages <= 1) return null;

  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const fetchPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 5;

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, '...', ...middleRange, '...', totalPages];
    }

    return [];
  };

  const pageNumbers = fetchPageNumbers();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--a-text-muted)' }}>
        Page <strong style={{ color: 'var(--a-text-bright)' }}>{currentPage}</strong> sur <strong style={{ color: 'var(--a-text-bright)' }}>{totalPages}</strong>
      </span>
      
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="a-btn a-btn-ghost a-btn-sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ padding: '6px 8px' }}
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span
                key={`dots-${idx}`}
                style={{ padding: '6px 10px', fontSize: '0.85rem', color: 'var(--a-text-muted)' }}
              >
                &#8230;
              </span>
            );
          }

          const isActive = pageNum === currentPage;
          return (
            <button
              key={`page-${pageNum}`}
              className={`a-btn ${isActive ? 'a-btn-primary' : 'a-btn-ghost'} a-btn-sm`}
              onClick={() => onPageChange(Number(pageNum))}
              style={{ minWidth: 32, height: 32, padding: 0 }}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          className="a-btn a-btn-ghost a-btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ padding: '6px 8px' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

import { createFileRoute } from '@tanstack/react-router';
import MemoryPage from '@/features/memory/MemoryPage';

export const Route = createFileRoute('/_appMainLayout/memory')({
  component: MemoryPage,
});

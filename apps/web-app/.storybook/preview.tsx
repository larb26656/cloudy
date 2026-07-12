import type { Preview } from '@storybook/react';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { Toaster } from '../src/components/ui/sonner';
import '../src/index.css';

const queryClient = new QueryClient();

const preview: Preview = {
  decorators: [
    (Story) => (
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Story />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </StrictMode>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;

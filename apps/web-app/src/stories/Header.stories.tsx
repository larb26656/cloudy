import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header } from './Header';

const meta = {
  title: 'Example/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: {
    title: 'My Page Title',
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'My Page Title',
    subtitle: '/path/to/directory',
  },
};

export const WithCenterSlot: Story = {
  args: {
    centerSlot: (
      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
    ),
  },
};

export const WithRightSlot: Story = {
  args: {
    rightSlot: (
      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
        New Item
      </button>
    ),
  },
};

export const HideControls: Story = {
  args: {
    showRefresh: false,
    showThemeToggle: false,
  },
};

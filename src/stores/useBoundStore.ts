import { create } from 'zustand';
import { createUISlice } from './slices/createUISlice';
import type { UISlice } from './slices/createUISlice';
import { createSessionSlice } from './slices/createSessionSlice';
import type { SessionSlice } from './slices/createSessionSlice';
import { createMessageSlice } from './slices/createMessageSlice';
import type { MessageSlice } from './slices/createMessageSlice';

export type RootState = UISlice & SessionSlice & MessageSlice;

export const useBoundStore = create<RootState>((set, get) => ({
  ...createUISlice(set, get),
  ...createSessionSlice(set, get),
  ...createMessageSlice(set, get),
}));

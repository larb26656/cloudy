import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Instance = {
  id: string;
  name: string;
  endpoint: string;
  createdAt: number;
};

type InstanceStore = {
  instances: Instance[];
  addInstance: (instance: Omit<Instance, "id" | "createdAt">) => Instance;
  removeInstance: (id: string) => void;
  updateInstance: (id: string, updates: Partial<Omit<Instance, "id" | "createdAt">>) => void;
  getInstance: (id: string) => Instance | undefined;
};

const generateId = () => crypto.randomUUID();

export const useInstanceStore = create<InstanceStore>()(
  persist(
    (set, get) => ({
      instances: [],

      addInstance: (data) => {
        const instance: Instance = {
          ...data,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((state) => ({
          instances: [...state.instances, instance],
        }));
        return instance;
      },

      removeInstance: (id) => {
        set((state) => {
          const newInstances = state.instances.filter((i) => i.id !== id);
          return {
            instances: newInstances,
          };
        });
      },

      updateInstance: (id, updates) => {
        set((state) => ({
          instances: state.instances.map((i) =>
            i.id === id ? { ...i, ...updates } : i,
          ),
        }));
      },

      getInstance: (id) => {
        const { instances } = get();
        return instances.find((i) => i.id === id);
      },
    }),
    {
      name: "cloudy-instances",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
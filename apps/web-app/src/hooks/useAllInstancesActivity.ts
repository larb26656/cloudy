import { useState, useEffect } from "react";
import { useInstanceStore } from "@/stores/instanceStore";
import { getStore } from "@/stores/instance";
import type { InstanceActivityStore } from "@/stores/instance/instanceActivityStore";

export type InstanceActivityData = {
    instanceId: string;
    name: string;
    isHealthy: boolean;
    isBusy: boolean;
    activeAgents: string[];
    currentActivity: InstanceActivityStore["currentActivity"];
};

export function useAllInstancesActivity(): InstanceActivityData[] {
    const instances = useInstanceStore((state) => state.instances);

    const [activities, setActivities] = useState<InstanceActivityData[]>(() =>
        instances.map((i) => ({
            instanceId: i.id,
            name: i.name,
            isHealthy: false,
            isBusy: false,
            activeAgents: [],
            currentActivity: null,
        }))
    );

    useEffect(() => {
        const unsubscribers: (() => void)[] = [];

        instances.forEach((instance, index) => {
            const store = getStore("activity", instance.id);
            unsubscribers.push(
                store.subscribe((state) => {
                    setActivities((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                            instanceId: instance.id,
                            name: instance.name,
                            isHealthy: state.isHealthy,
                            isBusy: state.isBusy,
                            activeAgents: state.activeAgents,
                            currentActivity: state.currentActivity,
                        };
                        return updated;
                    });
                })
            );
        });

        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [instances]);

    return activities;
}

import { Activity, Circle, Bot, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout";
import { useAllInstancesActivity } from "@/hooks/useAllInstancesActivity";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const instances = useAllInstancesActivity();

    return (
        <div className="flex flex-col h-full">
            <Header title="Dashboard" subtitle="All instances overview" />

            <div className="flex-1 overflow-auto p-4">
                {instances.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {instances.map((instance) => (
                            <InstanceCard key={instance.instanceId} instance={instance} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Activity className="size-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No instances connected</h3>
            <p className="text-sm text-muted-foreground mt-1">
                Add an instance from settings to start monitoring
            </p>
        </div>
    );
}

interface InstanceCardProps {
    instance: {
        instanceId: string;
        name: string;
        isHealthy: boolean;
        isBusy: boolean;
        activeAgents: string[];
        currentActivity: {
            sessionId: string;
            agentName: string;
            description: string;
        } | null;
    };
}

function InstanceCard({ instance }: InstanceCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 truncate">
                    <div
                        className={cn(
                            "size-2 rounded-full shrink-0",
                            instance.isHealthy ? "bg-green-500" : "bg-red-500"
                        )}
                    />
                    <span className="truncate">{instance.name}</span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <Circle
                        className={cn(
                            "size-3",
                            instance.isBusy ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                        )}
                    />
                    <span className="text-muted-foreground">
                        {instance.isBusy ? "Busy" : "Idle"}
                    </span>
                </div>

                <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Bot className="size-3" />
                        <span>Active Agents</span>
                    </div>
                    {instance.activeAgents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None</p>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {instance.activeAgents.map((agent) => (
                                <Badge key={agent} variant="secondary" className="text-xs">
                                    {agent}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Clock className="size-3" />
                        <span>Current Activity</span>
                    </div>
                    {instance.currentActivity ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-xs">
                                    {instance.currentActivity.agentName}
                                </Badge>
                            </div>
                            <p className="text-xs line-clamp-2">{instance.currentActivity.description}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">No activity</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

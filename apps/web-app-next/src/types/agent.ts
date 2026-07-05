export interface Agent {
    name: string;
    description?: string;
    mode: 'subagent' | 'primary' | 'all';
    native?: boolean;
    hidden?: boolean;
}

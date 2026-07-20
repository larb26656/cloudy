import type { CloudyConfig } from './config';
import { ProxyService } from './features/proxy/service';

export let proxyService: ProxyService;

export function initContainer(config: CloudyConfig) {
    proxyService = new ProxyService(config.opencodeApiBase);
}

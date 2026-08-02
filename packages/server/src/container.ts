import type { CloudyConfig } from './config';
import { ProxyService } from './features/proxy/service';
import { PtyRepository } from './features/pty/repository';
import { PtyService } from './features/pty/service';

export let proxyService: ProxyService;
export let ptyService: PtyService;

export function initContainer(config: CloudyConfig) {
    proxyService = new ProxyService(config.opencodeApiBase);
    const ptyRepository = new PtyRepository();
    ptyService = new PtyService(ptyRepository);
}

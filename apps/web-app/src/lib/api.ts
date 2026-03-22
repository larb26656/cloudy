import {
    treaty
} from '@elysiajs/eden'
import type { App } from "@cloudy/contracts";

export const api = treaty<App>('localhost:3001')
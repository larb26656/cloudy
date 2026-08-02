import { describe, it, expect } from 'vitest';
import { toDateString } from './date.utils';


describe('toDateString', () => {
    it('should convert Date to ISO string', () => {
        const date = new Date('2024-01-01T00:00:00.000Z');
        expect(toDateString(date)).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should convert string to string', () => {
        expect(toDateString('hello')).toBe('hello');
    });

    it('should convert number to string', () => {
        expect(toDateString(123)).toBe('123');
    });

    it('should convert null to string', () => {
        expect(toDateString(null)).toBe('null');
    });

    it('should convert undefined to string', () => {
        expect(toDateString(undefined)).toBe('undefined');
    });

    it('should convert object to string', () => {
        expect(toDateString({ key: 'value' })).toBe('[object Object]');
    });
});
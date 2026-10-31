import { describe, it, expect } from 'vitest';
import { cleanList } from './lists';

describe('cleanList', () => {
  it('keeps a clean array', () => {
    expect(cleanList(['Apple CarPlay', 'Bluetooth'])).toEqual(['Apple CarPlay', 'Bluetooth']);
  });
  it('repairs a JSON array split across items', () => {
    expect(cleanList(['["Armored"', '"Chauffeur Included"', '"Wi-Fi"]'])).toEqual(['Armored', 'Chauffeur Included', 'Wi-Fi']);
  });
  it('splits a single bracketed string', () => {
    expect(cleanList(['[wifi, swimming pool]'])).toEqual(['wifi', 'swimming pool']);
  });
  it('handles a plain comma string and empty values', () => {
    expect(cleanList('Gym, Pool')).toEqual(['Gym', 'Pool']);
    expect(cleanList(null)).toEqual([]);
    expect(cleanList(['', '  '])).toEqual([]);
  });
  it('drops duplicates ignoring case', () => {
    expect(cleanList(['Wifi', 'wifi'])).toEqual(['Wifi']);
  });
  it('keeps a feature that contains a slash', () => {
    expect(cleanList(['Armored / Bulletproof'])).toEqual(['Armored / Bulletproof']);
  });
});

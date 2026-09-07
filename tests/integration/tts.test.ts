import { describe, it, expect } from 'vitest';
import { textToIPA } from '@/lib/tts/ewe_rules';
import text2wav from 'text2wav';

describe('TTS Engine Integration Test', () => {
  it('converts Ewe sentences to valid IPA phonemes', async () => {
    const text = 'Woezo loo, miawoe do!';
    const ipa = await textToIPA(text);

    expect(ipa).toBeDefined();
    expect(typeof ipa).toBe('string');
    expect(ipa.length).toBeGreaterThan(0);
  });

  it('synthesizes Ewe phonemes into a valid WAV buffer with RIFF header', async () => {
    const ipaString = await textToIPA('Ndi na mi');
    const audioBuffer: Uint8Array = await text2wav(ipaString, { voice: 'fr' });

    expect(audioBuffer).toBeDefined();
    expect(audioBuffer.length).toBeGreaterThan(44);

    const headerRiff = String.fromCharCode(...audioBuffer.slice(0, 4));
    const headerWave = String.fromCharCode(...audioBuffer.slice(8, 12));

    expect(headerRiff).toBe('RIFF');
    expect(headerWave).toBe('WAVE');
  });
});

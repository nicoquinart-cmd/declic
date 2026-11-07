export function splitSpeech(text, maxLength = 300) {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*\s*/g) || [];
  const chunks = [];
  for (const sentence of sentences) {
    let chunk = '';
    for (const word of sentence.trim().split(/\s+/)) {
      if (chunk && chunk.length + word.length + 1 > maxLength) { chunks.push(chunk); chunk = ''; }
      chunk += (chunk ? ' ' : '') + word;
    }
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

export function encodeWav(segments, sampleRate) {
  const pause = Math.floor(sampleRate * 0.12);
  const samples = segments.reduce((n, segment) => n + segment.length, 0) + pause * Math.max(0, segments.length - 1);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const write = (offset, text) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); write(8, 'WAVE');
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, samples * 2, true);
  let offset = 44;
  segments.forEach((segment, index) => {
    if (index) offset += pause * 2;
    for (const sample of segment) {
      const value = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, Math.round(value * (value < 0 ? 32768 : 32767)), true); offset += 2;
    }
  });
  return buffer;
}

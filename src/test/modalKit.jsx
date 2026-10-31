import { vi } from 'vitest';
import { fireEvent } from '@testing-library/react';

// Predictable preview URLs so DOM snapshots are stable.
export function mockObjectUrls() {
  URL.createObjectURL = vi.fn((file) => `blob:${file?.name ?? 'file'}`);
  URL.revokeObjectURL = vi.fn();
  return () => {};
}

export const pngFile = (name = 'photo.png') => new File(['x'], name, { type: 'image/png' });
export const mp4File = (name = 'tour.mp4', size = 10) => {
  const f = new File(['x'], name, { type: 'video/mp4' });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

export function pickFiles(input, files) {
  fireEvent.change(input, { target: { files } });
}

export const fileInputs = (container) => [...container.querySelectorAll('input[type="file"]')];
export const imageInput = (container) => fileInputs(container).find((i) => /image/.test(i.getAttribute('accept') || ''));
export const videoInput = (container) => fileInputs(container).find((i) => /video/.test(i.getAttribute('accept') || ''));

// FormData entries as a plain object of arrays, so payload shapes can be asserted.
export function formEntries(fd) {
  const out = {};
  for (const [k, v] of fd.entries()) {
    (out[k] ||= []).push(v instanceof File ? `file:${v.name}` : String(v));
  }
  return out;
}

// Labels in these forms are not linked to their controls, so find the control that sits next to the label text.
export function control(container, labelText) {
  const label = [...container.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(labelText));
  if (!label) throw new Error(`No label starting with "${labelText}"`);
  return label.parentElement.querySelector('input, select, textarea');
}

export function setValue(el, value) {
  fireEvent.change(el, { target: { value } });
}

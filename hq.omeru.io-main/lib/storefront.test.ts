import {
  waStoreLink,
  waProductLink,
  waServiceLink,
  waServicesListLink,
  displayableImage,
  formatZAR,
  formatDuration,
  WA_NUMBER,
} from './storefront';

describe('waStoreLink', () => {
  it('encodes @handle as bot text', () => {
    const url = waStoreLink('kfc');
    expect(url).toContain(`wa.me/${WA_NUMBER}`);
    expect(url).toContain(encodeURIComponent('@kfc'));
  });
});

describe('waProductLink', () => {
  it('encodes prod_ prefix', () => {
    const url = waProductLink('abc123');
    expect(url).toContain(encodeURIComponent('prod_abc123'));
  });
});

describe('waServiceLink', () => {
  it('encodes cbk_svc_ prefix', () => {
    const url = waServiceLink('svc-99');
    expect(url).toContain(encodeURIComponent('cbk_svc_svc-99'));
  });
});

describe('waServicesListLink', () => {
  it('encodes c_book_ prefix', () => {
    const url = waServicesListLink('m-42');
    expect(url).toContain(encodeURIComponent('c_book_m-42'));
  });
});

describe('displayableImage', () => {
  it('returns null for non-https URLs', () => {
    expect(displayableImage('http://example.com/img.jpg')).toBeNull();
    expect(displayableImage('media_id_abc123')).toBeNull();
    expect(displayableImage(null)).toBeNull();
    expect(displayableImage(undefined)).toBeNull();
  });

  it('passes through valid https URLs', () => {
    const url = 'https://cdn.example.com/img.jpg';
    expect(displayableImage(url)).toBe(url);
  });
});

describe('formatZAR', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatZAR(100)).toMatch(/100/);
    expect(formatZAR(100)).toMatch(/R/);
  });

  it('formats zero', () => {
    expect(formatZAR(0)).toMatch(/R.*0/);
  });
});

describe('formatDuration', () => {
  it('formats minutes under an hour', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formats exact hours', () => {
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(120)).toBe('2 hr');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1 hr 30 min');
    expect(formatDuration(75)).toBe('1 hr 15 min');
  });
});

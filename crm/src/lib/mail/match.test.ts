import { describe, expect, it } from 'vitest';

import { buildIndex, matchMessage, type ParsedMessage } from './match.ts';
import {
  canonicalize,
  domainFromUrl,
  isFreeProvider,
  parseAddress,
  parseAddressList,
  shouldSkip,
} from './normalize.ts';

const SELF = 'damon@panta.llc';

const index = buildIndex({
  contacts: [
    { id: 'contact-sarah', clientId: 'client-delta', email: 'sarah@deltabayimpact.org' },
    { id: 'contact-ray', clientId: 'client-indigena', email: 'ray+crm@indigena.example' },
    { id: 'contact-personal', clientId: 'client-indigena', email: 'RayAtHome@Gmail.com' },
  ],
  clients: [
    { id: 'client-delta', domains: ['deltabayimpact.org'] },
    { id: 'client-indigena', domains: ['indigena.example'] },
    // A client whose "domain" is a free provider. Must never be matched on.
    { id: 'client-careless', domains: ['gmail.com'] },
  ],
  selfAddresses: [SELF],
});

function msg(over: Partial<ParsedMessage> = {}): ParsedMessage {
  return {
    id: 'm1',
    threadId: 't1',
    from: parseAddress('Sarah <sarah@deltabayimpact.org>'),
    to: parseAddressList(SELF),
    cc: [],
    subject: 'Re: the readout',
    snippet: 'Thanks for this…',
    occurredAt: new Date('2026-08-10T12:00:00Z'),
    ...over,
  };
}

describe('address parsing', () => {
  it('reads a display name and address', () => {
    expect(parseAddress('Sarah Okafor <Sarah@Example.ORG>')).toEqual({
      name: 'Sarah Okafor',
      email: 'sarah@example.org',
      domain: 'example.org',
    });
  });

  it('reads a bare address', () => {
    expect(parseAddress('a@b.com')?.email).toBe('a@b.com');
  });

  it('does not split a quoted display name containing a comma', () => {
    const list = parseAddressList('"Okafor, Sarah" <s@a.com>, ray@b.com');
    expect(list.map((a) => a.email)).toEqual(['s@a.com', 'ray@b.com']);
  });

  it('rejects things that are not addresses', () => {
    expect(parseAddress('undisclosed recipients')).toBeNull();
    expect(parseAddress('')).toBeNull();
  });
});

describe('canonicalization', () => {
  it('strips +tags', () => {
    expect(canonicalize('ray+crm@indigena.example')).toBe('ray@indigena.example');
  });

  it('strips dots for Gmail, which treats them as identical', () => {
    expect(canonicalize('d.a.mon@gmail.com')).toBe('damon@gmail.com');
  });

  it('keeps dots everywhere else, where they are significant', () => {
    expect(canonicalize('first.last@panta.llc')).toBe('first.last@panta.llc');
  });
});

describe('the free-provider blocklist', () => {
  it('covers the common ones', () => {
    for (const d of ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'proton.me']) {
      expect(isFreeProvider(d)).toBe(true);
    }
  });

  it('does not cover a real organisation', () => {
    expect(isFreeProvider('deltabayimpact.org')).toBe(false);
  });

  it('never lets a free provider become a matchable client domain', () => {
    // client-careless registered gmail.com; a stranger's Gmail must not match.
    const result = matchMessage(
      msg({ from: parseAddress('stranger@gmail.com') }),
      index,
    );
    expect(result.kind).toBe('none');
  });

  it('refuses to derive a matchable domain from a free-provider URL', () => {
    expect(domainFromUrl('https://gmail.com')).toBeNull();
    expect(domainFromUrl('https://www.deltabayimpact.org/donate')).toBe('deltabayimpact.org');
  });
});

describe('matching', () => {
  it('files an exact contact match', () => {
    const r = matchMessage(msg(), index);
    expect(r).toMatchObject({ kind: 'contact', clientId: 'client-delta', direction: 'in' });
  });

  it('matches a contact through a +tag', () => {
    const r = matchMessage(msg({ from: parseAddress('ray@indigena.example') }), index);
    expect(r).toMatchObject({ kind: 'contact', contactId: 'contact-ray' });
  });

  it('marks a message you sent as outbound and still finds the client', () => {
    const r = matchMessage(
      msg({
        from: parseAddress(SELF),
        to: parseAddressList('sarah@deltabayimpact.org'),
      }),
      index,
    );
    expect(r).toMatchObject({ kind: 'contact', clientId: 'client-delta', direction: 'out' });
  });

  it('queues an unknown address on a known domain rather than filing it', () => {
    const r = matchMessage(
      msg({ from: parseAddress('newperson@deltabayimpact.org') }),
      index,
    );
    expect(r.kind).toBe('domain');
    if (r.kind === 'domain') expect(r.clientId).toBe('client-delta');
  });

  it('prefers an exact contact over a domain match', () => {
    const r = matchMessage(
      msg({
        from: parseAddress('someoneelse@deltabayimpact.org'),
        to: parseAddressList(`${SELF}, sarah@deltabayimpact.org`),
      }),
      index,
    );
    // From is inbound so the sender is the counterparty — domain match wins
    // here, but the client is still right.
    expect(r.kind).toBe('domain');
  });

  it('ignores a message with no known counterparty', () => {
    expect(matchMessage(msg({ from: parseAddress('random@nowhere.test') }), index).kind).toBe(
      'none',
    );
  });

  it('ignores a note from you to yourself', () => {
    const r = matchMessage(
      msg({ from: parseAddress(SELF), to: parseAddressList(SELF), cc: [] }),
      index,
    );
    expect(r.kind).toBe('none');
  });
});

describe('skip rules', () => {
  const from = parseAddress('sarah@deltabayimpact.org');

  it.each([
    ['spam', { labelIds: ['SPAM'], from, headers: {} }],
    ['trash', { labelIds: ['TRASH'], from, headers: {} }],
    ['draft', { labelIds: ['DRAFT'], from, headers: {} }],
    ['bulk', { from, headers: { 'list-unsubscribe': '<https://x/y>' } }],
    ['bulk', { from, headers: { 'list-id': 'news.example' } }],
    ['auto', { from, headers: { 'auto-submitted': 'auto-generated' } }],
    ['noreply', { from: parseAddress('no-reply@deltabayimpact.org'), headers: {} }],
  ])('skips %s', (reason, input) => {
    expect(shouldSkip(input as never)).toBe(reason);
  });

  it('keeps an ordinary message from a person', () => {
    expect(shouldSkip({ from, headers: {} })).toBeNull();
  });
});

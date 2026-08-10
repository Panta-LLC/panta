import { eq } from 'drizzle-orm';

import { db } from '../client.ts';
import { clients, instruments, pulseChecks, readouts } from '../schema.ts';
import type { InstrumentDefinition } from '../../instrument/types.ts';
import type { Observation } from '../../readout/lint.ts';

export async function getReadout(pulseCheckId: string) {
  const rows = await db
    .select({
      readout: readouts,
      pulse: pulseChecks,
      client: clients,
      definition: instruments.definition,
    })
    .from(readouts)
    .innerJoin(pulseChecks, eq(readouts.pulseCheckId, pulseChecks.id))
    .innerJoin(clients, eq(pulseChecks.clientId, clients.id))
    .innerJoin(instruments, eq(pulseChecks.instrumentId, instruments.id))
    .where(eq(readouts.pulseCheckId, pulseCheckId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return { ...row, definition: row.definition as InstrumentDefinition };
}

export async function saveReadout(
  pulseCheckId: string,
  values: {
    observations?: Observation[];
    recWhat?: string | null;
    recWhyFirst?: string | null;
    recEffort?: string | null;
    recMode?: string | null;
    didntCover?: string | null;
    ladderRule?: number | null;
    ladderRationale?: string | null;
    quotesUsed?: string[];
    lintState?: unknown;
    charCount?: number;
  },
) {
  const rows = await db
    .update(readouts)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(readouts.pulseCheckId, pulseCheckId))
    .returning({ updatedAt: readouts.updatedAt });

  return rows[0] ?? null;
}

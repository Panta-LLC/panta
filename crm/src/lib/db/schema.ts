/**
 * The whole CRM schema, all phases, defined up front.
 *
 * Phases 2 and 3 tables are declared here even though nothing reads them yet,
 * for one specific reason: `interactions` must exist from day one so Phase 1
 * can write `pulse_check` and `readout_sent` rows into it as they happen. When
 * the timeline UI ships in Phase 2 it then has real history instead of
 * starting empty. Adding the table later would mean a timeline that begins the
 * day the feature shipped, which is the wrong shape for a record of a
 * relationship.
 *
 * ⚠ There is deliberately no score, grade, rating, tier, or health-index
 * column anywhere in this file — see the note on `pulseChecks`.
 */
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  smallint,
  timestamp,
  jsonb,
  inet,
  bytea,
  index,
  uniqueIndex,
  sql,
} from './pg.ts';

// ══════════════════════════════ AUTH ══════════════════════════════

export const appUser = pgTable(
  'app_user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    /** Google's stable subject id. Survives the user changing their email. */
    googleSub: text('google_sub').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('app_user_email_key').on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  'sessions',
  {
    /**
     * SHA-256 hex of the cookie token — NOT the token itself.
     *
     * The cookie holds 32 random bytes; only its hash is stored. A database
     * dump, a leaked backup, or a stray `select * from sessions` therefore
     * yields nothing that can be replayed as a login.
     */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: text('user_agent'),
    ip: inet('ip'),
  },
  (t) => [
    index('sessions_user_idx').on(t.userId),
    index('sessions_expiry_idx').on(t.expiresAt),
  ],
);

// ══════════════════════════════ CRM CORE ══════════════════════════════

/**
 * `sector` mirrors the value list in studio/schemaTypes/client.ts so the two
 * records describe an organization the same way — plus `ecommerce`, which the
 * service definition treats as a distinct segment but the marketing schema
 * never needed. These values drive conditional-module *suggestions* in the
 * wizard; they never enable a module on their own.
 */
export const CLIENT_SECTORS = [
  'nonprofit',
  'independent_practice',
  'small_business',
  'community_org',
  'public_agency',
  'ecommerce',
  'other',
] as const;

export const CLIENT_STATUSES = [
  'lead',
  'pulse_scheduled',
  'pulse_done',
  'readout_sent',
  'proposal',
  'active',
  'dormant',
  'declined',
] as const;

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    sector: text('sector'),
    /** NULL is meaningful — it suggests the "no website yet" module. */
    websiteUrl: text('website_url'),
    /** Derived from websiteUrl and contact addresses. Gmail matching, Phase 3b. */
    domains: text('domains').array().notNull().default(sql`'{}'`),
    city: text('city'),
    state: text('state'),
    status: text('status').notNull().default('lead'),
    source: text('source'),
    /**
     * Soft link to studio/schemaTypes/client.ts. ONE-WAY, display-only, set by
     * hand. Never synced: the Sanity record is the *marketing* record, gated on
     * `logoApproved` and only created once a logo may be shown publicly. This
     * record exists the moment someone books a call. Syncing them is how a
     * wrong name or an uncleared logo ends up on panta.llc.
     */
    sanityClientId: text('sanity_client_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('clients_status_idx').on(t.status)],
);

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Stored lowercased with +tags stripped — see lib/mail/normalize.ts. */
    email: text('email'),
    phone: text('phone'),
    role: text('role'),
    isPrimary: boolean('is_primary').notNull().default(false),
    /** Populated from Q22 ("does anyone else have to say yes?"). */
    isDecisionMaker: boolean('is_decision_maker').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('contacts_client_idx').on(t.clientId),
    /**
     * Globally unique, not per-client, so Gmail matching is unambiguous — an
     * address maps to exactly one contact or none. Tradeoff: a consultant who
     * works for two of your clients needs two rows with different addresses.
     * At this scale that is a fine trade for never guessing whose timeline a
     * message belongs on.
     */
    uniqueIndex('contacts_email_key')
      .on(sql`lower(${t.email})`)
      .where(sql`${t.email} is not null`),
  ],
);

// ══════════════════════════ THE INSTRUMENT ══════════════════════════

/**
 * The Pulse Check questionnaire, stored as versioned data rather than as code
 * or columns.
 *
 * pulse-check-questionnaire.md is marked "Working draft v0.1" — it will change
 * once it has been run on real calls. If the 22 questions were columns, every
 * revision would be a migration and old interviews would stop rendering under
 * the instrument they were actually conducted with. Instead each pulse_check
 * PINS an instrument row, so revising the questionnaire is an insert, and a
 * two-year-old interview still renders exactly as it was asked.
 */
export const instruments = pgTable(
  'instruments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    version: integer('version').notNull(),
    label: text('label').notNull(),
    definition: jsonb('definition').notNull(),
    isCurrent: boolean('is_current').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('instruments_key_version_key').on(t.key, t.version),
    uniqueIndex('instruments_current_idx').on(t.key).where(sql`${t.isCurrent}`),
  ],
);

// ══════════════════════════ PULSE CHECKS ══════════════════════════

export const PULSE_STATUSES = [
  'scheduled',
  'prepped',
  'in_call',
  'captured',
  'readout_drafted',
  'readout_sent',
  'abandoned',
] as const;

export const CAPACITIES = ['under_1h', '1_3h', '3_plus', 'none_done_for_us'] as const;

// ── funnel: the sales side ────────────────────────────────────────────────
// Analytics stops at the booking. Everything past it is asked on the call and
// typed in here, per §3 of docs/FUNNEL-MEASUREMENT.md.

/**
 * Where the booking came from, normalized. The verbatim answer is kept
 * alongside in `sourceVerbatim` and is the more valuable of the two — this
 * column exists only so the dashboard's Awareness row can be counted, and
 * categorizing is a lossy act done afterward, never instead.
 *
 * `unknown` is a real, expected value, not a failure: it means the question
 * was asked and the answer didn't resolve. It is distinct from NULL, which
 * means it wasn't asked.
 */
export const SOURCE_CATEGORIES = [
  'referral',
  'search',
  'google_business_profile',
  'social',
  'newsletter',
  'pulse_article',
  'outreach',
  'repeat_client',
  'event',
  'unknown',
] as const;

/**
 * Where the Pulse Check ended up commercially.
 *
 * NOT a grade and not an ordering — it is the state of one conversation, and
 * `closed_lost` is a fact about fit and timing rather than a mark against the
 * client. Read the note at the bottom of this table before adding anything
 * that summarizes these into a number.
 *
 * NULL means the call hasn't happened or hasn't resolved yet. `no_show` is
 * separate from an abandoned pulse check (`status`) because the funnel's show
 * rate needs a booking that was never held to still be a booking.
 *
 * These are terminal states, and the boundary that matters is whether a
 * proposal went out: a call that ended without one is `held_no_proposal` even
 * if it is plainly never happening, and `closed_lost` means a proposal was
 * sent and not taken. Blur that and the proposal→close ratio — the one that
 * says whether the pricing is wrong — stops meaning anything.
 */
export const SALES_OUTCOMES = [
  'no_show',
  'held_no_proposal',
  'proposal_sent',
  'closed_won',
  'closed_lost',
] as const;

export const pulseChecks = pgTable(
  'pulse_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    /** Pinned at creation. Never updated — that is the whole point. */
    instrumentId: uuid('instrument_id')
      .notNull()
      .references(() => instruments.id),
    status: text('status').notNull().default('scheduled'),
    /** Practice runs stay off the dashboard and out of any counts. */
    isRehearsal: boolean('is_rehearsal').notNull().default(false),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    prepCompletedAt: timestamp('prep_completed_at', { withTimezone: true }),
    /** The only source of truth for elapsed time. Set server-side on start. */
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    /**
     * The public promise on /consultation/ is "within 48 hours".
     *
     * This wants to be a generated column, and cannot be: Postgres rejects
     * `ended_at + interval '48 hours'` as a generation expression because
     * timestamptz + interval is only STABLE, not IMMUTABLE (the result depends
     * on the session TimeZone for DST boundaries). Instead it is written in
     * the same UPDATE that sets ended_at — see api/pulse/[id]/end.ts — so the
     * two can never drift apart even though the database is not enforcing it.
     */
    readoutDueAt: timestamp('readout_due_at', { withTimezone: true }),

    modulesEnabled: text('modules_enabled').array().notNull().default(sql`'{}'`),

    /** Pre-call checklist + the five-second read. Keyed by prep field key. */
    prep: jsonb('prep').notNull().default(sql`'{}'::jsonb`),
    /**
     * Flat map of {questionKey: {v, at}}. Flat on purpose: it makes the
     * autosave a single `answers || $patch::jsonb` shallow merge, so two
     * in-flight patches touching different questions both survive with no
     * read-modify-write and no lost updates.
     */
    answers: jsonb('answers').notNull().default(sql`'{}'::jsonb`),
    /** {trackTwoKey: {checked, note}} — the "looking while they talk" track. */
    trackTwo: jsonb('track_two').notNull().default(sql`'{}'::jsonb`),
    /** Bumped by every accepted autosave patch; the client acks against it. */
    rev: integer('rev').notNull().default(0),

    // ── capture sheet ──────────────────────────────────────────────────────
    // Promoted out of `answers` into real columns because these are the fields
    // the readout reads, the priority ladder reasons over, and the only ones
    // you would ever query ACROSS pulse checks. Everything else stays JSONB.
    triggerText: text('trigger_text'),
    goalInTheirWords: text('goal_in_their_words'),
    fiveSecondRead: text('five_second_read'),
    /**
     * Set when the call starts, after which fiveSecondRead is read-only.
     * Its entire value is that it was written before the answer was known; an
     * editable field would decay into post-hoc rationalization within three
     * calls.
     */
    fiveSecondReadLockedAt: timestamp('five_second_read_locked_at', { withTimezone: true }),
    whatTheyActuallyDo: text('what_they_actually_do'),
    findNoticed: text('find_noticed'),
    trustNoticed: text('trust_noticed'),
    chooseNoticed: text('choose_noticed'),
    stepsToContact: smallint('steps_to_contact'),
    honestReplyTime: text('honest_reply_time'),
    /** NULL or empty means none. A locked asset usually IS the recommendation. */
    lockedAssets: text('locked_assets'),
    capacity: text('capacity'),
    decisionMaker: text('decision_maker'),
    oneThingSaidOutLoud: text('one_thing_said_out_loud'),
    planShapedNotAnswered: text('plan_shaped_not_answered'),

    // ── funnel: the sales side ─────────────────────────────────────────────
    // §3 of docs/FUNNEL-MEASUREMENT.md. These close the loop that Plausible
    // cannot: the site can see a booking CTA get clicked, and nothing after.
    //
    // They live on the pulse check rather than on the client because the unit
    // of the funnel is one booking. A client who books twice a year apart came
    // from two different places for two different reasons, and `clients.source`
    // — which records how the *relationship* started — would flatten that into
    // whichever answer was given first.

    /**
     * When the booking was made, as against `scheduledAt`, which is when the
     * call happens. The gap between them is booking lead time; without it,
     * "12 Pulse Checks this quarter" silently means whichever of the two you
     * assumed. Defaults to now() so a row created the moment someone books is
     * right without anyone remembering to set it.
     */
    bookedAt: timestamp('booked_at', { withTimezone: true }).notNull().defaultNow(),

    /**
     * "How did you find me?" — logged word for word, before categorizing.
     *
     * The plan calls this column the qualitative gold and it means it: at this
     * volume the sentence someone uses to describe finding you is worth more
     * than the count of which bucket it fell into, and it is the only field
     * here that can tell you something you didn't already have a category for.
     */
    sourceVerbatim: text('source_verbatim'),
    /** One of SOURCE_CATEGORIES. Assigned after the fact, from the verbatim. */
    sourceCategory: text('source_category'),

    /**
     * Which service line they're closest to, by the slug used on the site
     * (`/services/:slug/`) so it joins against the `service_line` property on
     * every analytics event. A guess made at booking time and revised on the
     * call — the point is to see which lines actually pull, not to route them.
     */
    serviceInterest: text('service_interest'),

    /** One of SALES_OUTCOMES. NULL until the call is held and resolves. */
    salesOutcome: text('sales_outcome'),
    /**
     * Set alongside `salesOutcome`. Proposal→close rate needs a date on both
     * ends, and `updatedAt` moves for every autosave so it cannot serve.
     */
    salesOutcomeAt: timestamp('sales_outcome_at', { withTimezone: true }),

    // Engagement value is deliberately NOT a column here: it lives on
    // `projects.priceCents`, reached via `projects.originatingPulseCheckId`.
    // A closed engagement is a project; duplicating its price onto the call
    // that produced it gives two numbers that will disagree within a quarter.

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

    // ⚠ DELIBERATELY ABSENT: score, grade, rating, tier, health_index, or any
    // numeric summary of a client. Not even "internal only." The instrument is
    // built against grading (see its Boundaries and its rules for writing the
    // readout), and a number in this table will find its way into a
    // client-facing document within a year. If you want an ordering for the
    // dashboard, order by readoutDueAt.
    //
    // This applies to the sales-side columns above too, and they are the more
    // likely breach: `salesOutcome` is one short step from a "lead quality"
    // or "fit score" that ranks organizations by how likely they are to pay.
    // Aggregate these across the quarter, never per client.
  },
  (t) => [
    index('pulse_checks_client_idx').on(t.clientId, t.createdAt.desc()),
    index('pulse_checks_due_idx')
      .on(t.readoutDueAt)
      .where(sql`${t.status} in ('captured', 'readout_drafted')`),
    /**
     * The funnel dashboard is read one quarter at a time, and rehearsals are
     * excluded from every count it reports — so the partial index matches the
     * query rather than the column.
     */
    index('pulse_checks_booked_idx')
      .on(t.bookedAt.desc())
      .where(sql`not ${t.isRehearsal}`),
  ],
);

export const readouts = pgTable('readouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  pulseCheckId: uuid('pulse_check_id')
    .notNull()
    .unique()
    .references(() => pulseChecks.id, { onDelete: 'cascade' }),
  /**
   * [{ artifact, body, quoteRefs: ["q10", "q03"] }]
   * Exactly three to reach 'ready'. `artifact` is the specific thing looked at
   * — the questionnaire's own example is that "your homepage" is weak but
   * "the headline above your booking button" is an observation.
   */
  observations: jsonb('observations').notNull().default(sql`'[]'::jsonb`),

  recWhat: text('rec_what'),
  recWhyFirst: text('rec_why_first'),
  recEffort: text('rec_effort'),
  /** 'diy' | 'bring_someone_in' — the questionnaire requires this be explicit. */
  recMode: text('rec_mode'),
  /** The ONLY field permitted to mention the paid Plan. Enforced by the lint. */
  didntCover: text('didnt_cover'),

  /** 1=blocker 2=true-vs-visible 3=pluggable-leak 4=trigger-tiebreak */
  ladderRule: smallint('ladder_rule'),
  ladderRationale: text('ladder_rationale'),
  quotesUsed: jsonb('quotes_used').notNull().default(sql`'[]'::jsonb`),

  lintState: jsonb('lint_state').notNull().default(sql`'{}'::jsonb`),
  charCount: integer('char_count'),
  status: text('status').notNull().default('draft'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  /**
   * Frozen at send. What you sent must never change because the template or
   * the instrument was revised afterwards.
   */
  renderedHtml: text('rendered_html'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ══════════════════════ TIMELINE + PROJECTS (Phase 2) ══════════════════════

export const interactions = pgTable(
  'interactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    /** 'manual' | 'gmail' | 'pulse_check' | 'readout' | 'system' */
    source: text('source').notNull(),
    /** 'note' | 'call' | 'email' | 'meeting' | 'pulse_check' | 'readout_sent' | 'proposal' */
    kind: text('kind').notNull(),
    direction: text('direction'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    subject: text('subject'),
    /** Snippet only for gmail-sourced rows; full text for manual notes. */
    body: text('body'),
    externalId: text('external_id'),
    externalThreadId: text('external_thread_id'),
    /** Collapsed thread size — a 14-message thread is one row, not fourteen. */
    messageCount: integer('message_count').notNull().default(1),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('interactions_timeline_idx').on(t.clientId, t.occurredAt.desc()),
    /** Makes Gmail sync idempotent by construction — re-running inserts nothing. */
    uniqueIndex('interactions_ext_key')
      .on(t.source, t.externalId)
      .where(sql`${t.externalId} is not null`),
  ],
);

/** From digital-presence-service-definition.md §6 — the downstream offers. */
export const PROJECT_KINDS = [
  'digital_presence_plan',
  'brand_foundation',
  'web_presence_build',
  'custom_tool_build',
  'growth_retainer',
  'other',
] as const;

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  kind: text('kind'),
  status: text('status').notNull().default('proposed'),
  /** Gives the Pulse-Check-to-paid-work conversion view for free. */
  originatingPulseCheckId: uuid('originating_pulse_check_id').references(
    () => pulseChecks.id,
    { onDelete: 'set null' },
  ),
  priceCents: integer('price_cents'),
  currency: text('currency').notNull().default('USD'),
  startedOn: timestamp('started_on', { mode: 'date' }),
  dueOn: timestamp('due_on', { mode: 'date' }),
  closedOn: timestamp('closed_on', { mode: 'date' }),
  summary: text('summary'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ══════════════════════════ TASKS + GMAIL (Phase 3) ══════════════════════════

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    detail: text('detail'),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    pulseCheckId: uuid('pulse_check_id').references(() => pulseChecks.id, {
      onDelete: 'cascade',
    }),
    status: text('status').notNull().default('open'),
    priority: smallint('priority').notNull().default(2),
    dueAt: timestamp('due_at', { withTimezone: true }),
    doneAt: timestamp('done_at', { withTimezone: true }),
    /** 'manual' | 'readout_due' | 'gmail' | 'system' */
    createdFrom: text('created_from').notNull().default('manual'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tasks_board_idx').on(t.status, t.priority, t.dueAt)],
);

export const googleAccounts = pgTable('google_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUser.id, { onDelete: 'cascade' }),
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull(),
  scopes: text('scopes').array().notNull(),
  // AES-256-GCM, key from TOKEN_ENCRYPTION_KEY. Ciphertext, IV and auth tag
  // in separate columns so none of them is mistaken for a usable value.
  refreshTokenCt: bytea('refresh_token_ct').notNull(),
  refreshTokenIv: bytea('refresh_token_iv').notNull(),
  refreshTokenTag: bytea('refresh_token_tag').notNull(),
  accessTokenCt: bytea('access_token_ct'),
  accessTokenIv: bytea('access_token_iv'),
  accessTokenTag: bytea('access_token_tag'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const gmailSyncState = pgTable('gmail_sync_state', {
  googleAccountId: uuid('google_account_id')
    .primaryKey()
    .references(() => googleAccounts.id, { onDelete: 'cascade' }),
  lastHistoryId: text('last_history_id'),
  lastFullSyncAt: timestamp('last_full_sync_at', { withTimezone: true }),
  /** Also the debounce for sync-on-open — at most one run per 10 minutes. */
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastError: text('last_error'),
  backfillCursor: text('backfill_cursor'),
  backfillDone: boolean('backfill_done').notNull().default(false),
});

/**
 * Messages that matched a client DOMAIN but not a known CONTACT.
 *
 * Domain matches are a guess, so they go to a review queue rather than
 * straight onto a client's timeline. Filing one offers to create the contact,
 * which is how the contact list actually gets built over time.
 */
export const emailMatchQueue = pgTable('email_match_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  gmailMessageId: text('gmail_message_id').notNull().unique(),
  gmailThreadId: text('gmail_thread_id'),
  fromEmail: text('from_email'),
  toEmails: text('to_emails').array(),
  subject: text('subject'),
  snippet: text('snippet'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }),
  suggestedClientId: uuid('suggested_client_id').references(() => clients.id, {
    onDelete: 'set null',
  }),
  /** 'domain' | 'name_fuzzy' */
  matchReason: text('match_reason'),
  /** 'filed' | 'ignored' | 'new_contact' */
  resolvedAction: text('resolved_action'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

import { useCallback, useState } from 'react';

import type { TaskRow } from '../lib/db/queries/tasks.ts';

export type TaskListProps = {
  initial: SerializedTask[];
  /** When rendered inside a project, new tasks inherit these. */
  scope?: { clientId?: string | null; projectId?: string | null };
  /** Hide the client/project column when the page already implies it. */
  showContext?: boolean;
};

/** Dates arrive from Astro as ISO strings, not Date objects. */
export type SerializedTask = Omit<TaskRow, 'dueAt' | 'doneAt'> & {
  dueAt: string | null;
  doneAt: string | null;
};

const PRIORITIES: [number, string][] = [
  [0, 'Now'],
  [1, 'Next'],
  [2, 'Soon'],
  [3, 'Someday'],
];

/**
 * The task board.
 *
 * A React island rather than forms, and this is the one place in the CRM where
 * that is clearly worth it: ticking something off is the most repeated action
 * in the app, and a full page reload per checkbox makes it feel like work.
 * Toggles apply optimistically and reconcile against the server.
 */
export default function TaskList({ initial, scope, showContext = true }: TaskListProps) {
  const [rows, setRows] = useState<SerializedTask[]>(initial);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState(2);
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const patch = useCallback(async (id: string, values: Record<string, unknown>) => {
    // Optimistic: the row moves before the request lands. On failure it is put
    // back, because a checkbox that lies is worse than one that is slow.
    const before = rows;
    setRows((prev) =>
      prev.map((t) => (t.id === id ? ({ ...t, ...values } as SerializedTask) : t)),
    );
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setRows(before);
    }
  }, [rows]);

  const add = useCallback(async () => {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: t,
          priority,
          dueAt: due || null,
          clientId: scope?.clientId ?? null,
          projectId: scope?.projectId ?? null,
        }),
      });
      if (res.ok) {
        const created = (await res.json()) as { task: SerializedTask };
        setRows((prev) => [created.task, ...prev]);
        setTitle('');
        setDue('');
      }
    } finally {
      setBusy(false);
    }
  }, [title, due, priority, scope, busy]);

  const live = rows.filter((t) => !['done', 'dropped'].includes(t.status));
  const finished = rows.filter((t) => ['done', 'dropped'].includes(t.status));

  return (
    <div className="tk">
      <form
        className="tk__add"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}>
        <input
          type="text"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
          {PRIORITIES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn btn--ghost" type="submit" disabled={!title.trim() || busy}>
          Add
        </button>
      </form>

      {live.length === 0 ? (
        <p className="muted">Nothing outstanding.</p>
      ) : (
        <ul className="tk__list">
          {live.map((t) => (
            <Row key={t.id} task={t} onPatch={patch} showContext={showContext} />
          ))}
        </ul>
      )}

      {finished.length > 0 && (
        <>
          <button className="tk__toggle" type="button" onClick={() => setShowDone((s) => !s)}>
            {showDone ? 'Hide' : 'Show'} {finished.length} finished
          </button>
          {showDone && (
            <ul className="tk__list tk__list--done">
              {finished.map((t) => (
                <Row key={t.id} task={t} onPatch={patch} showContext={showContext} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  task,
  onPatch,
  showContext,
}: {
  task: SerializedTask;
  onPatch: (id: string, v: Record<string, unknown>) => void;
  showContext: boolean;
}) {
  const done = task.status === 'done';
  const overdue =
    !done && task.dueAt != null && new Date(task.dueAt).getTime() < Date.now();

  return (
    <li className={`tk__row${done ? ' is-done' : ''}`}>
      <input
        type="checkbox"
        checked={done}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        onChange={(e) => onPatch(task.id, { status: e.target.checked ? 'done' : 'open' })}
      />

      <span className="tk__title">{task.title}</span>

      {showContext && (task.projectName || task.clientName) && (
        <a
          className="tk__ctx kicker"
          href={task.projectId ? `/projects/${task.projectId}` : `/clients/${task.clientId}`}>
          {task.projectName ?? task.clientName}
        </a>
      )}

      {!done && (
        <select
          className="tk__pri"
          value={task.priority}
          onChange={(e) => onPatch(task.id, { priority: Number(e.target.value) })}
          aria-label="Priority">
          {PRIORITIES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      )}

      {task.dueAt && (
        <span className={`tk__due kicker${overdue ? ' is-overdue' : ''}`}>
          {new Date(task.dueAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'America/Los_Angeles',
          })}
        </span>
      )}
    </li>
  );
}

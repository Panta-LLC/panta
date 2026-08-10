import { useEffect, useRef, useState } from 'react';

import type { ResolvedQuestion } from '../../lib/instrument/resolve.ts';

type Props = {
  question: ResolvedQuestion;
  value: string | number | null;
  onChange: (v: string | number | null) => void;
};

/**
 * One question.
 *
 * Local state with a commit on change keeps typing perfectly smooth: the
 * parent's autosave state updates on every keystroke, and routing the input's
 * value back down through it would make a fast typist fight React's render
 * cycle mid-sentence.
 *
 * Nothing here is ever `required`. Real interviews skip questions, and a tool
 * that argues about it gets abandoned on the second call.
 */
export function QuestionField({ question, value, onChange }: Props) {
  const [local, setLocal] = useState(value ?? '');
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Only accept an external value when this field is not focused — otherwise a
  // restore or a background sync would yank text out from under the cursor.
  useEffect(() => {
    if (document.activeElement !== ref.current) setLocal(value ?? '');
  }, [value]);

  const label = (
    <label htmlFor={question.key}>
      {question.n != null && <span className="q__n">{question.n}.</span>}
      <span>{question.prompt}</span>
      {question.moduleLabel && <span className="q__module">{question.moduleLabel}</span>}
    </label>
  );

  if (question.type === 'choice') {
    return (
      <div className="q">
        {label}
        <div className="q__choices">
          {question.options?.map((o) => (
            <button
              key={o.v}
              type="button"
              className={`q__choice${value === o.v ? ' is-on' : ''}`}
              onClick={() => onChange(value === o.v ? null : o.v)}>
              {o.label}
            </button>
          ))}
        </div>
        {question.hint && <p className="q__hint">{question.hint}</p>}
      </div>
    );
  }

  if (question.type === 'number') {
    return (
      <div className="q">
        {label}
        <input
          id={question.key}
          type="number"
          className="q__number"
          value={local as number | string}
          onChange={(e) => {
            setLocal(e.target.value);
            onChange(e.target.value === '' ? null : Number(e.target.value));
          }}
        />
        {question.hint && <p className="q__hint">{question.hint}</p>}
      </div>
    );
  }

  return (
    <div className="q">
      {label}
      {question.hint && <p className="q__hint">{question.hint}</p>}
      {/*
        Auto-growing textarea, done in CSS rather than JavaScript.

        The wrapper duplicates the text in a ::after pseudo-element sharing the
        same grid cell; the invisible copy sets the row height and the textarea
        stretches to match. No measuring, so none of the ways a measured
        version breaks apply — a not-yet-laid-out grid, a font landing after
        first paint, or a container that changes width. An earlier JS version
        of this measured a 24px-wide field on mount and committed a 1780px
        height, which is exactly the failure this avoids.
      */}
      <div className="grow" data-replicated={String(local ?? '')}>
        <textarea
          id={question.key}
          ref={ref}
          rows={2}
          value={local as string}
          onChange={(e) => {
            setLocal(e.target.value);
            onChange(e.target.value);
          }}
        />
      </div>
    </div>
  );
}

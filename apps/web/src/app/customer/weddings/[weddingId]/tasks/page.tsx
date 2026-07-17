'use client';

import { useEffect, useMemo, useState } from 'react';
import { deleteJson, getJson, patchJson, postJson } from '../../../../lib/api';
import { PlannerShell } from '../../../../components/planner-shell';

const statuses = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'AWAITING_INFORMATION',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
];

type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  assignee?: string | null;
  assignedRole?: string | null;
  status: string;
  priority?: string;
  dueDate?: string | null;
  instructions?: string[];
  requiredEvidence?: string[];
  requiresApproval?: boolean;
  approvalStatus?: string;
  evidence?: Array<{ id: string; title: string; fileUrl?: string | null }>;
  comments?: Array<{ id: string; comment: string }>;
  blockers?: Array<{ id: string; reason: string; status: string }>;
  reminders?: Array<{ id: string; remindAt: string; status: string }>;
  dependentTasks?: Array<{
    id: string;
    dependsOnTask?: { title: string; status: string };
  }>;
  statusHistory?: Array<{ id: string; fromStatus?: string; toStatus: string }>;
};

function label(value?: string | null) {
  return (value || 'UNASSIGNED').replaceAll('_', ' ').toLowerCase();
}

export default function TasksPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [form, setForm] = useState({
    title: '',
    assignee: '',
    status: 'NOT_STARTED',
    dueDate: '',
    requiresApproval: false,
    requiredEvidence: '',
  });
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [blockers, setBlockers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTasks() {
    setLoading(true);
    setError('');

    try {
      const data = await getJson(`/weddings/${params.weddingId}/tasks`);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.weddingId]);

  const summary = useMemo(
    () => ({
      active: tasks.filter(
        (task) => !['COMPLETED', 'CANCELLED'].includes(task.status),
      ).length,
      completed: tasks.filter((task) => task.status === 'COMPLETED').length,
      approvals: tasks.filter((task) => task.approvalStatus === 'PENDING')
        .length,
      blocked: tasks.filter((task) => task.status === 'BLOCKED').length,
    }),
    [tasks],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await postJson(`/weddings/${params.weddingId}/tasks`, {
        title: form.title.trim(),
        assignee: form.assignee.trim() || undefined,
        status: form.status,
        dueDate: form.dueDate || undefined,
        requiresApproval: form.requiresApproval,
        requiredEvidence: form.requiredEvidence
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setForm({
        title: '',
        assignee: '',
        status: 'NOT_STARTED',
        dueDate: '',
        requiresApproval: false,
        requiredEvidence: '',
      });
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add task');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function taskAction(taskId: string, action: () => Promise<unknown>) {
    setBusyId(taskId);
    setError('');

    try {
      await action();
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task update failed');
    } finally {
      setBusyId('');
    }
  }

  return (
    <PlannerShell weddingId={params.weddingId}>
      <div className="rb-card p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-kicker">Planning tasks</p>
            <h1 className="rb-heading mt-2 text-5xl">
              Every task, owner, proof, and approval
            </h1>
            <p className="mt-4 max-w-2xl text-[var(--rb-muted)]">
              Start tasks, upload evidence, resolve blockers, and submit work
              for approval without losing the history.
            </p>
          </div>
          <div className="rb-badge">{summary.active} active tasks</div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-[var(--rb-border)] bg-white/70 p-5 md:grid-cols-2"
        >
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Task title"
            className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
          />
          <input
            value={form.assignee}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                assignee: event.target.value,
              }))
            }
            placeholder="Assignee name"
            className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
          />
          <input
            value={form.dueDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dueDate: event.target.value,
              }))
            }
            type="date"
            className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
          />
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
          </select>
          <input
            value={form.requiredEvidence}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                requiredEvidence: event.target.value,
              }))
            }
            placeholder="Required evidence, comma separated"
            className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2 md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--rb-muted)]">
            <input
              type="checkbox"
              checked={form.requiresApproval}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  requiresApproval: event.target.checked,
                }))
              }
            />
            Requires owner approval
          </label>
          <button
            disabled={isSubmitting}
            type="submit"
            className="rb-button rb-button-primary md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Add task'}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-2xl border border-[rgba(180,58,75,0.28)] bg-[rgba(180,58,75,0.1)] p-4 text-sm font-semibold text-[var(--rb-error)]">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-6 text-sm text-[var(--rb-muted)]">
            Loading tasks...
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['Active', summary.active],
            ['Completed', summary.completed],
            ['Approvals', summary.approvals],
            ['Blocked', summary.blocked],
          ].map(([title, value]) => (
            <div key={title} className="rb-card-soft p-5">
              <p className="text-sm font-bold text-[var(--rb-muted)]">
                {title}
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--rb-burgundy)]">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {tasks.map((task) => (
            <article key={task.id} className="rb-card-soft p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rb-badge">{label(task.status)}</span>
                    <span className="rb-badge bg-white">
                      {task.priority || 'MEDIUM'}
                    </span>
                    {task.requiresApproval ? (
                      <span className="rb-badge bg-white">
                        Approval: {label(task.approvalStatus)}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                    {task.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--rb-muted)]">
                    Assigned to {task.assignee || label(task.assignedRole)} ·
                    Due{' '}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : 'TBD'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busyId === task.id}
                    onClick={() =>
                      void taskAction(task.id, () =>
                        postJson(`/tasks/${task.id}/start`, {}),
                      )
                    }
                    className="rb-button rb-button-secondary"
                  >
                    Start
                  </button>
                  <button
                    disabled={busyId === task.id}
                    onClick={() =>
                      void taskAction(task.id, () =>
                        postJson(`/tasks/${task.id}/complete`, {}),
                      )
                    }
                    className="rb-button rb-button-primary"
                  >
                    {task.requiresApproval ? 'Submit' : 'Complete'}
                  </button>
                  <button
                    disabled={busyId === task.id}
                    onClick={() =>
                      void taskAction(task.id, () =>
                        postJson(`/tasks/${task.id}/approve`, {
                          comment: 'Approved from task board',
                        }),
                      )
                    }
                    className="rb-button rb-button-secondary"
                  >
                    Approve
                  </button>
                  <select
                    value={task.status}
                    disabled={busyId === task.id}
                    onChange={(event) =>
                      void taskAction(task.id, () =>
                        patchJson(
                          `/weddings/${params.weddingId}/tasks/${task.id}`,
                          { status: event.target.value },
                        ),
                      )
                    }
                    className="rounded-full border border-[var(--rb-border)] bg-white px-3 py-2 text-sm capitalize"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {label(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={busyId === task.id}
                    type="button"
                    onClick={() =>
                      void taskAction(task.id, () =>
                        deleteJson(
                          `/weddings/${params.weddingId}/tasks/${task.id}`,
                        ),
                      )
                    }
                    className="rounded-full border border-[rgba(180,58,75,0.3)] px-4 py-2 text-sm font-bold text-[var(--rb-error)]"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-bold text-[var(--rb-muted)]">
                    Instructions
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--rb-muted)]">
                    {(task.instructions || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    {(task.instructions || []).length === 0 ? (
                      <li>No instructions added</li>
                    ) : null}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--rb-muted)]">
                    Dependencies
                  </p>
                  <div className="mt-2 space-y-2 text-sm text-[var(--rb-muted)]">
                    {(task.dependentTasks || []).map((dependency) => (
                      <p key={dependency.id}>
                        {dependency.dependsOnTask?.title} ·{' '}
                        {label(dependency.dependsOnTask?.status)}
                      </p>
                    ))}
                    {(task.dependentTasks || []).length === 0 ? (
                      <p>No dependencies</p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--rb-muted)]">
                    Evidence needed
                  </p>
                  <p className="mt-2 text-sm text-[var(--rb-muted)]">
                    {(task.requiredEvidence || []).join(', ') ||
                      'No evidence required'}
                  </p>
                  <p className="mt-2 text-sm text-[var(--rb-muted)]">
                    Uploaded: {task.evidence?.length || 0}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <div className="flex gap-2">
                  <input
                    value={evidence[task.id] || ''}
                    onChange={(event) =>
                      setEvidence((current) => ({
                        ...current,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder="Evidence title or URL"
                    className="min-w-0 flex-1 rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void taskAction(task.id, () =>
                        postJson(`/tasks/${task.id}/evidence`, {
                          title: evidence[task.id] || 'Uploaded evidence',
                          fileUrl: evidence[task.id] || undefined,
                        }),
                      )
                    }
                    className="rb-button rb-button-secondary"
                  >
                    Add proof
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={comments[task.id] || ''}
                    onChange={(event) =>
                      setComments((current) => ({
                        ...current,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder="Comment"
                    className="min-w-0 flex-1 rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void taskAction(task.id, () =>
                        postJson(`/tasks/${task.id}/comments`, {
                          comment: comments[task.id] || 'Progress noted',
                        }),
                      )
                    }
                    className="rb-button rb-button-secondary"
                  >
                    Comment
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={blockers[task.id] || ''}
                    onChange={(event) =>
                      setBlockers((current) => ({
                        ...current,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder="Blocker reason"
                    className="min-w-0 flex-1 rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void taskAction(task.id, () =>
                        postJson(`/tasks/${task.id}/blockers`, {
                          reason: blockers[task.id] || 'Needs attention',
                        }),
                      )
                    }
                    className="rb-button rb-button-secondary"
                  >
                    Block
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 text-sm text-[var(--rb-muted)] md:grid-cols-3">
                <p>Comments: {task.comments?.length || 0}</p>
                <p>Blockers: {task.blockers?.length || 0}</p>
                <p>Status updates: {task.statusHistory?.length || 0}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PlannerShell>
  );
}

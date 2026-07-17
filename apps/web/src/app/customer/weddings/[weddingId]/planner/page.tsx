'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '../../../../lib/api';
import { PlannerShell } from '../../../../components/planner-shell';

type ProgressBucket = {
  total: number;
  completed: number;
  progress: number;
};

type Progress = {
  overall: number;
  total: number;
  completed: number;
  overdue: number;
  blocked: number;
  pendingApprovals: number;
  byCategory: Record<string, ProgressBucket>;
  byEvent?: Record<string, ProgressBucket>;
  byFamilyRole: Record<string, ProgressBucket>;
  byMember?: Record<string, ProgressBucket>;
  overdueTaskPercentage: number;
};

type PlanResponse = {
  plan?: { generatedAt?: string; status?: string } | null;
  tasks?: Array<{
    id: string;
    title: string;
    category?: string;
    priority?: string;
    status?: string;
    dueDate?: string | null;
  }>;
};

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

export default function PlannerPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPlanner() {
    setLoading(true);
    setError('');

    try {
      const [planData, progressData] = await Promise.all([
        getJson(`/weddings/${params.weddingId}/plan`),
        getJson(`/weddings/${params.weddingId}/progress`),
      ]);
      setPlan(planData);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load planner');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.weddingId]);

  async function handleGeneratePlan() {
    setIsGenerating(true);
    setMessage('');
    setError('');

    try {
      const result = await postJson(
        `/weddings/${params.weddingId}/generate-plan`,
        {},
      );
      setMessage(
        `Generated ${result.createdTasks?.length || 0} new tasks. Total planner tasks: ${result.totalTasks || 0}.`,
      );
      await loadPlanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate plan');
    } finally {
      setIsGenerating(false);
    }
  }

  const recentTasks = plan?.tasks?.slice(0, 6) || [];

  return (
    <PlannerShell weddingId={params.weddingId}>
      <div className="rb-card p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-kicker">Smart planner</p>
            <h1 className="rb-heading mt-2 text-5xl">
              Generate and track the wedding plan
            </h1>
            <p className="mt-4 max-w-2xl text-[var(--rb-muted)]">
              Use the rule-based planner to create phase-based tasks with
              deadlines, evidence, dependencies, and approval requirements.
            </p>
          </div>
          <button
            disabled={isGenerating}
            onClick={() => void handleGeneratePlan()}
            className="rb-button rb-button-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGenerating ? 'Generating...' : 'Generate plan'}
          </button>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl border border-[rgba(60,122,87,0.28)] bg-[rgba(60,122,87,0.1)] p-4 text-sm font-semibold text-[var(--rb-success)]">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl border border-[rgba(180,58,75,0.28)] bg-[rgba(180,58,75,0.1)] p-4 text-sm font-semibold text-[var(--rb-error)]">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-6 text-sm text-[var(--rb-muted)]">
            Loading planner...
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <div className="rb-card-soft p-5 md:col-span-2">
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Overall progress
            </p>
            <p className="mt-2 text-4xl font-black text-[var(--rb-burgundy)]">
              {progress?.overall ?? 0}%
            </p>
            <div className="mt-4 h-2 rounded-full bg-white">
              <div
                className="h-2 rounded-full bg-[var(--rb-burgundy)]"
                style={{ width: `${progress?.overall ?? 0}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-[var(--rb-muted)]">
              {progress?.completed ?? 0} of {progress?.total ?? 0} tasks
              completed
            </p>
          </div>
          <div className="rb-card-soft p-5">
            <p className="text-sm font-bold text-[var(--rb-muted)]">Overdue</p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-error)]">
              {progress?.overdue ?? 0}
            </p>
          </div>
          <div className="rb-card-soft p-5">
            <p className="text-sm font-bold text-[var(--rb-muted)]">Blocked</p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-info)]">
              {progress?.blocked ?? 0}
            </p>
          </div>
          <div className="rb-card-soft p-5">
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Approvals
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-warning)]">
              {progress?.pendingApprovals ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rb-card-soft p-5">
            <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              Progress by category
            </h2>
            <div className="mt-5 space-y-4">
              {Object.entries(progress?.byCategory || {}).map(
                ([category, bucket]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-[var(--rb-muted)]">
                        {category}
                      </span>
                      <span className="font-bold text-[var(--rb-burgundy)]">
                        {bucket.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-[var(--rb-success)]"
                        style={{ width: `${bucket.progress}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="rb-card-soft p-5">
            <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              Progress by family role
            </h2>
            <div className="mt-5 space-y-4">
              {Object.entries(progress?.byFamilyRole || {}).map(
                ([role, bucket]) => (
                  <div key={role}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-[var(--rb-muted)]">
                        {label(role)}
                      </span>
                      <span className="font-bold text-[var(--rb-burgundy)]">
                        {bucket.completed}/{bucket.total}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-[var(--rb-info)]"
                        style={{ width: `${bucket.progress}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rb-card-soft p-5">
            <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              Progress by event
            </h2>
            <div className="mt-5 space-y-4">
              {Object.entries(progress?.byEvent || {}).map(
                ([eventName, bucket]) => (
                  <div key={eventName}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--rb-muted)]">
                        {eventName}
                      </span>
                      <span className="font-bold text-[var(--rb-burgundy)]">
                        {bucket.completed}/{bucket.total}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-[var(--rb-warning)]"
                        style={{ width: `${bucket.progress}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="rb-card-soft p-5">
            <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              Progress by member
            </h2>
            <div className="mt-5 space-y-4">
              {Object.entries(progress?.byMember || {}).map(
                ([member, bucket]) => (
                  <div key={member}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--rb-muted)]">{member}</span>
                      <span className="font-bold text-[var(--rb-burgundy)]">
                        {bucket.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-[var(--rb-burgundy)]"
                        style={{ width: `${bucket.progress}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rb-card-soft p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              Generated task preview
            </h2>
            <Link
              href={`/customer/weddings/${params.weddingId}/tasks`}
              className="text-sm font-bold text-[var(--rb-burgundy)]"
            >
              Open tasks
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--rb-border)] bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-bold text-[var(--rb-burgundy-dark)]">
                    {task.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--rb-muted)]">
                    {task.category || 'Planning'} -{' '}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : 'No due date'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rb-badge">{task.priority || 'MEDIUM'}</span>
                  <span className="rb-badge bg-white">
                    {label(task.status || 'NOT_STARTED')}
                  </span>
                </div>
              </div>
            ))}
            {!loading && recentTasks.length === 0 ? (
              <p className="text-sm text-[var(--rb-muted)]">
                Generate a plan to create guided tasks.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </PlannerShell>
  );
}

"use client"

import { Lightbulb, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { quadrants, type QuadrantId, type Task } from "@/lib/tasks"
import { TaskCard } from "@/components/task-card"

const headerAccent: Record<string, string> = {
  red: "text-chart-1",
  blue: "text-chart-2",
  amber: "text-amber-700",
  emerald: "text-emerald-700",
}

const topBar: Record<string, string> = {
  red: "bg-chart-1",
  blue: "bg-chart-2",
  amber: "bg-chart-3",
  emerald: "bg-chart-4",
}

const dotBg: Record<string, string> = {
  red: "bg-chart-1/12 text-chart-1",
  blue: "bg-chart-2/12 text-chart-2",
  amber: "bg-chart-3/15 text-amber-700",
  emerald: "bg-chart-4/12 text-emerald-700",
}

export function QuadrantColumn({
  id,
  tasks,
  onToggle,
  onDelete,
}: {
  id: QuadrantId
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const q = quadrants[id]
  const done = tasks.filter((t) => t.completed).length

  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card/60 shadow-sm">
      <div className={cn("h-1 w-full", topBar[q.accent])} />
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
              dotBg[q.accent],
            )}
          >
            {q.code}
          </span>
          <div>
            <h2
              className={cn(
                "text-pretty text-sm font-bold uppercase leading-tight tracking-wide",
                headerAccent[q.accent],
              )}
            >
              {q.title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {q.action} · {tasks.length} nhiệm vụ
              {tasks.length > 0 && ` · ${done} hoàn thành`}
            </p>
          </div>
        </div>
        <Lightbulb className={cn("size-5 shrink-0", headerAccent[q.accent])} />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        {tasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">Không có nhiệm vụ</p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-secondary"
            >
              <Plus className="size-3.5" /> Thêm nhiệm vụ
            </button>
          </div>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              accent={q.accent}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  )
}

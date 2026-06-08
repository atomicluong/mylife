"use client"

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListChecks,
  Plus,
  Search,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { initialTasks, type QuadrantId, type Task } from "@/lib/tasks"
import { QuadrantColumn } from "@/components/quadrant-column"

const order: QuadrantId[] = ["q1", "q2", "q3", "q4"]
const views = ["Ngày", "Tuần", "Tháng"] as const
const modes = ["Lịch trình", "Ma trận"] as const

export function EisenhowerBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<(typeof modes)[number]>("Ma trận")
  const [view, setView] = useState<(typeof views)[number]>("Ngày")

  const toggle = (id: string) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              doneSteps: !t.completed ? t.totalSteps : t.doneSteps,
            }
          : t,
      ),
    )

  const remove = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter((t) => t.title.toLowerCase().includes(q))
  }, [tasks, query])

  const byQuadrant = (id: QuadrantId) =>
    filtered.filter((t) => t.quadrant === id)

  const total = filtered.length
  const completed = filtered.filter((t) => t.completed).length

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      {/* Add task banner */}
      <button
        type="button"
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] px-5 py-4 text-left transition hover:border-primary/60 hover:bg-primary/[0.07]"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition group-hover:scale-105">
            <Plus className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Bấm vào đây để nhập nhiệm vụ mới
            </span>
            <span className="block text-xs text-muted-foreground">
              Mô tả công việc, AI sẽ tự xếp vào góc phần tư phù hợp
            </span>
          </span>
        </span>
        <Sparkles className="size-5 text-primary/70" />
      </button>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm nhiệm vụ..."
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Segmented
            options={modes}
            value={mode}
            onChange={setMode}
            icons={[ListChecks, LayoutGrid]}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              aria-label="Trước"
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="rounded-lg px-3 py-1 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Hôm nay
            </button>
            <button
              type="button"
              aria-label="Sau"
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <Segmented options={views} value={view} onChange={setView} />
        </div>
      </div>

      {/* Summary line */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{total} nhiệm vụ</span>
        <span className="size-1 rounded-full bg-border" />
        <span>{completed} đã hoàn thành</span>
        <span className="size-1 rounded-full bg-border" />
        <span className="capitalize">
          Chế độ {mode.toLowerCase()} · {view.toLowerCase()}
        </span>
      </div>

      {/* Matrix */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {order.map((id) => (
          <QuadrantColumn
            key={id}
            id={id}
            tasks={byQuadrant(id)}
            onToggle={toggle}
            onDelete={remove}
          />
        ))}
      </div>
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  icons,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  icons?: React.ComponentType<{ className?: string }>[]
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
      {options.map((opt, i) => {
        const Icon = icons?.[i]
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {opt}
          </button>
        )
      })}
    </div>
  )
}

"use client"

import {
  Calendar,
  Check,
  ChevronDown,
  Cloud,
  CloudRain,
  CloudLightning,
  Layers,
  Plus,
  Sun,
  Trash2,
  ChevronUp,
  ChevronDown as ChevronDownArrow,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { priorityLabel, type Task } from "@/lib/tasks"

const weatherIcon = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
}

const accentRing: Record<string, string> = {
  red: "before:bg-chart-1",
  blue: "before:bg-chart-2",
  amber: "before:bg-chart-3",
  emerald: "before:bg-chart-4",
}

const priorityStyles: Record<Task["priority"], string> = {
  thap: "bg-secondary text-secondary-foreground ring-border",
  "trung-binh": "bg-chart-3/15 text-amber-700 ring-chart-3/30",
  cao: "bg-chart-1/12 text-chart-1 ring-chart-1/25",
}

const timeStyles: Record<string, string> = {
  red: "bg-chart-1/10 text-chart-1",
  blue: "bg-chart-2/10 text-chart-2",
  amber: "bg-chart-3/15 text-amber-700",
  emerald: "bg-chart-4/12 text-emerald-700",
}

export function TaskCard({
  task,
  accent,
  onToggle,
  onDelete,
}: {
  task: Task
  accent: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const WIcon = weatherIcon[task.weather.condition]
  const pct =
    task.totalSteps === 0
      ? 0
      : Math.round((task.doneSteps / task.totalSteps) * 100)

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-4 pl-5 shadow-sm transition-all",
        "before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-full before:content-['']",
        "hover:-translate-y-0.5 hover:shadow-md",
        accentRing[accent],
        task.completed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={open ? "Thu gọn" : "Mở rộng"}
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </button>

        <button
          type="button"
          aria-label={task.completed ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
          onClick={() => onToggle(task.id)}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
            task.completed
              ? "border-chart-4 bg-chart-4 text-white"
              : "border-border text-transparent hover:border-primary",
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "text-pretty text-[15px] font-semibold leading-snug text-foreground",
              task.completed && "line-through",
            )}
          >
            {task.title}
          </h3>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
                timeStyles[accent],
              )}
            >
              {task.start} – {task.end}
            </span>

            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {task.date}
            </span>

            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              <WIcon className="size-3.5" />
              {task.weather.temp}°C
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-chart-2" />
              {task.assignee}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden items-center rounded-lg border border-border bg-card sm:flex">
            <button
              type="button"
              aria-label="Tăng độ ưu tiên"
              className="rounded-l-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronUp className="size-3.5" />
            </button>
            <span className="h-4 w-px bg-border" />
            <button
              type="button"
              aria-label="Giảm độ ưu tiên"
              className="rounded-r-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronDownArrow className="size-3.5" />
            </button>
          </div>

          <span
            className={cn(
              "hidden whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset md:inline-block",
              priorityStyles[task.priority],
            )}
          >
            {priorityLabel[task.priority]}
          </span>

          <button
            type="button"
            aria-label="Xóa nhiệm vụ"
            onClick={() => onDelete(task.id)}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Thêm bước"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-primary"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* progress row */}
      <div className="mt-3 flex items-center gap-3 pl-[2.1rem]">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Layers className="size-3.5 text-primary" />
          {task.doneSteps}/{task.totalSteps} bước
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct === 100 ? "bg-chart-4" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-9 text-right text-xs font-semibold tabular-nums text-foreground">
          {pct}%
        </span>
      </div>

      {open && (
        <div className="mt-3 space-y-1.5 rounded-xl bg-secondary/60 p-3 pl-[2.1rem] text-sm text-muted-foreground">
          {Array.from({ length: task.totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border",
                  i < task.doneSteps
                    ? "border-chart-4 bg-chart-4 text-white"
                    : "border-border",
                )}
              >
                {i < task.doneSteps && (
                  <Check className="size-2.5" strokeWidth={3} />
                )}
              </span>
              <span className={cn(i < task.doneSteps && "line-through")}>
                Bước {i + 1}
              </span>
            </div>
          ))}
          {task.totalSteps === 0 && <p>Chưa có bước nào.</p>}
        </div>
      )}
    </div>
  )
}

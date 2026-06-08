import { Grid2x2, Bell, Globe } from "lucide-react"
import { EisenhowerBoard } from "@/components/eisenhower-board"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Grid2x2 className="size-4.5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">Ma Trận Eisenhower</p>
              <p className="text-xs text-muted-foreground">Quản lý nhiệm vụ theo độ ưu tiên</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Ngôn ngữ"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Globe className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Thông báo"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Bell className="size-5" />
            </button>
            <span className="ml-1 flex size-8 items-center justify-center rounded-full bg-chart-2/15 text-sm font-semibold text-chart-2">
              Mc
            </span>
          </div>
        </div>
      </header>

      <EisenhowerBoard />
    </main>
  )
}

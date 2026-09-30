import { SettingsPanel } from "@/components/settings/settings-panel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Data source, watchlist, and project info.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SettingsPanel />

        <Card>
          <CardHeader>
            <CardTitle>About this project</CardTitle>
            <CardDescription>
              A watchlist dashboard built to close GraphQL and Next.js gaps, extending real
              fintech-dashboard experience from prior work — see{" "}
              <code>docs/architecture.html</code> for the full design reasoning and cross-review
              notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Stack: Next.js App Router, self-hosted GraphQL BFF (Apollo Server), Apollo Client,
            TanStack Table + Virtual, visx, Zustand, shadcn/ui.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

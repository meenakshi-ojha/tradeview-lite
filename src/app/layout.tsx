import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ApolloClientProvider } from "@/lib/apollo/provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeView Lite",
  description: "A live-updating stock watchlist dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ApolloClientProvider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Live watchlist &amp; charting
                  </span>
                </header>
                <main className="flex flex-1 flex-col">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}

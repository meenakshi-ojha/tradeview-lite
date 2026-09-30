"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { tickerSchema } from "@/lib/validation/ticker-schema";
import { useAppStore } from "@/lib/store/app-store";
import { KNOWN_SYMBOLS } from "@/lib/data-source";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Dropdown/combobox instead of a blind free-text input - suggests from the
// known mock universe (or, once real mode is wired further, FMP's
// symbol-search endpoint) so adding a ticker is a pick, not a guess. Still
// falls back to free entry for symbols outside the suggested list, run
// through the same Zod format check + duplicate guard either way.
export function AddTickerForm() {
  const watchlist = useAppStore((s) => s.watchlist);
  const addSymbol = useAppStore((s) => s.addSymbol);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const availableSymbols = KNOWN_SYMBOLS.filter((s) => !watchlist.includes(s));

  const commit = (raw: string) => {
    const parsed = tickerSchema.safeParse({ symbol: raw });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Invalid symbol");
      return;
    }
    const added = addSymbol(parsed.data.symbol);
    setNotice(added ? null : `${parsed.data.symbol} is already on your watchlist`);
    setInputValue("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Add ticker"
              className="w-56 justify-between"
            >
              Add ticker
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0">
            <Command>
              <CommandInput
                placeholder="Search or type a symbol..."
                value={inputValue}
                onValueChange={(value) => {
                  setInputValue(value);
                  setNotice(null);
                }}
              />
              <CommandList>
                <CommandEmpty>
                  {inputValue ? (
                    <button
                      className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => commit(inputValue)}
                    >
                      Add &quot;{inputValue.toUpperCase()}&quot;
                    </button>
                  ) : (
                    "No matches"
                  )}
                </CommandEmpty>
                <CommandGroup heading="Suggested">
                  {availableSymbols.map((symbol) => (
                    <CommandItem key={symbol} value={symbol} onSelect={() => commit(symbol)}>
                      <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                      {symbol}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              {/* Validation failures keep the popover open (so the user can
                  correct the input), which would otherwise hide the notice
                  rendered below the closed trigger - so it's shown here too. */}
              {notice && (
                <div className="border-t px-2 py-1.5 text-xs text-destructive">{notice}</div>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {!open && notice && <span className="text-xs text-muted-foreground">{notice}</span>}
    </div>
  );
}

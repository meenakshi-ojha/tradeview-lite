"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tickerSchema, type TickerFormValues } from "@/lib/validation/ticker-schema";
import { useAppStore } from "@/lib/store/app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AddTickerForm() {
  const addSymbol = useAppStore((s) => s.addSymbol);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TickerFormValues>({
    resolver: zodResolver(tickerSchema),
  });

  const onSubmit = (values: TickerFormValues) => {
    setDuplicateNotice(null);
    const added = addSymbol(values.symbol);
    if (!added) {
      // Duplicate-add guard - also protects the real-API rate budget:
      // an already-tracked symbol doesn't need re-adding, and re-adding
      // wouldn't create a second poll anyway since the watchlist is a set
      // of unique symbols, but surfacing this clearly avoids user confusion.
      setDuplicateNotice(`${values.symbol} is already on your watchlist`);
      return;
    }
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
      <div className="flex flex-col gap-1">
        <Input
          placeholder="Add ticker (e.g. TSLA)"
          className="w-40 uppercase"
          {...register("symbol")}
        />
        {errors.symbol && (
          <span className="text-xs text-destructive">{errors.symbol.message}</span>
        )}
        {duplicateNotice && (
          <span className="text-xs text-muted-foreground">{duplicateNotice}</span>
        )}
      </div>
      <Button type="submit">Add</Button>
    </form>
  );
}

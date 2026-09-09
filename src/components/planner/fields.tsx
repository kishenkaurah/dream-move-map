import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function NumberField({
  label,
  value,
  onChange,
  hint,
  min = 0,
  max = 1e10,
  step = "any",
  unit,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint?: string | undefined;
  min?: number;
  max?: number;
  step?: number | "any";
  unit?: string;
}) {
  const id = useId();
  const invalid = value !== null && (!Number.isFinite(value) || value < min || value > max);
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="text-sm leading-5">
        {label}
        {unit && <span className="ml-1 font-normal text-muted-foreground">({unit})</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value === null || !Number.isFinite(value) ? "" : Number(value.toFixed(4))}
        min={min}
        max={max}
        step={step}
        placeholder="Not entered"
        aria-invalid={invalid}
        aria-describedby={hint || invalid ? `${id}-hint` : undefined}
        className="h-11 bg-background tabular-nums"
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.valueAsNumber)}
      />
      {(hint || invalid) && (
        <p
          id={`${id}-hint`}
          className={`text-sm leading-5 ${invalid ? "text-destructive" : "text-muted-foreground"}`}
        >
          {invalid ? `Enter a number between ${min} and ${max}. ` : ""}
          {hint}
        </p>
      )}
    </div>
  );
}
export function ChoiceField({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  choices: readonly (readonly [string, string])[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 w-full min-w-0 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map(([v, text]) => (
            <SelectItem key={v} value={v}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <Label htmlFor={id} className="text-sm font-normal leading-6">
        {label}
      </Label>
    </div>
  );
}

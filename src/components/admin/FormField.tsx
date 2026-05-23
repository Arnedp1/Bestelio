export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass = "input-field text-sm";

export const cardClass = "card p-5";

export const btnPrimary = "btn-primary text-sm !py-2 !px-4";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50";

export const btnDanger =
  "rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50";

export const checkboxClass = "checkbox";

export const checkboxLabelClass = "checkbox-label";

export const checkboxLabelBoxClass = "checkbox-label checkbox-label-box";

export function CheckboxField({
  label,
  name,
  defaultChecked,
  checked,
  onChange,
  box = false,
  className = "",
}: {
  label: string;
  name?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  box?: boolean;
  className?: string;
}) {
  return (
    <label className={`${box ? checkboxLabelBoxClass : checkboxLabelClass} ${className}`.trim()}>
      <input
        type="checkbox"
        name={name}
        className={checkboxClass}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

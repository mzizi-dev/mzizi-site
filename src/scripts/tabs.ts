/**
 * Switches the statically rendered `@bundu/ui` tab sets (see
 * `src/components/StaticTabs.tsx`). Every panel is already in the HTML; this
 * only moves `aria-selected`, `hidden`, `tabindex` and the trigger's selected
 * classes, and adds the WAI-ARIA arrow-key, Home and End behaviour that the
 * React component would have had if it were hydrated.
 *
 * The two class lists are the ones `TabsTrigger` renders for each state.
 */
const SELECTED = ["bg-background", "text-foreground", "shadow-sm"];
const UNSELECTED = ["text-muted-foreground", "hover:text-foreground"];

for (const root of document.querySelectorAll<HTMLElement>('[data-slot="tabs"]')) {
  const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const select = (next: HTMLButtonElement, focus: boolean) => {
    for (const trigger of triggers) {
      const on = trigger === next;
      trigger.setAttribute("aria-selected", String(on));
      trigger.tabIndex = on ? 0 : -1;
      trigger.dataset.state = on ? "active" : "inactive";
      trigger.classList.remove(...(on ? UNSELECTED : SELECTED));
      trigger.classList.add(...(on ? SELECTED : UNSELECTED));
      const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
      if (panel) {
        panel.hidden = !on;
        panel.dataset.state = on ? "active" : "inactive";
      }
    }
    if (focus) next.focus();
  };
  for (const trigger of triggers) {
    trigger.addEventListener("click", () => select(trigger, false));
    trigger.addEventListener("keydown", (event) => {
      const at = triggers.indexOf(trigger);
      const to =
        event.key === "ArrowRight"
          ? (at + 1) % triggers.length
          : event.key === "ArrowLeft"
            ? (at - 1 + triggers.length) % triggers.length
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? triggers.length - 1
                : -1;
      if (to < 0) return;
      event.preventDefault();
      select(triggers[to], true);
    });
  }
}

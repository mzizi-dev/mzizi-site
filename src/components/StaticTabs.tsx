import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bundu/ui/ui/tabs";

/**
 * `@bundu/ui`'s Tabs, composed once so an Astro page can use them.
 *
 * Tabs share a React context, and an Astro page renders each React component
 * it imports as its own root, so the parts cannot be composed in an `.astro`
 * file directly. This wrapper does it in one root. Each panel's content comes
 * from the Astro named slot with the tab's `value` as its name.
 *
 * Rendered to static HTML, with no `client:*` directive. Every panel is in the
 * HTML (`forceMount`), so the content survives with scripts off, and
 * `src/scripts/tabs.ts` switches them in the browser. Without JavaScript,
 * `Site.astro`'s `<noscript>` style shows every panel and hides the tab list.
 */
export interface StaticTab {
  value: string;
  label: string;
}

export interface StaticTabsProps {
  /** Stable id: React's `useId` restarts per root, so two tab sets on a page would collide. */
  id: string;
  /** Accessible name for the tab list. */
  label: string;
  tabs: StaticTab[];
  [panel: string]: unknown;
}

export default function StaticTabs({
  id,
  label,
  tabs,
  ...panels
}: StaticTabsProps) {
  return (
    <Tabs id={id} defaultValue={tabs[0]?.value} className="static-tabs">
      <TabsList aria-label={label} className="mt-8 max-w-full flex-wrap">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          forceMount
          className="mt-6"
        >
          {panels[tab.value] as React.ReactNode}
        </TabsContent>
      ))}
    </Tabs>
  );
}

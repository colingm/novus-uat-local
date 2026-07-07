/**
 * Settings page (`/app/settings`) — Phase 4 (SET-01).
 *
 * Tab composer for three URL-driven tabs: Profile, Workspace, Preferences.
 * Reads `?tab=` via `useSearchParams()`; writes via `setSearchParams(..., {
 * replace: false })` so browser back/forward navigates tab history (D-12).
 *
 * Default tab when `?tab=` is absent or invalid: `profile` — matches the
 * Phase 3 D-15 deep-link contract emitted by AppLayout's top-bar user-menu
 * "Profile" item (which navigates to `/app/settings?tab=profile`).
 *
 * router.tsx is NOT edited at the Phase 3 → Phase 4 handoff (D-01 placeholder
 * pattern). The function's named export `SettingsPage` is preserved so the
 * router import is stable.
 *
 * The three Tab targets carry `data-pendo-id` directly (S3 exception —
 * Mantine slot convention: `<Tabs.Tab>` does not go through the wrapped
 * primitive layer). The pendoId values are STILL sourced from
 * `PENDO_IDS.settings.tabs.*` — no hand-typed string literals.
 *
 * SET-02..06 are implemented by the four sub-components composed below.
 * SET-05 (pendo.identify on save) is deferred to Phase 6 with inline
 * comment markers in ProfileTab/WorkspaceTab.
 */

import React from 'react'
import { useSearchParams } from 'react-router'
import { Stack, Tabs, Title } from '@mantine/core'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import { ProfileTab } from '../../../settings/ProfileTab'
import { WorkspaceTab } from '../../../settings/WorkspaceTab'
import { PreferencesTab } from '../../../settings/PreferencesTab'

type TabValue = 'profile' | 'workspace' | 'preferences'

const VALID_TABS: readonly TabValue[] = ['profile', 'workspace', 'preferences'] as const

function parseTab(raw: string | null): TabValue {
  // T-04-04-02 mitigation: whitelist check defends against injection of
  // arbitrary strings into Mantine `<Tabs value>`. Anything not in the
  // whitelist falls back to the canonical default (D-12).
  if (raw !== null && (VALID_TABS as readonly string[]).includes(raw)) {
    return raw as TabValue
  }
  return 'profile'
}

export function SettingsPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))

  return (
    <Stack gap="lg">
      <Title order={3}>Settings</Title>

      <Tabs
        value={tab}
        onChange={(v) => {
          // Mantine hands back `string | null`. On null (impossible from a
          // <Tabs.Tab value="...">) fall back to 'profile'. replace: false so
          // browser back/forward navigates tab history naturally (D-12).
          setSearchParams({ tab: (v ?? 'profile') }, { replace: false })
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="profile" data-pendo-id={PENDO_IDS.settings.tabs.profile}>
            Profile
          </Tabs.Tab>
          <Tabs.Tab value="workspace" data-pendo-id={PENDO_IDS.settings.tabs.workspace}>
            Workspace
          </Tabs.Tab>
          <Tabs.Tab value="preferences" data-pendo-id={PENDO_IDS.settings.tabs.preferences}>
            Preferences
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" pt="lg">
          <ProfileTab />
        </Tabs.Panel>
        <Tabs.Panel value="workspace" pt="lg">
          <WorkspaceTab />
        </Tabs.Panel>
        <Tabs.Panel value="preferences" pt="lg">
          <PreferencesTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

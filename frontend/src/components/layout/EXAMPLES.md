# Layout Component Examples

These examples show the approved Anthropic implementation posture for Sub2API layout work. They are intentionally short: copy the component classes and token roles, then fill page-specific content.

## Dashboard Page

```vue
<template>
  <AppLayout>
    <section class="app-route-page space-y-6">
      <header class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-description">Operational summary for the current workspace.</p>
      </header>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article class="anthropic-stat-card">
          <span class="anthropic-stat-label">API keys</span>
          <strong class="numeric anthropic-stat-value">5</strong>
        </article>

        <article class="anthropic-stat-card">
          <span class="anthropic-stat-label">Total usage</span>
          <strong class="numeric anthropic-stat-value">1,234</strong>
        </article>

        <article class="anthropic-stat-card">
          <span class="anthropic-stat-label">Balance</span>
          <strong class="numeric anthropic-stat-value">${{ balance }}</strong>
        </article>

        <article class="anthropic-stat-card">
          <span class="anthropic-stat-label">Status</span>
          <span class="badge badge-success">Active</span>
        </article>
      </div>

      <section class="admin-material-surface space-y-3 p-4">
        <h2 class="text-base font-medium text-[var(--anthropic-fg)]">Recent activity</h2>
        <p class="text-sm text-[var(--anthropic-muted)]">No recent activity.</p>
      </section>
    </section>
  </AppLayout>
</template>
```

## Login Page

```vue
<template>
  <AuthLayout>
    <h2 class="mb-6 text-2xl font-medium text-[var(--anthropic-fg)]">Welcome back</h2>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <label class="field">
        <span>Username</span>
        <input v-model="form.username" class="input" type="text" required />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="form.password" class="input" type="password" required />
      </label>

      <button class="btn-primary w-full" type="submit" :disabled="loading">
        {{ loading ? 'Signing in' : 'Sign in' }}
      </button>
    </form>

    <template #footer>
      <p class="text-sm text-[var(--anthropic-muted)]">
        Do not have an account?
        <router-link to="/register" class="underline underline-offset-[0.22em]">
          Sign up
        </router-link>
      </p>
    </template>
  </AuthLayout>
</template>
```

## API Keys Page

```vue
<template>
  <AppLayout>
    <section class="app-route-page space-y-6">
      <header class="flex items-center justify-between gap-4">
        <div>
          <h1 class="page-title">API keys</h1>
          <p class="page-description">Create, inspect, and revoke user keys.</p>
        </div>
        <button class="btn-primary" @click="showCreateModal = true">Create key</button>
      </header>

      <div class="admin-material-surface p-2">
        <table class="data-table min-w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Status</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys" :key="key.id">
              <td>{{ key.name }}</td>
              <td class="numeric font-mono">{{ key.key }}</td>
              <td><span class="badge badge-success">{{ key.status }}</span></td>
              <td class="numeric">{{ new Date(key.created_at).toLocaleDateString() }}</td>
              <td class="text-right">
                <button class="btn-danger btn-tiny">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AppLayout>
</template>
```

## Account List Page

Account rows are domain cards. Do not flatten them into a generic official table and do not remove account-card density.

```vue
<template>
  <AppLayout>
    <section class="accounts-table-page app-route-page space-y-6">
      <div class="accounts-filter-shell">
        <div class="accounts-filter-left">
          <SearchInput />
          <Select class="filter-select" />
          <button class="filter-menu-button">Account tools</button>
        </div>
        <div class="accounts-filter-actions">
          <button class="btn-primary">Create account</button>
        </div>
      </div>

      <div class="account-card-table-frame">
        <table>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>
                <AccountQuotaInfo :account="account" />
              </td>
              <td><AccountUsageCell :account="account" /></td>
              <td><AccountStatusIndicator :account="account" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AppLayout>
</template>
```

The row-card contract is:

- wrapper paper: `#f0eee6`, 12px radius, weak border;
- row paper: `#faf9f5`, 8px radius, local hover to `#e8e6dc`;
- calling / paused status: low-saturation semantic tints only;
- no thick shadow, no colored whole-row slab, no loss of account-specific subcomponents.

## Profile Page

```vue
<template>
  <AppLayout>
    <section class="app-route-page max-w-3xl space-y-6">
      <h1 class="page-title">Profile settings</h1>

      <article class="admin-material-surface space-y-4 p-4">
        <h2 class="text-base font-medium text-[var(--anthropic-fg)]">Account information</h2>
        <dl class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="anthropic-field-readonly">
            <dt>Username</dt>
            <dd>{{ user?.username }}</dd>
          </div>
          <div class="anthropic-field-readonly">
            <dt>Email</dt>
            <dd>{{ user?.email }}</dd>
          </div>
          <div class="anthropic-field-readonly">
            <dt>Role</dt>
            <dd><span class="badge badge-gray">{{ user?.role }}</span></dd>
          </div>
          <div class="anthropic-field-readonly">
            <dt>Balance</dt>
            <dd class="numeric">${{ user?.balance.toFixed(2) }}</dd>
          </div>
        </dl>
      </article>
    </section>
  </AppLayout>
</template>
```

## Implementation Tips

1. Use `AppLayout` for authenticated pages and `AuthLayout` for auth pages.
2. Use `page-title`, `page-description`, `admin-material-surface`, `anthropic-stat-card`, `btn-primary`, `btn-secondary`, `btn-tertiary`, `btn-tiny`, and `badge-*` before writing new visual utilities.
3. Filter controls are text controls: transparent base, underline hover/open, blue outline only on keyboard focus.
4. Header and sidebar hover states use underline or paper-depth changes, not colored fills.
5. Numeric values use the mono stack and tabular figures.

---
title: Customization Files
updated: 2026-10-12
---

# Customization Files

This is the current development working-tree comparison against the already merged local `upstream/main` (`42bc7f6cffe24bcb471608e48e66b4a0afa1f882`). It accounts for the committed restoration source and current documentation updates. Production release evidence belongs to the Project Authority; this is not a new upstream fetch.

Total: **186 paths** (67 A, 119 M). A path delta is not a product feature; historical migrations, tests, whitespace and documentation are included. The former 746-path snapshot is superseded and remains available through Git.

| Classification | Files |
| --- | ---: |
| Engineering | 4 |
| Documentation | 21 |
| Backend code/config | 67 |
| Generated Ent | 18 |
| Tests | 32 |
| Frontend code/config | 42 |
| Assets | 2 |

[Feature boundaries](customization-inventory.md) and [Project Authority](../../agent.md) own the behavioral and runtime interpretation.

## Engineering

| Status | Path |
| --- | --- |
| A | [.codegraph/.gitignore](../../.codegraph/.gitignore) |
| A | [.codegraph/config.json](../../.codegraph/config.json) |
| M | [.dockerignore](../../.dockerignore) |
| M | [Dockerfile](../../Dockerfile) |

## Documentation

| Status | Path |
| --- | --- |
| A | [.llm-wiki/_index.md](../../.llm-wiki/_index.md) |
| A | [.llm-wiki/_schema.md](../../.llm-wiki/_schema.md) |
| A | [.llm-wiki/_sync-state.md](../../.llm-wiki/_sync-state.md) |
| A | [.llm-wiki/architecture/data-flow.md](../../.llm-wiki/architecture/data-flow.md) |
| A | [.llm-wiki/architecture/directory-structure.md](../../.llm-wiki/architecture/directory-structure.md) |
| A | [.llm-wiki/architecture/overview.md](../../.llm-wiki/architecture/overview.md) |
| A | [.llm-wiki/concepts/customization-files.md](../../.llm-wiki/concepts/customization-files.md) |
| A | [.llm-wiki/concepts/customization-inventory.md](../../.llm-wiki/concepts/customization-inventory.md) |
| A | [.llm-wiki/guides/development-and-testing.md](../../.llm-wiki/guides/development-and-testing.md) |
| A | [.llm-wiki/guides/oci-authentik-oidc.md](../../.llm-wiki/guides/oci-authentik-oidc.md) |
| A | [.llm-wiki/guides/oci-operations.md](../../.llm-wiki/guides/oci-operations.md) |
| A | [.llm-wiki/modules/backend.md](../../.llm-wiki/modules/backend.md) |
| A | [.llm-wiki/modules/frontend.md](../../.llm-wiki/modules/frontend.md) |
| M | [README_CN.md](../../README_CN.md) |
| A | [agent.md](../../agent.md) |
| A | [frontend-rules/README.md](../../frontend-rules/README.md) |
| M | [frontend/src/components/layout/EXAMPLES.md](../../frontend/src/components/layout/EXAMPLES.md) |
| M | [frontend/src/components/layout/INTEGRATION.md](../../frontend/src/components/layout/INTEGRATION.md) |
| M | [frontend/src/components/layout/README.md](../../frontend/src/components/layout/README.md) |
| M | [frontend/src/views/auth/README.md](../../frontend/src/views/auth/README.md) |
| M | [frontend/src/views/auth/VISUAL_GUIDE.md](../../frontend/src/views/auth/VISUAL_GUIDE.md) |

## Backend code/config

| Status | Path |
| --- | --- |
| M | [backend/cmd/server/wire_gen.go](../../backend/cmd/server/wire_gen.go) |
| M | [backend/ent/schema/api_key.go](../../backend/ent/schema/api_key.go) |
| M | [backend/ent/schema/channel_monitor.go](../../backend/ent/schema/channel_monitor.go) |
| M | [backend/ent/schema/group.go](../../backend/ent/schema/group.go) |
| M | [backend/internal/handler/admin/account_handler.go](../../backend/internal/handler/admin/account_handler.go) |
| M | [backend/internal/handler/admin/channel_handler.go](../../backend/internal/handler/admin/channel_handler.go) |
| M | [backend/internal/handler/admin/channel_monitor_handler.go](../../backend/internal/handler/admin/channel_monitor_handler.go) |
| A | [backend/internal/handler/admin/external_subscription_config_handler.go](../../backend/internal/handler/admin/external_subscription_config_handler.go) |
| M | [backend/internal/handler/admin/grok_import_probe.go](../../backend/internal/handler/admin/grok_import_probe.go) |
| M | [backend/internal/handler/admin/group_handler.go](../../backend/internal/handler/admin/group_handler.go) |
| M | [backend/internal/handler/admin/setting_handler.go](../../backend/internal/handler/admin/setting_handler.go) |
| M | [backend/internal/handler/admin/setting_handler_update.go](../../backend/internal/handler/admin/setting_handler_update.go) |
| M | [backend/internal/handler/api_key_handler.go](../../backend/internal/handler/api_key_handler.go) |
| M | [backend/internal/handler/channel_monitor_user_handler.go](../../backend/internal/handler/channel_monitor_user_handler.go) |
| M | [backend/internal/handler/dto/mappers.go](../../backend/internal/handler/dto/mappers.go) |
| M | [backend/internal/handler/dto/settings.go](../../backend/internal/handler/dto/settings.go) |
| M | [backend/internal/handler/dto/types.go](../../backend/internal/handler/dto/types.go) |
| M | [backend/internal/handler/handler.go](../../backend/internal/handler/handler.go) |
| M | [backend/internal/handler/setting_handler.go](../../backend/internal/handler/setting_handler.go) |
| M | [backend/internal/handler/wire.go](../../backend/internal/handler/wire.go) |
| M | [backend/internal/pkg/openai/instructions_gpt5_2.txt](../../backend/internal/pkg/openai/instructions_gpt5_2.txt) |
| M | [backend/internal/repository/api_key_repo.go](../../backend/internal/repository/api_key_repo.go) |
| M | [backend/internal/repository/channel_monitor_repo.go](../../backend/internal/repository/channel_monitor_repo.go) |
| M | [backend/internal/repository/channel_repo.go](../../backend/internal/repository/channel_repo.go) |
| M | [backend/internal/repository/group_repo.go](../../backend/internal/repository/group_repo.go) |
| M | [backend/internal/server/routes/admin.go](../../backend/internal/server/routes/admin.go) |
| M | [backend/internal/server/routes/auth.go](../../backend/internal/server/routes/auth.go) |
| M | [backend/internal/service/account_usage_service.go](../../backend/internal/service/account_usage_service.go) |
| M | [backend/internal/service/admin_group.go](../../backend/internal/service/admin_group.go) |
| M | [backend/internal/service/admin_service.go](../../backend/internal/service/admin_service.go) |
| M | [backend/internal/service/api_key.go](../../backend/internal/service/api_key.go) |
| M | [backend/internal/service/api_key_auth_cache.go](../../backend/internal/service/api_key_auth_cache.go) |
| M | [backend/internal/service/api_key_auth_cache_impl.go](../../backend/internal/service/api_key_auth_cache_impl.go) |
| M | [backend/internal/service/api_key_service.go](../../backend/internal/service/api_key_service.go) |
| M | [backend/internal/service/channel.go](../../backend/internal/service/channel.go) |
| M | [backend/internal/service/channel_monitor_aggregator.go](../../backend/internal/service/channel_monitor_aggregator.go) |
| M | [backend/internal/service/channel_monitor_service.go](../../backend/internal/service/channel_monitor_service.go) |
| M | [backend/internal/service/channel_monitor_types.go](../../backend/internal/service/channel_monitor_types.go) |
| M | [backend/internal/service/channel_service.go](../../backend/internal/service/channel_service.go) |
| M | [backend/internal/service/domain_constants.go](../../backend/internal/service/domain_constants.go) |
| A | [backend/internal/service/external_buzz_subscription_service.go](../../backend/internal/service/external_buzz_subscription_service.go) |
| A | [backend/internal/service/external_credit_subscription_service.go](../../backend/internal/service/external_credit_subscription_service.go) |
| A | [backend/internal/service/external_mimo_subscription_service.go](../../backend/internal/service/external_mimo_subscription_service.go) |
| A | [backend/internal/service/external_pixel_subscription_service.go](../../backend/internal/service/external_pixel_subscription_service.go) |
| A | [backend/internal/service/external_rawchat_subscription_service.go](../../backend/internal/service/external_rawchat_subscription_service.go) |
| A | [backend/internal/service/external_subscription_balance_strategy_service.go](../../backend/internal/service/external_subscription_balance_strategy_service.go) |
| A | [backend/internal/service/external_subscription_config_service.go](../../backend/internal/service/external_subscription_config_service.go) |
| A | [backend/internal/service/external_subscription_legacy_provider_configs.go](../../backend/internal/service/external_subscription_legacy_provider_configs.go) |
| A | [backend/internal/service/external_subscription_newapi_console_helpers.go](../../backend/internal/service/external_subscription_newapi_console_helpers.go) |
| A | [backend/internal/service/external_subscription_service.go](../../backend/internal/service/external_subscription_service.go) |
| M | [backend/internal/service/group.go](../../backend/internal/service/group.go) |
| A | [backend/internal/service/newapi_console_subscription_service.go](../../backend/internal/service/newapi_console_subscription_service.go) |
| A | [backend/internal/service/setting_branding.go](../../backend/internal/service/setting_branding.go) |
| M | [backend/internal/service/setting_parse.go](../../backend/internal/service/setting_parse.go) |
| M | [backend/internal/service/setting_public.go](../../backend/internal/service/setting_public.go) |
| M | [backend/internal/service/setting_service.go](../../backend/internal/service/setting_service.go) |
| M | [backend/internal/service/setting_update.go](../../backend/internal/service/setting_update.go) |
| M | [backend/internal/service/settings_view.go](../../backend/internal/service/settings_view.go) |
| M | [backend/internal/service/user_service.go](../../backend/internal/service/user_service.go) |
| M | [backend/internal/service/wire.go](../../backend/internal/service/wire.go) |
| A | [backend/migrations/108_create_codex_metadata_tables.sql](../../backend/migrations/108_create_codex_metadata_tables.sql) |
| A | [backend/migrations/144_add_logo_urls.sql](../../backend/migrations/144_add_logo_urls.sql) |
| A | [backend/migrations/145_add_channel_monitor_logo_url.sql](../../backend/migrations/145_add_channel_monitor_logo_url.sql) |
| A | [backend/migrations/151_channel_monitor_account_auto_schedule.sql](../../backend/migrations/151_channel_monitor_account_auto_schedule.sql) |
| A | [backend/migrations/152_channel_monitor_account_ids.sql](../../backend/migrations/152_channel_monitor_account_ids.sql) |
| A | [backend/migrations/231_remove_codex_metadata_tables.sql](../../backend/migrations/231_remove_codex_metadata_tables.sql) |
| A | [backend/migrations/241_remove_channel_monitor_account_auto_schedule.sql](../../backend/migrations/241_remove_channel_monitor_account_auto_schedule.sql) |

## Generated Ent

| Status | Path |
| --- | --- |
| M | [backend/ent/apikey.go](../../backend/ent/apikey.go) |
| M | [backend/ent/apikey/apikey.go](../../backend/ent/apikey/apikey.go) |
| M | [backend/ent/apikey/where.go](../../backend/ent/apikey/where.go) |
| M | [backend/ent/apikey_create.go](../../backend/ent/apikey_create.go) |
| M | [backend/ent/apikey_update.go](../../backend/ent/apikey_update.go) |
| M | [backend/ent/channelmonitor.go](../../backend/ent/channelmonitor.go) |
| M | [backend/ent/channelmonitor/channelmonitor.go](../../backend/ent/channelmonitor/channelmonitor.go) |
| M | [backend/ent/channelmonitor/where.go](../../backend/ent/channelmonitor/where.go) |
| M | [backend/ent/channelmonitor_create.go](../../backend/ent/channelmonitor_create.go) |
| M | [backend/ent/channelmonitor_update.go](../../backend/ent/channelmonitor_update.go) |
| M | [backend/ent/group.go](../../backend/ent/group.go) |
| M | [backend/ent/group/group.go](../../backend/ent/group/group.go) |
| M | [backend/ent/group/where.go](../../backend/ent/group/where.go) |
| M | [backend/ent/group_create.go](../../backend/ent/group_create.go) |
| M | [backend/ent/group_update.go](../../backend/ent/group_update.go) |
| M | [backend/ent/migrate/schema.go](../../backend/ent/migrate/schema.go) |
| M | [backend/ent/mutation.go](../../backend/ent/mutation.go) |
| M | [backend/ent/runtime/runtime.go](../../backend/ent/runtime/runtime.go) |

## Tests

| Status | Path |
| --- | --- |
| M | [backend/internal/handler/admin/account_handler_grok_refresh_test.go](../../backend/internal/handler/admin/account_handler_grok_refresh_test.go) |
| M | [backend/internal/handler/admin/account_handler_list_test.go](../../backend/internal/handler/admin/account_handler_list_test.go) |
| M | [backend/internal/handler/admin/admin_service_stub_test.go](../../backend/internal/handler/admin/admin_service_stub_test.go) |
| A | [backend/internal/handler/admin/channel_monitor_logo_contract_test.go](../../backend/internal/handler/admin/channel_monitor_logo_contract_test.go) |
| A | [backend/internal/handler/dto/custom_menu_item_test.go](../../backend/internal/handler/dto/custom_menu_item_test.go) |
| A | [backend/internal/handler/legacy_external_subscriptions_cleanup_test.go](../../backend/internal/handler/legacy_external_subscriptions_cleanup_test.go) |
| M | [backend/internal/handler/setting_handler_public_test.go](../../backend/internal/handler/setting_handler_public_test.go) |
| M | [backend/internal/repository/aliyun_captcha_verifier_test.go](../../backend/internal/repository/aliyun_captcha_verifier_test.go) |
| M | [backend/internal/server/api_contract_test.go](../../backend/internal/server/api_contract_test.go) |
| A | [backend/internal/server/routes/admin_external_subscriptions_cleanup_test.go](../../backend/internal/server/routes/admin_external_subscriptions_cleanup_test.go) |
| A | [backend/internal/server/routes/ai_search_removal_source_test.go](../../backend/internal/server/routes/ai_search_removal_source_test.go) |
| M | [backend/internal/service/api_key_service_update_fields_test.go](../../backend/internal/service/api_key_service_update_fields_test.go) |
| A | [backend/internal/service/external_pixel_subscription_service_test.go](../../backend/internal/service/external_pixel_subscription_service_test.go) |
| A | [backend/internal/service/external_subscription_config_service_test.go](../../backend/internal/service/external_subscription_config_service_test.go) |
| M | [backend/internal/service/setting_service_public_test.go](../../backend/internal/service/setting_service_public_test.go) |
| M | [backend/internal/web/embed_test.go](../../backend/internal/web/embed_test.go) |
| A | [backend/migrations/channel_monitor_logo_migration_test.go](../../backend/migrations/channel_monitor_logo_migration_test.go) |
| A | [frontend/src/api/admin/__tests__/externalSubscriptions.spec.ts](../../frontend/src/api/admin/__tests__/externalSubscriptions.spec.ts) |
| M | [frontend/src/components/charts/__tests__/TokenUsageTrend.spec.ts](../../frontend/src/components/charts/__tests__/TokenUsageTrend.spec.ts) |
| A | [frontend/src/components/common/__tests__/ProviderBrandIcon.spec.ts](../../frontend/src/components/common/__tests__/ProviderBrandIcon.spec.ts) |
| A | [frontend/src/components/layout/__tests__/externalSubscriptionAccess.spec.ts](../../frontend/src/components/layout/__tests__/externalSubscriptionAccess.spec.ts) |
| A | [frontend/src/composables/__tests__/useAccountExternalQuotaProgressSettings.spec.ts](../../frontend/src/composables/__tests__/useAccountExternalQuotaProgressSettings.spec.ts) |
| M | [frontend/src/stores/__tests__/auth.spec.ts](../../frontend/src/stores/__tests__/auth.spec.ts) |
| A | [frontend/src/utils/__tests__/externalSubscriptionMatch.spec.ts](../../frontend/src/utils/__tests__/externalSubscriptionMatch.spec.ts) |
| A | [frontend/src/utils/__tests__/externalSubscriptionQuotaProgress.spec.ts](../../frontend/src/utils/__tests__/externalSubscriptionQuotaProgress.spec.ts) |
| A | [frontend/src/utils/__tests__/providerBrandIcon.spec.ts](../../frontend/src/utils/__tests__/providerBrandIcon.spec.ts) |
| M | [frontend/src/views/admin/__tests__/AccountsView.bulkEdit.spec.ts](../../frontend/src/views/admin/__tests__/AccountsView.bulkEdit.spec.ts) |
| A | [frontend/src/views/admin/__tests__/ExternalSubscriptionsView.pixel.spec.ts](../../frontend/src/views/admin/__tests__/ExternalSubscriptionsView.pixel.spec.ts) |
| M | [frontend/src/views/admin/__tests__/GroupsView.duplicate.spec.ts](../../frontend/src/views/admin/__tests__/GroupsView.duplicate.spec.ts) |
| M | [frontend/src/views/admin/__tests__/MonitorFormDialog.accountSelector.spec.ts](../../frontend/src/views/admin/__tests__/MonitorFormDialog.accountSelector.spec.ts) |
| M | [frontend/src/views/admin/__tests__/SettingsView.spec.ts](../../frontend/src/views/admin/__tests__/SettingsView.spec.ts) |
| M | [frontend/src/views/user/__tests__/KeysView.spec.ts](../../frontend/src/views/user/__tests__/KeysView.spec.ts) |

## Frontend code/config

| Status | Path |
| --- | --- |
| M | [frontend/src/api/admin/channelMonitor.ts](../../frontend/src/api/admin/channelMonitor.ts) |
| M | [frontend/src/api/admin/channels.ts](../../frontend/src/api/admin/channels.ts) |
| A | [frontend/src/api/admin/externalSubscriptions.ts](../../frontend/src/api/admin/externalSubscriptions.ts) |
| M | [frontend/src/api/admin/index.ts](../../frontend/src/api/admin/index.ts) |
| M | [frontend/src/api/admin/settings.ts](../../frontend/src/api/admin/settings.ts) |
| A | [frontend/src/api/aiLogoPresets.ts](../../frontend/src/api/aiLogoPresets.ts) |
| M | [frontend/src/api/channelMonitor.ts](../../frontend/src/api/channelMonitor.ts) |
| A | [frontend/src/api/customMenuIconPresets.ts](../../frontend/src/api/customMenuIconPresets.ts) |
| M | [frontend/src/api/keys.ts](../../frontend/src/api/keys.ts) |
| A | [frontend/src/components/admin/account/ExternalQuotaProgressSettingsModal.vue](../../frontend/src/components/admin/account/ExternalQuotaProgressSettingsModal.vue) |
| M | [frontend/src/components/admin/monitor/MonitorFormDialog.vue](../../frontend/src/components/admin/monitor/MonitorFormDialog.vue) |
| A | [frontend/src/components/common/CustomMenuIconPicker.vue](../../frontend/src/components/common/CustomMenuIconPicker.vue) |
| M | [frontend/src/components/common/DataTable.vue](../../frontend/src/components/common/DataTable.vue) |
| M | [frontend/src/components/common/GroupBadge.vue](../../frontend/src/components/common/GroupBadge.vue) |
| M | [frontend/src/components/common/GroupOptionItem.vue](../../frontend/src/components/common/GroupOptionItem.vue) |
| M | [frontend/src/components/common/GroupSelector.vue](../../frontend/src/components/common/GroupSelector.vue) |
| A | [frontend/src/components/common/LogoPicker.vue](../../frontend/src/components/common/LogoPicker.vue) |
| A | [frontend/src/components/common/ProviderBrandIcon.vue](../../frontend/src/components/common/ProviderBrandIcon.vue) |
| M | [frontend/src/components/layout/AppSidebar.vue](../../frontend/src/components/layout/AppSidebar.vue) |
| M | [frontend/src/components/user/monitor/MonitorCard.vue](../../frontend/src/components/user/monitor/MonitorCard.vue) |
| A | [frontend/src/composables/useAccountExternalQuotaProgressSettings.ts](../../frontend/src/composables/useAccountExternalQuotaProgressSettings.ts) |
| M | [frontend/src/i18n/locales/en/index.ts](../../frontend/src/i18n/locales/en/index.ts) |
| M | [frontend/src/i18n/locales/zh/index.ts](../../frontend/src/i18n/locales/zh/index.ts) |
| M | [frontend/src/router/index.ts](../../frontend/src/router/index.ts) |
| M | [frontend/src/stores/app.ts](../../frontend/src/stores/app.ts) |
| M | [frontend/src/stores/auth.ts](../../frontend/src/stores/auth.ts) |
| M | [frontend/src/styles/onboarding.css](../../frontend/src/styles/onboarding.css) |
| M | [frontend/src/types/index.ts](../../frontend/src/types/index.ts) |
| A | [frontend/src/utils/customMenuIconPresets.ts](../../frontend/src/utils/customMenuIconPresets.ts) |
| A | [frontend/src/utils/externalSubscriptionMatch.ts](../../frontend/src/utils/externalSubscriptionMatch.ts) |
| A | [frontend/src/utils/externalSubscriptionQuotaProgress.ts](../../frontend/src/utils/externalSubscriptionQuotaProgress.ts) |
| A | [frontend/src/utils/providerBrandIcon.ts](../../frontend/src/utils/providerBrandIcon.ts) |
| M | [frontend/src/views/admin/AccountsView.vue](../../frontend/src/views/admin/AccountsView.vue) |
| M | [frontend/src/views/admin/ChannelMonitorView.vue](../../frontend/src/views/admin/ChannelMonitorView.vue) |
| M | [frontend/src/views/admin/ChannelsView.vue](../../frontend/src/views/admin/ChannelsView.vue) |
| A | [frontend/src/views/admin/ExternalSubscriptionsView.vue](../../frontend/src/views/admin/ExternalSubscriptionsView.vue) |
| M | [frontend/src/views/admin/GroupsView.vue](../../frontend/src/views/admin/GroupsView.vue) |
| M | [frontend/src/views/admin/SettingsView.vue](../../frontend/src/views/admin/SettingsView.vue) |
| M | [frontend/src/views/admin/ops/components/OpsAlertEventsCard.vue](../../frontend/src/views/admin/ops/components/OpsAlertEventsCard.vue) |
| M | [frontend/src/views/user/CustomPageView.vue](../../frontend/src/views/user/CustomPageView.vue) |
| M | [frontend/src/views/user/KeysView.vue](../../frontend/src/views/user/KeysView.vue) |
| M | [frontend/vite.config.ts](../../frontend/vite.config.ts) |

## Assets

| Status | Path |
| --- | --- |
| A | [frontend/public/brand/antigravity-logo.png](../../frontend/public/brand/antigravity-logo.png) |
| M | [frontend/src/assets/icons/stripe.svg](../../frontend/src/assets/icons/stripe.svg) |

## See Also

[Customization Inventory](customization-inventory.md)

[Frontend](../modules/frontend.md)

[Backend](../modules/backend.md)

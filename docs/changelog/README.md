# Changelog

{% include ".gitbook/includes/changelog-hint.md" %}

{% updates format="full" %}
{% update date="2026-04-06" %}
## Workspace health dashboards and webhook replay

_Version 2.7.0_

### New

* Added workspace health dashboards for sync success rate, latency, and failed jobs.
* Added webhook replay controls for failed outbound events.

### Updated

* Reduced default sync lag for high-priority records.
* Improved audit logs with actor, source, and retry metadata.

### Fixed

* Fixed duplicate contact creation during concurrent imports.
* Fixed delayed status updates for long-running sync jobs.
{% endupdate %}

{% update date="2026-01-16" %}
## Mapping templates and CSV export

_Version 2.6.0_

### New

* Added field-level mapping templates for common CRM and help desk schemas.
* Added CSV export for sync activity and error reports.

### Updated

* Improved search speed across connection logs and run history.
* Simplified onboarding for first-time workspace setup.

### Fixed

* Fixed token refresh failures for expired OAuth sessions.
* Fixed an issue where archived records could be resynced unexpectedly.
{% endupdate %}

{% update date="2025-10-24" %}
## Scheduled backfills and smarter conflict handling

_Version 2.5.0_

### New

* Added scheduled backfills for historical data imports.
* Added environment labels to separate sandbox and production connections.

### Updated

* Improved retry logic for rate-limited third-party APIs.
* Updated conflict resolution rules for records edited in two systems.

### Deprecated

* Deprecated legacy API key authentication for new integrations.
{% endupdate %}

{% update date="2025-08-12" %}
## Slack alerts and bulk pipeline controls

_Version 2.4.0_

### New

* Added Slack notifications for failed syncs and completed backfills.
* Added bulk pause and resume controls for active pipelines.

### Updated

* Improved connection diagnostics with clearer remediation steps.
* Reduced setup time for prebuilt integration recipes.

### Fixed

* Fixed missing owner mappings when importing custom objects.
* Fixed pagination issues for large datasets in HubSpot exports.
{% endupdate %}

{% update date="2025-05-30" %}
## Custom field transforms and usage summaries

_Version 2.3.0_

### New

* Added support for custom field transforms using reusable mapping rules.
* Added per-connection usage summaries in the admin dashboard.

### Updated

* Improved job queue processing during peak traffic windows.
* Updated error messages for invalid field mappings.

### Fixed

* Fixed intermittent webhook signature validation failures.
* Fixed timezone drift in scheduled sync windows.
{% endupdate %}

{% update date="2025-03-14" %}
## Record preview and multi-target field mapping

_Version 2.2.0_

### New

* Added record preview before enabling a new sync.
* Added support for mapping one source field to multiple target fields.

### Updated

* Improved step-by-step setup flow for new integrations.
* Updated sync summaries to highlight skipped and retried records.

### Fixed

* Fixed an issue where deleted records remained in retry queues.
* Fixed stale status badges in the connections view.
{% endupdate %}

{% update date="2025-01-22" %}
## Reusable sync templates and email alerts

_Version 2.1.0_

### New

* Added reusable sync templates for Salesforce, HubSpot, and Zendesk.
* Added email alerts for connection failures and disabled credentials.

### Updated

* Improved initial sync performance for large contact lists.
* Updated permission checks for workspace admins and editors.

### Fixed

* Fixed retry loops caused by malformed webhook payloads.
* Fixed inconsistent record counts in the sync overview page.
{% endupdate %}

{% update date="2024-11-27" %}
## New sync engine and native CRM integrations

_Version 2.0.0_

### New

* Launched the new Syncly sync engine with support for multi-step workflows.
* Added the first set of native integrations for Salesforce and HubSpot.

### Updated

* Improved connection setup with guided validation for required credentials.
* Updated pipeline monitoring with clearer job states and timestamps.

### Deprecated

* Deprecated the beta pipeline editor in favor of the new workflow builder.
{% endupdate %}

{% update date="2024-10-16" %}
## Public launch of Syncly

_Version 1.0.0_

### New

* Released the first public version of Syncly.
* Added core record syncing for contacts, companies, and deals.

### Updated

* Improved import reliability for large datasets.
* Updated the dashboard to show active sync status in real time.

### Deprecated

* Deprecated the closed alpha import flow used during private testing.
{% endupdate %}
{% endupdates %}

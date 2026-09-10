# VRodos Deployment Guide

This guide defines the server contract for a production VRodos WordPress installation. VRodos reports whether the contract is currently satisfied, but the plugin does not install operating-system services or edit `wp-config.php`.

The [`vrodos-web`](https://github.com/VRodos/vrodos-web) project is the reference Docker deployment. Other WordPress hosts may satisfy the same contract with systemd, cron, or a managed-host scheduler.

## Runtime requirements

Install VRodos on a host that provides:

- WordPress 6.8 or newer and PHP 8.3 or newer.
- PHP DOM, mbstring, and ZIP extensions.
- PHP `exec` for derivative generation and `proc_open` when optional Blender conversion is enabled.
- Node.js 22.13.0 or newer, available to the WordPress PHP process and scheduler user.
- The exact packages in `package-lock.json`, installed in the VRodos plugin directory with `npm ci --include=dev`. The optimizer packages are intentionally locked as development dependencies even though the installed plugin uses them at runtime.
- KTX-Software 4.3 or newer, with `toktx` available on the same `PATH` used by WordPress.
- Enough PHP memory and request-body allowance for the intended assets. The reference deployment uses a 512 MB upload limit, a 512 MB normal memory limit, and a 768 MB administrative memory limit.

After every plugin install or upgrade, run the package installation on the target operating system so native packages such as Sharp match the server:

```sh
cd /var/www/html/wp-content/plugins/VRodos
npm ci --include=dev
sudo -u www-data node scripts/check-optimizer-runtime.mjs
```

Replace `www-data` and the WordPress path with the application user and path used by the site. If Node is not on that user's `PATH`, configure the existing `vrodos_asset_optimizer_node_command` WordPress filter with the absolute Node executable path.

### Optional Blender imports

Direct GLB uploads do not require Blender. Install Blender only when authors must import Blend, FBX, OBJ, DAE, or glTF sources, then configure and test its absolute executable path under **VRodos → Settings → Asset Import**. The configured executable must be runnable by the WordPress application user.

## Persistent storage

The WordPress application user and scheduler user must be able to read and write:

- the WordPress database;
- `wp-content/uploads`, including `uploads/vrodos/published`;
- the VRodos private storage base;
- any deployment-specific runtime-build storage.

Set `VRODOS_PRIVATE_STORAGE_DIR` to an absolute directory outside `ABSPATH` and outside WordPress uploads. If it is not set, VRodos uses `vrodos-private` beside the public WordPress directory. VRodos refuses a relative, public, unavailable, or unwritable private path.

Back up the database, uploads, private storage, and runtime-build storage together. Preserve them across application and scheduler replacement. Do not treat `node_modules` as authored data; recreate it with the locked npm install on each release.

Published HTML and content-addressed media keep the cache policy documented in [storage-architecture.md](storage-architecture.md). Apache deployments must honor the generated `.htaccess`; Nginx or restricted Apache deployments must install the equivalent server rules from that document.

## Deployment health

Administrators can inspect the same checks under **VRodos → Settings → Deployment Health** and **Tools → Site Health**. The report verifies PHP and WordPress capabilities, the plugin-owned Node/KTX optimizer preflight, public and private storage, optional Blender configuration, and WordPress background-event execution.

VRodos schedules a lightweight health tick every five minutes. A tick within 15 minutes is current, a tick between 15 and 45 minutes is delayed, and a production site with no tick for more than 45 minutes is critical. This window allows one existing 30-minute derivative worker to finish without falsely declaring the scheduler dead. When POSIX UID reporting is available, VRodos also verifies that the event and web request use the same effective UID.

**Run checks now** refreshes the runtime checks and queues a unique event with a 90-second completion window. A completed probe proves that WordPress processed a scheduled event. If request-triggered WP-Cron is enabled, visitor or polling traffic may have initiated that run, so the result recommends a dedicated scheduler instead of claiming single ownership.

The health state is operational metadata stored as a non-autoloaded WordPress option. Deactivation removes the health events, and uninstall removes only health metadata; authored projects, uploads, published output, and private storage remain intact.

## Dedicated WordPress scheduler

VRodos queues imports, editor previews, and web derivatives as WordPress cron events. Production must have one scheduler owner that:

- runs as the WordPress application user;
- uses the site's existing WordPress runtime and database;
- checks due events once per minute;
- waits for the current run to finish and prevents another owner from overlapping it;
- runs `wp cron event run --due-now` through WP-CLI rather than depending on visitor traffic.

### Docker Compose

Use the `wp-cron` service in [`vrodos-web`](https://github.com/VRodos/vrodos-web). It reuses the WordPress image, database, uploads, private storage, and runtime-build volumes, runs as `www-data`, holds a lifetime `flock`, and keeps request-triggered WP-Cron enabled until its heartbeat is operational.

### systemd timer

Create `/etc/systemd/system/vrodos-wp-cron.service`:

```ini
[Unit]
Description=Run due WordPress events for VRodos
After=network.target

[Service]
Type=oneshot
User=www-data
Group=www-data
ExecStart=/usr/bin/flock -n -E 75 /var/lib/vrodos/cron/owner.lock /usr/local/bin/wp cron event run --due-now --path=/var/www/html
SuccessExitStatus=75
TimeoutStartSec=30min
```

Create `/etc/systemd/system/vrodos-wp-cron.timer`:

```ini
[Unit]
Description=Check due WordPress events once per minute

[Timer]
OnCalendar=*-*-* *:*:00
AccuracySec=1s
Persistent=true

[Install]
WantedBy=timers.target
```

Create `/var/lib/vrodos/cron`, make it writable by the application user, then enable the timer:

```sh
sudo install -d -o www-data -g www-data -m 0750 /var/lib/vrodos/cron
sudo systemctl daemon-reload
sudo systemctl enable --now vrodos-wp-cron.timer
sudo systemctl start vrodos-wp-cron.service
systemctl status vrodos-wp-cron.timer vrodos-wp-cron.service
```

### Application-user crontab

When systemd is unavailable, create a lock directory owned by the application user and install one entry in that user's crontab:

```cron
* * * * * /usr/bin/flock -n /var/lib/vrodos/cron/owner.lock /usr/local/bin/wp cron event run --due-now --path=/var/www/html >>/var/lib/vrodos/cron/cron.log 2>&1
```

Do not install the same entry in both a system crontab and a user crontab. Keep the lock path common to every possible scheduler invocation.

### Managed WordPress hosts

Configure one control-panel job to run the same WP-CLI command every minute. Confirm with the provider that the job runs as the WordPress application user and that the platform does not start a second copy while the first is still running. Use a shared `flock` when the platform permits it. A platform that offers only visitor-triggered WP-Cron or cannot prevent overlapping jobs does not satisfy the production scheduler contract.

## Safe WP-Cron handoff

Do not set `DISABLE_WP_CRON` before the dedicated scheduler is operational.

1. Leave request-triggered WP-Cron enabled.
2. Install and start exactly one dedicated scheduler.
3. Confirm its unit/job logs show successful once-per-minute WP-CLI runs as the application user.
4. Open **VRodos → Settings → Deployment Health** and run the checks. The initial result may still recommend disabling request-triggered cron because the plugin cannot attribute an event to a single owner while both paths are enabled.
5. Set `define( 'DISABLE_WP_CRON', true );` in deployment-managed WordPress configuration.
6. Run the VRodos background probe again. It must complete within 90 seconds, and the continuous sentinel must stay fresh without browser traffic.
7. If either check fails, immediately remove or set `DISABLE_WP_CRON` to `false` while repairing the dedicated scheduler.

The reference Docker deployment performs this handoff dynamically: request cron is disabled only while the scheduler heartbeat is fresh and becomes available again if that heartbeat expires.

## Deployment verification

Before accepting a release:

1. Confirm **Tools → Site Health → Status** and **VRodos → Settings → Deployment Health** report healthy runtime, optimizer, storage, and background processing.
2. Confirm the scheduler process runs as the same effective UID as WordPress when POSIX UID reporting is available. Verify the process owner through the host when it is not.
3. Start a second scheduler command against the same lock and confirm it exits without running events.
4. Import a qualifying GLB, close all VRodos/browser sessions, and observe `web-high → editor-preview → web-medium → web-low` become ready in that order without manually invoking WP-Cron.
5. Recreate or restart the application and scheduler processes, then confirm the database, uploads, private assets, published output, and derivatives remain available.
6. Verify generated client HTML remains non-cacheable and SHA-256-named published media remains immutable according to [storage-architecture.md](storage-architecture.md).

The plugin sentinel proves that WordPress executed a scheduled event. It cannot prove that the host has only one scheduler process; the deployment lock, service state, and host monitoring own that guarantee.

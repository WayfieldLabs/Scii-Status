# Scii Status

Open-source status pages by [Wayfield Labs](https://wayfield.dev).
[Wayfield Status](https://status.wayfield.dev) runs on Scii Status.

Scii Status is a small status page for services you run. It shows current health, 90-check uptime
history, response time, and optional GitHub incident history.

## Architecture

- **`scii`** — SvelteKit status page. Reads `status.json` from R2 and serves `/api/status`.
- **`scii-checker`** — cron Worker. Checks the monitors, updates R2, and optionally pulls GitHub
  incidents.
- **R2** — stores `status.json`. One bucket, no database.
- **Config** — a private JSON monitor list supplied to the checker as `MONITORS_JSON`, or a public
  `MONITORS_URL`.

The status page and checker deploy separately so the page stays fast and the cron can run without
touching the UI.

## Run locally

```bash
pnpm install
pnpm dev
```

The page runs at `http://localhost:5180`. To see data, put a `status.json` in the local R2 bucket:

```bash
pnpm exec wrangler r2 object put scii-status/status.json --file=./status.json --local --config wrangler.jsonc
```

## Deploy

1. Create an R2 bucket named `scii-status`.
2. Build and deploy the page:

   ```bash
   pnpm deploy
   ```

3. Deploy the checker:

   ```bash
   pnpm deploy:checker
   ```

4. Give the checker its monitor list. Either set a private `MONITORS_JSON` secret:

   ```bash
   cat monitors.json | pnpm exec wrangler secret put MONITORS_JSON --config checker/wrangler.toml
   ```

   or set `MONITORS_URL` to a raw JSON URL in `checker/wrangler.toml`.

5. Add a custom domain to the `scii` Worker, such as `status.example.com`.

6. Optional incidents: set `GITHUB_REPO` and a fine-grained `GITHUB_TOKEN` with Issues: Read on the
   checker. Create issues with the `incident` label.

## Config

```json
[
	{
		"id": "website",
		"name": "Website",
		"url": "https://example.com"
	},
	{
		"id": "api",
		"name": "API",
		"url": "https://api.example.com/health"
	}
]
```

The checker requests each URL and treats a `2xx` response as up. Checks run every minute.

## Branding

Set these variables on the `scii` Worker:

| Variable        | Default                |
| --------------- | ---------------------- |
| `SITE_NAME`     | `Scii Status`          |
| `SITE_URL`      | `https://wayfield.dev` |
| `GROUP_NAME`    | `Status`             |
| `CONTACT_EMAIL` | `hello@wayfield.dev`   |

## License

MIT. See [LICENSE](./LICENSE).

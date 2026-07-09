# Secure AI Validation

## Purpose

This document defines the local validation checklist for the Secure AI text-generation path.

It validates:

- TypeScript/Deno compatibility for the Supabase Edge Function;
- local Edge Function startup with required environment variables;
- authenticated invocation through Supabase Auth;
- expected safe failures;
- logging hygiene.

It does not cover image generation. Image generation remains legacy/direct until Storage, ownership, cleanup, and reference handling are designed.

## Required Tools

Install locally before validating the Edge Function:

- Deno
- Supabase CLI

Codex may not have these tools available. Do not treat frontend `npm run typecheck` as Edge Function validation because the app TypeScript check only covers `src`.

## Required Environment

The text-generation Edge Function expects these server-side variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_TEXT_MODEL` optional

These values belong in an Edge Function environment file or Supabase function secrets. They must not be added to Vite variables, frontend code, screenshots, logs, or checked-in examples.

Use a local file that is ignored by Git, for example:

```sh
supabase/functions/.env.local
```

The file should contain real local values only on the developer machine.

## Static Validation

Run Deno type checking from the repository root:

```sh
deno check supabase/functions/text-generation/index.ts
```

Expected result:

- no TypeScript/Deno errors;
- `npm:` imports resolve;
- Deno globals such as `Deno.env`, `Deno.serve`, `fetch`, and `AbortController` are accepted.

If this fails because dependencies cannot be resolved, fix local Deno/network/tooling first before changing function behavior.

## Local Function Runtime

Serve the function locally with Supabase CLI:

```sh
supabase functions serve text-generation --env-file supabase/functions/.env.local
```

If using another local env file, replace the path:

```sh
supabase functions serve text-generation --env-file <edge-env-file>
```

Expected result:

- function starts without import/runtime errors;
- no provider secret values are printed;
- startup logs do not include prompts, messages, or document content.

## Minimal Authenticated Manual Test

1. Start the local Supabase stack or point the app to a Supabase project with the current migrations applied.
2. Sign in through the app or Supabase Auth.
3. Create or open an authenticated cloud project.
4. Confirm the project exists in `projects` and is visible to the signed-in user through RLS.
5. Trigger a text AI flow from the app, preferably document chat first.
6. Confirm the request succeeds and returns assistant text.

Expected success behavior:

- the frontend calls `aiClient`;
- `aiClient` invokes `text-generation`;
- the Edge Function validates the Supabase session;
- the Edge Function validates project access through RLS;
- the provider adapter calls the provider server-side;
- the frontend does not expose provider endpoint, model, headers, payload fields, response format, or secrets.

## Expected Failure Checks

### Missing Auth

Call the function without an `Authorization` header.

Expected result:

- HTTP 401;
- normalized error code: `unauthorized`;
- no provider call;
- no prompt/message/content logged.

### Invalid Request

Call the function with an invalid body, such as missing `capability`, missing `projectId`, unsupported `capability`, empty `messages`, or a non-cloud project id.

Expected result:

- HTTP 400;
- normalized error code: `invalid_request`;
- no provider call;
- no provider details leaked.

### Missing Provider Secret

Run the function without `ANTHROPIC_API_KEY`, then make an otherwise valid authenticated request.

Expected result:

- normalized provider failure response;
- no raw provider details leaked to the frontend;
- logs identify the request id/status/code but do not include prompts, messages, document content, or secrets.

### Provider Timeout or Provider Failure

If practical, test by using an invalid provider key, blocking provider network access, or temporarily lowering the provider timeout in a throwaway local branch.

Expected result:

- timeout maps to normalized `timeout`;
- provider errors map to normalized `provider_failure`;
- no retries occur in the initial MVP path;
- provider internals are not shown to users.

Do not commit temporary timeout or failure-injection changes.

## Logging Hygiene

Logs may include:

- request id;
- user id;
- project id;
- capability;
- normalized status/code;
- duration;
- rough token usage when available.

Logs must not include:

- prompts;
- message history;
- generated private content;
- document content;
- provider secrets;
- authorization headers;
- API keys.

## Troubleshooting

- If authenticated requests fail with `unauthorized`, verify the frontend session is current and the request includes a bearer token.
- If project access fails, verify the project id is a cloud UUID owned by the signed-in user and RLS migrations are applied.
- If the function reports provider failure, verify `ANTHROPIC_API_KEY` is configured in the Edge Function environment.
- If Deno check fails on `npm:` imports, verify the local Deno version supports npm specifiers.
- If local serving works but deployed serving fails, compare local env variables with deployed function secrets.
- If the frontend shows secure AI unavailable, verify Supabase frontend configuration is present and the user is authenticated.

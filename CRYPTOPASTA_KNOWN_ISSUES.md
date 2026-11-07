# CryptoPasta — Known Issues, Security Gaps & Missing Features (MASTER v1)

**Scope:** Spring Boot 4.1 backend + React 19/Vite frontend + MySQL, audited from the files in the project (all controllers, services, repos, entities, config, all React pages/state, `application.properties`, `pom.xml`, the SQL backup of 2026-10-05, `.idea/workspace.xml`) and cross-referenced with the four ArtVerse issue docs.

**How to use this file:** every item has an ID, severity, file(s), what's wrong, and the fix direction. Status column is `[ ]` open / `[x]` fixed. **Rule carried over from ArtVerse: only flip a box to `[x]` after it's verified against the real file/DB, and update this doc in the same session as the fix.**

**Severity:** 🔴 Critical (money loss / account takeover / data exposure) · 🟠 High · 🟡 Medium · ⚪ Low

**Implementation format (agreed):** every fix gets delivered as (1) production-ready code, no placeholders → (2) step-by-step explanation → (3) execution & verification steps → (4) UI integration if needed.

---

## 0. Read this first — the honest part

1. **Your ArtVerse doc already listed plaintext passwords (1.5), no unique email (1.4), no RBAC (1.3), no input validation (5.2), `Double` for money (2.5) — and CryptoPasta repeats ALL of them.** Documenting a bug and then shipping it again in the next project is worse than not knowing. Treat this file as a pre-flight checklist for every future project.
2. **Your ArtVerse MASTER doc's status column is unreliable.** Items 1.1, 1.3, 1.4, 1.5, 1.6, 2.3, 3.3, 3.4, 5.2–5.4, 6.x, 7.3, 7.4, 9.x are marked `[x]` while their text still says "unfixed". If an evaluator opens that file you look careless. Fix the column or delete the claim.
3. **This is a money-moving app.** Even as a simulator, the current code lets any logged-in user mint money (see FIN-1, FIN-2, FIN-3). Do not demo it publicly or deploy it until Phase 1 below is done.
4. **Secrets were exposed.** `.idea/workspace.xml` contains live-looking values for the DB password, CoinGecko key, Gemini key, Razorpay key+secret. They also now sit in the Claude project files. **Rotate all of them regardless of whether the file was ever committed** (SEC-1).

---

## 1. Evidence found in your own DB backup (`cryptopasta_backup_2026-10-05.sql`)

| Finding | What it proves |
|---|---|
| `user.password` holds raw strings (and one contains a symbol-heavy real-looking password) | SEC-2 confirmed live |
| `user` table has only a PK — no UNIQUE on `email` | SEC-4 confirmed |
| Every user has `user_role = 1` (`ROLE_CUSTOMER`); no admin row exists | Admin features are unreachable AND unprotected (SEC-6) |
| `wallet_transaction` ids 52/53, 54/55, 102/103: **same `transfer_id` (payment id) credited twice** | Double-credit bug already happened (FIN-3) |
| 5 rows in `orders` with `order_status = 0` (PENDING) and matching `order_item` rows | Failed trades leave orphans — `throw new Exception` doesn't roll back (BUG-2) |
| Orders 2, 3 (price 9586) failed while wallet was ≈10k | Consistent with the buy-balance check bug requiring 2× the price (BUG-1) |
| `order_item.buy_price` for ETH = 230193 vs `coin.current_price` = 258938; BTC 7341344 vs 8064433 | Trades execute at a stale cached price, not the live one (FIN-5) |
| `asset`, `orders`, `user`… have `id bigint NOT NULL` (no AUTO_INCREMENT) + `*_seq` tables | Backup is from the old SEQUENCE schema; current entities use `IDENTITY`. Restoring this dump → inserts fail. Schema drift (OPS-3) |
| `payment_details`: IFSC `HDFC007`, bank `CBI Bank`, plaintext account number | No validation; sensitive data in clear (SEC-12) |
| 8 `payment_order` rows still PENDING | Orphaned payment orders (BUG-9) |
| `verification_code_seq` = 1, `forgot_password_token`/`two_factor_otp` empty | OTP/2FA/reset flows have **never** run successfully |

> ⚠️ This dump contains plaintext passwords + a bank account number. It must not live in the Claude project or any repo. Delete it from the project files after we're done, and keep the `.gitignore` entry (note: the entry points to `CryptoPasta-React/…` — make sure the file is actually under that path or fix the pattern).

---

## 2. SECURITY

### 2.1 Secrets & configuration

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| SEC-1 | 🔴 | [ ] | **Live credentials in `.idea/workspace.xml`** (DB pwd, CoinGecko, Gemini, Razorpay key/secret) + shared in project files. → Rotate ALL. Move to OS env / `.env` (untracked) / secrets manager. Add `.idea/` check to pre-commit (`git-secrets`/`gitleaks`). If it was ever committed: purge history (`git filter-repo`), not just delete. |
| SEC-3 | 🔴 | [ ] | **JWT secret hardcoded in `JwtConstant.java`** (low-entropy, letters only, in source control). Anyone with the repo can forge any user's token. → `jwt.secret=${JWT_SECRET}` (≥256-bit random, base64), inject via `@Value`, delete `JwtConstant.SECRET_KEY`. Rotating invalidates all existing tokens (fine). |
| SEC-14 | 🟠 | [ ] | `spring.profiles.active=dev` **hardcoded** in `application.properties` → `DevResetController` (`DELETE /dev/reset-data` truncates every user table) is live by default. Guard is only `isLoopback(remoteAddr)`: behind nginx/Docker/any reverse proxy `remoteAddr` is loopback → remote wipe by any authenticated user (CSRF is off too). → profile from env (`SPRING_PROFILES_ACTIVE`), never `dev` in prod, require `ROLE_ADMIN` on the endpoint, or delete the class before deploy. |
| SEC-15 | 🟡 | [ ] | `logging.level.org.springframework.security=DEBUG`, `spring.jpa.show-sql=true`, `System.out.println("LOGIN CONTROLLER REACHED: …email")` leak emails/internals. → INFO + slf4j, no PII in logs. |
| SEC-16 | 🟡 | [ ] | App connects as DB `root`. → Create `cryptopasta_app` user with only SELECT/INSERT/UPDATE/DELETE on that schema. |
| SEC-17 | 🟡 | [ ] | `spring.jpa.hibernate.ddl-auto=update` + no migrations. Silent schema drift (see OPS-3). → Flyway, `ddl-auto=validate`. |
| SEC-18 | ⚪ | [ ] | Env var typo `ZEMINI_API_KEY` (and `GeminiConfig` error text says `GEMINI_API_KEY`). → rename to `GEMINI_API_KEY` everywhere. |

### 2.2 Authentication

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| SEC-2 | 🔴 | [x] | **Passwords stored & compared in plaintext.** `AuthController.register` stores raw; `authenticate()` does `password.equals(userDetails.getPassword())`; `UserServiceImpl.updatePassword` stores raw. → `BCryptPasswordEncoder` (cost 12) or Argon2 bean; `encode()` on signup/reset; `matches()` on login. **Migration for existing rows:** detect non-`$2a$` hashes and rehash on next successful login, or force reset. Also use a constant-time path when user not found (dummy hash compare) to kill timing enumeration. Verified: signup stores a BCrypt hash; correct login succeeds; invalid credentials are shown in the UI. Reset flow end-to-end remains unverified under SEC-7. |
| SEC-4 | 🔴 | [x] | **No unique constraint on `user.email`**; signup does check-then-insert (race) and not case-normalised. → `@Column(unique=true,nullable=false)`, lower-case + trim on write, catch `DataIntegrityViolationException`; Flyway adds the unique index (dedupe existing rows first). |
| SEC-5 | 🔴 | [ ] | **2FA/OTP stack is non-functional AND weak.** `OtpUtils` uses `java.util.Random` (predictable) → `SecureRandom`. OTPs have no expiry, no attempt counter (6 digits = 1M guesses, `/auth/two-factor/**` is `permitAll`), compared with `equals` (not constant-time), stored in plaintext, never deleted after use, reused if row exists. → hash OTP (SHA-256 + per-row salt) or HMAC, `expiresAt` (5 min), `attempts` (max 5 → lock/invalidate), single-use, `MessageDigest.isEqual`. |
| SEC-6 | 🔴 | [x] | **No role enforcement anywhere.** `CustomUserDetailService` returns an empty authority list → JWT `authorities` is always empty. `/api/admin/withdrawal` and `/api/admin/withdrawal/{id}/proceed/{accept}` only need "authenticated" → **any user can approve/decline anyone's withdrawal.** → load `userRole` into authorities, put in JWT, `.requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")`, add `@PreAuthorize`. Seed one admin via migration (hashed password, from env). Also `String.valueOf(claims.get("authorities"))` turns a missing claim into the literal authority `"null"` — null-check it. Verified: unauthenticated admin endpoint request denied; customer token received 403; promoted admin signed in again and received 200 from `GET /api/admin/withdrawal`. |
| SEC-7 | 🟠 | [ ] | **Password reset is unreachable and unsafe.** Routes `/auth/users/reset-password/send-otp` and `/auth/users/reseet-password/verify-otp` (typo `reseet`) are not in the `permitAll` list → a user who forgot their password has no JWT → 401. The verify endpoint also demands an `Authorization` header (contradiction). Token row is reused forever (`if token == null create`), OTP never expires, token never deleted after use, `findById` null → NPE, "User not found" leaks which emails exist. → permitAll those two paths, remove the JWT header requirement, create-or-replace token each request, TTL + attempts + single-use, always respond "If the email exists, we sent a code" (identical response + timing), invalidate other sessions after reset, rate-limit. Fix route typo (breaking change → update frontend). |
| SEC-8 | 🟠 | [ ] | **JWT design:** 24h lifetime, no refresh, no revocation (logout is client-side only), no `jti`/issuer/audience, `signWith(key)` auto-selects HS512 from an 82-byte key (fine, but be explicit). `JwtProvider` builds the key with `getBytes()` (platform charset) while the validator uses UTF-8 → latent mismatch. `JwtTokenValidator` also runs on `permitAll` routes: an **expired token in the header makes `/auth/signin` return 401**. → access token 15–30 min + refresh token (rotating, stored hashed server-side, httpOnly cookie), `shouldNotFilter` for `/auth/signin|signup|reset*`, shared `Key` bean, reject if user deleted/disabled. |
| SEC-9 | 🟠 | [ ] | **JWT stored in `localStorage`** → any XSS = full account takeover. Plus `console.log(user)` in `auth/Action.js` prints the JWT to the console. → Short-lived access token in memory + refresh in `httpOnly; Secure; SameSite=Strict` cookie. If you move to cookies, **CSRF must be re-enabled** (see 2.4). Remove all `console.log` of responses (wallet, payment details with account number, JWT). |
| SEC-10 | 🟠 | [ ] | **No brute-force/abuse protection.** No rate limit on `/auth/signin`, `/auth/signup`, OTP, reset, `/ai/chat` (every call costs a Gemini request ×2 — wallet-drain vector). → Bucket4j (per IP + per account) on `/auth/**` and `/ai/chat`; progressive lockout; return 429 + `Retry-After`. |
| SEC-11 | 🟡 | [ ] | **Login leaks & status codes.** Three different messages ("Invalid credentials" / "Invalid Username" / "Invalid Password"); signup says "Email already exists…" (enumeration); login returns `201 CREATED` instead of 200. → one generic message, correct codes. |
| SEC-19 | 🟡 | [ ] | **2FA bypass-shaped logic:** `TwoFactorOtp` stores the full JWT in `jwt varchar(255)` (can be truncated or fail on length) and a JWT is minted *before* the OTP is verified. → don't mint/store a token until OTP passes; store only a session id + user id. `TwoFactorOtpRepository.findByUser(long)` compares an association to a `long` — rename to `findByUserId(Long)` (verify it even boots in that path; it has never been exercised). |
| SEC-20 | ⚪ | [ ] | `JwtTokenValidator` is declared as a `@Bean` **and** added to the chain → Boot also auto-registers it as a servlet filter. Works (OncePerRequestFilter) but is confusing. → make it non-bean or add a disabled `FilterRegistrationBean`. |

### 2.3 Authorization (IDOR / privilege abuse)

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| SEC-21 | 🔴 | [ ] | `GET /api/asset/{assetId}` — **no ownership check**; any user reads any asset (user object, quantities, buy price). Same class: `GET /api/watchlist/{watchlistId}`. → verify `asset.user.id == currentUser.id` or remove the endpoints. |
| SEC-22 | 🟠 | [ ] | `PUT /api/wallet/order/{orderID}/pay` — path var is `{orderID}` but the method param is `orderId` → binding failure (500). Even if fixed it pays any order id with no ownership check and bypasses the trade flow. → delete it (dead + dangerous). |
| SEC-23 | 🟠 | [ ] | **Wallet IDs are sequential** and used as transfer targets (`/api/wallet/{walletId}/transfer`) → enumeration. Transfers/withdrawals have no step-up auth (OTP/2FA). → public wallet code (UUID/short code) or lookup by email; require OTP above a threshold. |
| SEC-24 | 🟠 | [ ] | **Entities returned directly as API responses.** `Wallet`, `Withdrawal`, `Order`, `PaymentDetails`, `Asset`, `Watchlist` embed the full `User` (email, role, 2FA flags); `PaymentDetails` returns the **full bank account number**. → response DTOs; mask account numbers (`••••7489`); never serialize `User` nested. |
| SEC-12 | 🟠 | [ ] | **Bank details unvalidated and stored in clear** (account no., IFSC). `POST /api/payment-details` second call → unique violation 500 (no update path); `GET` returns 201. → validate IFSC regex `^[A-Z]{4}0[A-Z0-9]{6}$`, account 9–18 digits, encrypt at rest (AES-GCM, key from env) or tokenize, add PUT/DELETE. |

### 2.4 CORS, CSRF, headers, transport ("CORS attack-proofing")

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| SEC-25 | 🟠 | [ ] | **CORS is hardcoded to `localhost:5173/3000`** in `AppConfig` — prod will either break or someone "fixes" it with `*`. `allowedHeaders("*")` + `allowCredentials(true)` is wider than needed (and credentials are pointless while auth is a bearer header). → `app.cors.allowed-origins` property (comma-separated exact origins), headers = `Authorization, Content-Type` only, methods exact, `allowCredentials(false)` for header-JWT (true **only** if you move to cookies, and then never with a wildcard/reflected origin), `maxAge` ok. **Never** reflect `Origin`, never allow `null` origin, never use `allowedOriginPatterns("*")`. |
| SEC-26 | 🟠 | [ ] | **No security headers.** → Spring `headers()`: `Content-Security-Policy` (default-src 'self'; connect-src API + CoinGecko images `img-src` allowlist), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`/`frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, HSTS (prod HTTPS only). Mirror the same headers on whatever serves the Vite build (nginx). |
| SEC-27 | 🟡 | [ ] | **CSRF is disabled** — acceptable *only* because auth is a bearer header. Document it, and re-enable (cookie repository + token header) the moment tokens move to cookies (SEC-9). |
| SEC-28 | 🟡 | [ ] | No HTTPS story: Razorpay/Stripe callback URLs, CORS origins, `API_BASE_URL` are all `http://localhost`. → `server.ssl`/reverse-proxy TLS, `server.forward-headers-strategy=framework`, env-based URLs (`app.frontend-url`, `VITE_API_BASE_URL`). |
| SEC-29 | 🟡 | [ ] | `Authorization: Bearer` parsing via `token.substring(7)` repeated in every controller (`@RequestHeader("Authorization")` required → missing header = 400 not 401; JWT parsed twice per request). → read the principal from `SecurityContext` (`@AuthenticationPrincipal` / small `CurrentUserResolver`). Big cleanup across ~15 controllers. |

### 2.5 Input validation & injection surface

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| SEC-30 | 🟠 | [ ] | **`spring-boot-starter-validation` is not in `pom.xml`** and there is no `@Valid` anywhere. Signup accepts any email/password (strength is zod-only on the frontend, trivially bypassed). → add dependency; request DTOs (`SignupRequest`, `LoginRequest`, `TransferRequest`, `WithdrawalRequest`, `CreateOrderRequest`) with `@Email`, `@Size`, `@Positive`, `@DecimalMin`, `@Digits`. **Stop binding `@RequestBody User`/`WalletTransaction`/`PaymentDetails` entities** (mass-assignment surface). |
| SEC-31 | 🟡 | [ ] | `CoinServiceImpl` concatenates `coinId` straight into the CoinGecko URL (only `getMarketData` validates). `days`/`page` are unbounded ints. → regex `[a-z0-9-]{1,100}`, clamp `days ∈ {1,7,30,90,365}`, `page ≥ 1`, `UriComponentsBuilder` everywhere. |
| SEC-32 | 🟡 | [ ] | **Prompt-injection/abuse on chatbot:** user text goes to Gemini (instructions say "treat as data", which is a request not a guarantee). Output is only ever rendered as text (good). → keep the output-as-text rule, cap output tokens, strip control chars, per-user rate limit (SEC-10), log blocked prompts. |
| SEC-33 | ⚪ | [ ] | Frontend deps: `cn` (npm) is an unusual package standing in for the standard `clsx + tailwind-merge` `cn()`; `shadcn` CLI sits in `dependencies` and drags the MCP SDK/express/hono tree. → verify `cn` is what you think it is, move CLI to `devDependencies`, run `npm audit` in CI. |

---

## 3. FINANCIAL-INTEGRITY BUGS (fix before ANY demo)

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| FIN-1 | 🔴 | [x] | **Negative transfer = steal money.** `WalletController.walletToWalletTransfer` takes `req.getAmount()` (`Long`, from client JSON) with no sign check. `-500` passes the "sender has enough" check, subtracts a negative from the sender (they gain) and takes from the receiver. Also self-transfer, zero amount, no `@Transactional`, two separate wallet writes. → DTO with `@Positive`, forbid self-transfer, one `@Transactional` unit, lock both wallets **in id order** (deadlock-safe; you documented this landmine in ArtVerse 2.2). Verified so far: Postman positive/negative cases passed; browser sender/receiver transfer confirmed; temporary test balances reset to zero. Concurrency test passed as well. |
| FIN-2 | 🔴 | [x] | **Withdrawal has no server-side balance check and accepts negatives.** `POST /api/withdrawal/{amount}` → `addBalance(wallet, -amount)`; amount `-1000` *adds* money; amount > balance → negative balance. The balance check exists only in React. → server validates `0 < amount ≤ balance`, payment details must exist, hold funds then finalize on admin approval. |
| FIN-3 | 🔴 | [x] | **Free money via deposits — fixed for the demo flow.** Stripe top-ups are rejected by both UI and backend. Razorpay uses a unique per-order reference; the signed Payment Link callback is verified with `Utils.verifyPaymentLink`, and the backend fetches the payment and link to verify paid/captured status, amount, INR currency, reference, and link association before crediting. The Razorpay payment ID is unique in `payment_order`, and the order and wallet updates run transactionally under locks to prevent replay/double credit. Verified by user: Razorpay Test Mode website top-up and Postman positive/negative/replay cases passed; wallet balance and history updated correctly. **Production follow-up:** webhook-driven reconciliation is not implemented; historical duplicate ledger rows were not backfilled or reconciled. |
| FIN-4 | 🔴 | [x] | **Wallet/asset race conditions.** Concurrent trades could read the same wallet balance or asset quantity and both spend/sell it. → Trade processing now locks the user's wallet and the relevant asset row with `PESSIMISTIC_WRITE` within the transaction; wallet is locked before asset. Verified by user: FIN-4 tests passed through Postman and website UI. `@Version` and a database `CHECK (balance >= 0)` were not added; these remain optional defense-in-depth follow-ups, not part of the verified locking fix. |
| FIN-5 | 🔴 | [ ] | **Trades execute at a stale cached price.** `OrderController` → `coinService.findById()` reads the `coin` table row that only updates when someone opens that coin's detail page (`getCoinDetails` side-effect). UI shows live price from `/coins/markets`, server fills at a different (old) price → arbitrage / wrong P&L (dump: ETH 230193 vs 258938). → fetch a fresh quote server-side at order time (cached ≤ 5–10 s), reject if the client-displayed price deviates > X% (slippage guard), never trust cache for fills. |
| FIN-6 | 🟠 | [ ] | **Money types are lossy.** Wallet `BigDecimal` ✔, but `addBalance(Long)`, `WalletTransaction.amount` (`Long`), `Withdrawal.amount` (`Long`), `PaymentOrder.amount` (`Long`), `buyAsset` logs `order.getPrice().longValue()` (truncates paise) while `Coin.currentPrice`, `Asset.quantity/buyPrice`, `OrderItem.*` are `double`. Same disease as ArtVerse 2.5. → `BigDecimal` + `DECIMAL(19,2)` for money, `DECIMAL(36,18)` for crypto quantity; `RoundingMode.HALF_UP` in one `Money` util. |
| FIN-7 | 🟠 | [ ] | **Asset average price is wrong.** `AssetServiceImpl.updateAsset` adds quantity but never recomputes `buyPrice` → profit/loss on SELL is computed vs the *first* buy only. → weighted average: `(oldQty*oldPrice + newQty*newPrice)/(oldQty+newQty)`. Also unique `(user_id, coin_id)` on `asset`. |
| FIN-8 | 🟠 | [x] | **Withdrawal approve/decline is broken three ways** (`WithdrawalController.proceedWithWithdrawal` + `WithdrawalServiceImpl`): (a) decline sets status back to **PENDING** instead of `DECLINE`; (b) the refund is credited to the **admin's own wallet** (`getUserWallet(user)` where `user` = the JWT caller), not the requester; (c) no status guard → approve/decline can be replayed → unlimited refunds. → load withdrawal, require `PENDING`, set `SUCCESS`/`DECLINE`, refund `withdrawal.getUser()`'s wallet inside one locked transaction, log an audit row. Verified by user: Postman and website approve/decline cases passed, including confirming decline refunds the requester and repeat processing does not refund again. |
| FIN-9 | 🟠 | [ ] | No ledger/audit invariant. Wallet balance and transaction rows can diverge (see duplicates in dump). → every balance change writes one immutable `WalletTransaction` with signed amount in the same transaction; add a reconciliation query/test (`SUM(tx) == balance`). |
| FIN-10 | 🟡 | [ ] | `WalletTransaction` sign convention inconsistent (transfer out is negative; buy/withdrawal are positive; decline logged as `WITHDRAWAL`). `Wallet.jsx` paints every row green. → add `direction`/signed amount + proper types (`WITHDRAWAL_REFUND`), fix UI colors. |

---

## 4. FUNCTIONAL BUGS (backend)

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| BUG-1 | 🔴 | [x] | **Buy balance check is wrong.** `WalletServiceImpl.payOrderAmount`: `newBalance = balance - price; if (newBalance < price) throw` → requires balance ≥ **2× price**. Should be `balance.compareTo(price) < 0`. (Matches failed orders in dump.) |
| BUG-2 | 🔴 | [x] | **`@Transactional` doesn't roll back checked exceptions.** `OrderServiceImpl` throws `new Exception(...)`; jakarta/Spring only roll back `RuntimeException`/`Error` by default → `OrderItem` + PENDING `Order` rows stay after a failed trade. → use typed unchecked exceptions (you built these in ArtVerse: `ResourceNotFoundException`, `InvalidBidException`, `InsufficientFundsException`) or `rollbackFor = Exception.class`. Clean existing orphan rows. Use Spring's `@Transactional`, not `jakarta.transaction.Transactional`, for consistency. |
| BUG-3 | 🟠 | [ ] | `sellAsset` calls `assetToSell.getBuyPrice()` **before** the null check → NPE (500) when selling a coin you don't own. |
| BUG-4 | 🟠 | [ ] | **Signup isn't atomic.** `userRepository.save` → `createWatchlist` → `createWallet` with no `@Transactional`; failure leaves a user without a watchlist, and `findUserWatchlist` then throws "Watchlist not found!" forever. → one transaction + lazy-create fallback. |
| BUG-5 | 🟠 | [ ] | **`EmailService` can never send:** `private JavaMailSender javaMailSender;` has no `@Autowired`/constructor injection → NPE on first use, and there is no `spring.mail.*` config. (This is why email OTP "doesn't exist".) See FEAT-1. |
| BUG-6 | 🟠 | [ ] | **Enums persisted as ORDINAL** (`OrderType`, `OrderStatus`, `USER_ROLE`, `PaymentOrderStatus`, `PaymentMethod`, `WithdrawalStatus`, `WalletTransactionType`, `VerificationType` — dump shows `tinyint`). Reordering/inserting a constant silently corrupts old data. → `@Enumerated(EnumType.STRING)` + migration. |
| BUG-7 | 🟠 | [ ] | **No global exception handling** (ArtVerse 5.1 again). Every `throws Exception` → default 500 with wrong semantics; `ChatbotController` has a local handler only. → port your `GlobalExceptionHandler` + typed exceptions; consistent JSON `{status,error,message,path,timestamp}`; set `server.error.include-message=never`. |
| BUG-8 | 🟡 | [ ] | Wrong HTTP statuses: `GET /coins*`, `/api/wallet`, `/api/transactions` return **202 ACCEPTED**; `GET /api/payment-details` returns **201**. → 200. |
| BUG-9 | 🟡 | [ ] | Orphan `PaymentOrder` rows when link creation fails / user abandons (8 PENDING in dump). → create order after link success or add a scheduled expiry sweep (PENDING > 30 min → EXPIRED). |
| BUG-10 | 🟡 | [ ] | `UserServiceImpl.findUserById` checks `Optional == null` (never true) then `.get()` → `NoSuchElementException`. `AssetServiceImpl.getAssetByUserIdAndId` is a stub returning `null`. `OrderType.eqa()` is junk. `Withdrawal` imports `jdk.jfr.Enabled`. `ForgotPasswordToken` has `@GeneratedValue` yet the service sets the id manually (merge generates a new id). Dead code audit needed. |
| BUG-11 | 🟡 | [ ] | **`OrderController.getAllOrdersOfUser` ignores `orderType`/`assetSymbol`** (service just returns `findByUserId`); frontend sends `order_type`/`asset_symbol` (snake_case) while Spring expects `orderType`/`assetSymbol`. No pagination or sort server-side. |
| BUG-12 | 🟡 | [ ] | **`CoinServiceImpl`:** a new `RestTemplate()` per call with **no timeouts** → hung request threads when CoinGecko stalls; no caching → the free demo plan (~30 req/min) is exhausted by a few users (Home page = 3 calls, Watchlist polls every 60 s) → CoinGecko 429 → your 500. `getCoinDetails` does a DB write inside a "read" (cache poisoning side-effect, drives FIN-5). → one shared `RestClient` with connect/read timeouts, Caffeine cache (30–60 s TTL, per endpoint/key), serve last-known-good on 429, split "read details" from "refresh cache". |
| BUG-13 | 🟡 | [ ] | **Time handling:** `LocalDateTime.now()` in `Order`/`Withdrawal`/`WalletTransaction` (JVM zone, no zone stored) — the exact class of bug that cost you a session in ArtVerse 3.6. → store UTC (`Instant`), `hibernate.jdbc.time_zone=UTC`, convert at the UI. `WalletTransaction.date` is `LocalDate` → no time-of-day, UI sorts by id as a workaround. |
| BUG-14 | ⚪ | [ ] | Dependency smell: explicit `jackson-databind 2.22.2` while Spring Boot 4 uses Jackson 3 (`tools.jackson.*`) — you import both `com.fasterxml.jackson.core.JsonProcessingException` and `tools.jackson.databind.ObjectMapper` in `CoinController`. → remove the explicit 2.x databind (annotations stay `com.fasterxml.jackson.annotation`). Typo endpoint `getTreadingCoin`. `spring.jpa.open-in-view` should be `false`. |
| BUG-15 | ⚪ | [ ] | `Coin` entity doubles as external-API DTO + DB cache + API response, with many columns written as 0 (`ath`, `atl`…). `fully_diluted_valuation`/`circulating_supply` as `long` can overflow/lose decimals. → separate `CoinSnapshot` DTO from the cache entity. |

---

## 5. FRONTEND BUGS

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| FE-1 | 🟠 | [ ] | **Login with 2FA enabled stores `"undefined"` as JWT.** `auth/Action.js login` always does `localStorage.setItem("jwt", user.jwt)` — when backend returns `twoFactorAuthEnable:true` + `session`, `jwt` is absent. No OTP step exists in the UI. |
| FE-2 | 🟠 | [ ] | **Signup flow race.** `Signup` calls `dispatch(register)` then immediately `navigate("/signin")`. `register` success sets `auth.jwt` → App fetches the user → authenticated shell renders at `/signin` → `NotFound`. → `await` the dispatch, then either auto-login to `/` or show "check your email" (with verification, FEAT-2). |
| FE-3 | 🟠 | [ ] | **Logout doesn't clear other slices.** `LOGOUT` only resets `auth`; wallet, orders, assets, watchlist, withdrawal stay in Redux → next user in the same tab briefly sees the previous user's data. → root reducer: on `LOGOUT` return `undefined` state to every slice. |
| FE-4 | 🟠 | [ ] | **No auth error handling.** No axios interceptor: expired/invalid JWT (401/403) leaves the app half-broken; failed login shows nothing (error is stored in Redux but never rendered). → shared `api` with request interceptor (attach token) + response interceptor (401 → logout + redirect), toast on login errors. Auth actions use raw `axios` + hardcoded `http://localhost:5454` in 3 places instead of `api`/`VITE_API_BASE_URL`. |
| FE-5 | 🟠 | [ ] | **Profile page shows hardcoded fake data** (DOB 18/08/2004, nationality, address `blaze@gmail.com`, postcode `18/08/2004`) and a hardcoded `true ? Enabled : Disabled` 2-step badge. `AccountVerificationForm` has a hardcoded email and a button that only `console.log`s the OTP. Misleading to users/evaluators. → real data or remove; wire to FEAT-3. |
| FE-6 | 🟡 | [ ] | `Navbar`: `auth.user?.fullName[0].toUpperCase()` crashes if `fullName` is empty/undefined. Search button does nothing. |
| FE-7 | 🟡 | [ ] | **Home "Top Gainers / Top Losers" buttons are dead** — `activeCoinList` is `all ? coinList : top50`, so those tabs just show Top 50. |
| FE-8 | 🟡 | [ ] | **Wallet history** colors every amount green, shows `item.type` raw (`ADD_MONEY`), date-only. **Withdrawal history** paints every status green (even PENDING/DECLINE) and `item.date.toString()` prints an ISO blob. Copy-wallet-id icon isn't wired. |
| FE-9 | 🟡 | [ ] | `useSelector(store => store)` in `StockChart`, `StockDetails`, `Portfolio`, `Home`, `Navbar`, `TransferMoney` → re-renders on every state change. → narrow selectors. Several `useEffect`s have incomplete deps (`PaymentDetails`, `Withdrawal`, `StockDetails`). |
| FE-10 | 🟡 | [ ] | **TopUp/Withdraw/Transfer inputs are untyped text** (`Input` without `type="number"`, no min/max, decimals produce a 400 because backend takes `Long`). Error states are swallowed — user never learns *why* an order/top-up failed (`error.message` = "Request failed with status code 500"). → read server `message`, inline errors. |
| FE-11 | 🟡 | [ ] | **Routes aren't guarded** and unauthenticated users on any URL see `Auth` with the title picked by pathname; deep links lost after login. → `ProtectedRoute`, `redirectTo` state. Auth page route names (`/signin`, `/signup`, `/forgot-password`) aren't declared in `<Routes>`. |
| FE-12 | ⚪ | [ ] | `StockChart` `timeSeries` carries Alpha-Vantage leftovers (`keyword`, `key`) that are never used. Stray unused imports across many files. `App.css` is the Vite template leftover. Two `index.html` variants in the bundle. |
| FE-13 | ⚪ | [ ] | **Accessibility/UX:** coin row "double-click to open" (350 ms hack) is invisible on touch; no loading skeletons/empty states on Portfolio/Watchlist; Razorpay/Stripe logos hotlinked from Wikimedia (fails offline, third-party request). |

---

## 6. MISSING / INCOMPLETE FEATURES

Priority order is by value-to-effort for your resume story (security + payments + AI).

| ID | Pri | Status | Feature | What exists today → what's missing |
|---|---|---|---|---|
| FEAT-1 | P0 | [ ] | **Email OTP service (the one you named)** | `spring-boot-starter-mail` is a dependency, `EmailService` exists but is un-injected and unconfigured. → `spring.mail.host/port/username/password` from env (Gmail app password / Mailtrap in dev / SES-Brevo in prod), constructor-inject `JavaMailSender`, `@Async` send with retry + failure logging, HTML template (Thymeleaf), per-purpose OTP table (`purpose`: SIGNUP, LOGIN_2FA, ENABLE_2FA, RESET_PASSWORD, WITHDRAWAL), hashed OTP + TTL + attempts + resend cooldown (60 s), rate limit. Dev profile: log OTP to console instead of emailing. |
| FEAT-2 | P0 | [ ] | **Email verification on signup** | Users are active immediately; `is_enabled` in DB is actually the 2FA flag. → `emailVerified` column, signup → OTP → verify → then issue JWT; block trading/withdrawal until verified. |
| FEAT-3 | P0 | [ ] | **2FA end-to-end** | Backend half-built (enable endpoints, login branch). Missing: working email send (FEAT-1), UI step in `Signin` for `twoFactorAuthEnable`+`session`, real Profile toggle (enable/disable with password + OTP), recovery codes. `MOBILE` verification type has **no SMS provider** — either implement (MSG91/Twilio) or remove the enum value. ActionTypes `LOGIN_TWO_STEP_*`, `SEND_VERIFICATION_OTP_*`, `ENABLE_TWO_STEP_*`, `VERIFY_RESET_PASSWORD_*` are already defined but unused — the plan existed, the work didn't happen. |
| FEAT-4 | P0 | [ ] | **Forgot / reset / change password** | `ForgetPassword.jsx` says "Password reset is not connected yet". Backend routes exist but are unreachable (SEC-7). → full flow + "change password" in Profile (requires current password), invalidate sessions on change. |
| FEAT-5 | P0 | [x] | **Minimal admin withdrawal queue** | Verified: admin-only navigation and route, withdrawal request list, and approve/decline UI wired to the protected backend actions. Decision reason and a dedicated admin audit log are not implemented; defer those as separate follow-up scope rather than treating them as done here. |
| FEAT-6 | P1 | [ ] | **Security audit log & notifications** | No record of logins, failed logins, password/2FA changes, withdrawals. → `security_event` table + email notice on new login/withdrawal/password change. |
| FEAT-7 | P1 | [ ] | **Coin search UI** | Backend `/coins/search` + Redux `searchCoin` exist; `SearchCoin.jsx` is a stub; Navbar "Search" button does nothing. |
| FEAT-8 | P1 | [ ] | **Portfolio valuation & P&L** | Portfolio table shows quantity and a column called "Volume" (coin's market volume, not your holding). Missing: current value, invested value, unrealized/realized P&L, allocation donut, total net worth (cash + assets). |
| FEAT-9 | P1 | [ ] | **Top gainers/losers** | Buttons exist (FE-7); backend can sort `/coins/markets` by `price_change_percentage_24h`. |
| FEAT-10 | P1 | [ ] | **Real profile / KYC-lite** | Edit name, DOB, address; show masked bank details; delete account / export data. |
| FEAT-11 | P1 | [ ] | **Payments hardening** | Stripe key is the literal `STRIPE KEY` placeholder → Stripe flow cannot work today. Add webhooks for both gateways, idempotency keys, refund path, receipts. |
| FEAT-12 | P2 | [ ] | **Orders page upgrades** | Filters by type/coin/date, pagination, CSV export, cancel for pending; limit & stop orders (UI currently says "Market Order" only). |
| FEAT-13 | P2 | [ ] | **Chatbot v2** | Stateless today (no history), market-only. → conversation context, portfolio-aware answers via server-side tools (current user's holdings/orders — authorization-scoped), Redis/Caffeine cache, per-user quota, streaming (SSE). |
| FEAT-14 | P2 | [ ] | **Price alerts** | Watchlist exists; add target-price alerts → email/in-app notification (reuses FEAT-1). |
| FEAT-15 | P2 | [ ] | **Live prices** | Polling every 60 s per client. → server-side cache + SSE/WebSocket fan-out so N users cost 1 CoinGecko call. |
| FEAT-16 | P3 | [ ] | **Wallet UX** | Copy wallet code, QR, recent recipients, transfer confirmation dialog. |
| FEAT-17 | P3 | [ ] | **Light/dark toggle, i18n (en/hi), PWA** | Cosmetic; do last. |

---

## 7. OPS / QUALITY GAPS

| ID | Sev | Status | Issue → Fix |
|---|---|---|---|
| OPS-1 | 🟠 | [ ] | **Zero tests.** `src/test` has only starter deps. Money code without tests is a liability. → JUnit 5 + Testcontainers (MySQL): transfer negative amount, withdrawal > balance, double deposit replay, concurrent buys (two threads, `ExecutorService`), reset-token replay. Frontend: Vitest + RTL for auth/trade forms. |
| OPS-2 | 🟠 | [ ] | No CI. → GitHub Actions: build, test, `npm audit`, OWASP dependency-check, gitleaks. |
| OPS-3 | 🟠 | [ ] | **Schema drift / no migrations.** Backup shows old SEQUENCE-style tables; entities now use IDENTITY; `ddl-auto=update` can't alter existing id columns → fresh restore breaks. → Flyway baseline from a clean `mysqldump --no-data` of the real current DB, then versioned scripts (unique email, enums→string, decimal money, indexes, `CHECK balance>=0`, unique `(user_id,coin_id)`, unique deposit `transfer_id`). Add indexes on every FK/lookup (`orders.user_id`, `wallet_transaction.wallet_id,date`, `asset(user_id,coin_id)`). |
| OPS-4 | 🟡 | [ ] | No Docker/compose, no `.env.example`, no `/actuator/health`, no structured logs. README claims features that are stubs (2FA, password recovery, admin). → `docker-compose` (MySQL + API + web), `.env.example`, Actuator health only (secured), update README to match reality. |
| OPS-5 | 🟡 | [ ] | No API docs. → springdoc-openapi; helps the frontend↔backend alignment your `copilot-instructions.md` demands. |
| OPS-6 | ⚪ | [ ] | JDK mismatch: IDE `JDK_25` vs `pom` Java 21. Pin one toolchain (`maven-toolchains`/`.sdkmanrc`). |

---

## 8. What ArtVerse taught you that applies here (reuse, don't reinvent)

| ArtVerse fix | Apply to CryptoPasta |
|---|---|
| 2.2 / 3.1 pessimistic locks (`findByIdForUpdate`) | `Wallet`, `Asset`, `PaymentOrder` (already), `Withdrawal` (FIN-4, FIN-8) |
| 5.1 / 8.3 typed exceptions + `@ControllerAdvice` | BUG-2, BUG-7 |
| 3.6 timezone mismatch | BUG-13 |
| 2.5 `Double` money | FIN-6 |
| 2.1 `@Transactional` on every mutator | BUG-4, FIN-1, FIN-2 |
| 1.4 / 1.5 / 5.2 / 1.3 (unique email, hashing, validation, RBAC) | SEC-2, SEC-4, SEC-30, SEC-6 — **fix them for real this time** |
| "Trusting stored/derived state" theme | FIN-5 (cached price), enum ordinals (BUG-6) |
| 1.7 FK type mismatch landmine | Check `user.id` vs every FK column type before any migration (OPS-3) |
| "Docs drift from code" theme | Update this file in the same session as each fix |

---

## 9. Recommended execution order

**Phase 0 — Today (≈1 h, no feature work):** SEC-1 rotate all secrets · SEC-3 move JWT secret to env · SEC-14 remove hardcoded `dev` profile · purge dump/workspace.xml from shared locations.

**Phase 1 — Stop the money bleed (≈1–2 days):** FIN-1 → FIN-2 → FIN-3 → FIN-8 → BUG-1 → BUG-2 → FIN-4 → FIN-5 → SEC-6 (roles) → SEC-21/22/24. Ship with tests (OPS-1 subset).

**Phase 2 — Auth done properly (≈2–3 days):** SEC-2 (BCrypt + migration) → SEC-4 (+Flyway baseline OPS-3) → SEC-30 (validation + DTOs) → BUG-7 (global handler) → FEAT-1 (email service) → FEAT-2 → SEC-5 → SEC-7 + FEAT-4 → FEAT-3 → SEC-8/9 (token strategy) → SEC-10 (rate limiting) → FE-1…FE-5.

**Phase 3 — Hardening (≈1 day):** SEC-25/26/27/28 (CORS, headers, HTTPS, config) · SEC-31/32 · BUG-12 (cache + timeouts) · FIN-6/7/9/10 · BUG-6 (enum strings).

**Phase 4 — Features & polish:** FEAT-5 → FEAT-7/8/9 → FEAT-6 → FEAT-11 → FEAT-12…15 → OPS-2/4/5.

---

## 10. Not verifiable from what I was given (confirm before trusting this doc)

- `src/main/resources/application*.properties` variants, any `application-dev.properties`, and whether `.idea/` or the SQL dump were ever committed (`git log --all -- .idea/workspace.xml`).
- The shadcn `components/ui/*` files, `Store`-adjacent files not shown, and any nginx/hosting config.
- Whether the live DB matches the 2026-10-05 dump (the dump looks older than the current entities).
- Razorpay/Stripe dashboard webhook settings, and whether the email account/app password exists.

---

*Built by cross-referencing every uploaded backend/frontend file and the DB backup against the ArtVerse issue logs. Nothing here is marked fixed — all boxes start open. When we implement an item, each delivery follows: production-ready code → step-by-step explanation → execution & verification → UI integration, and this file gets updated in the same session.*

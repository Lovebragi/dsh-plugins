window.__ModuleLoader__.load({
	id: "dsh-balance-chip",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let reactDom = require("react-dom");
		let primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		//#region dsh-css:dsh-balance-chip/BalanceChip.module.css
		const css = "\
.dshBalanceMenu{box-sizing:border-box;position:relative;z-index:40;display:inline-flex;align-items:stretch;max-width:260px;padding:0;border:.5px solid var(--dsw-alias-border-l3);border-radius:999px;background:transparent}\
.dshBalanceMenu[data-open=true]{border-color:transparent}\
.dshBalanceMenu[data-open=true] .dshBalanceCompact{opacity:0;pointer-events:none}\
.dshBalanceChip{box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;height:26px;max-width:100%;padding:0 10px;border:none;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;font-weight:400;line-height:1;white-space:nowrap;cursor:pointer;transition:background .15s ease,color .15s ease,opacity .1s ease}\
.dshBalanceChip:hover{background:var(--dsw-alias-interactive-bg-hover)}\
.dshBalanceChip:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}\
.dshBalanceChipLabel{color:var(--dsw-alias-label-tertiary);font-weight:400}\
.dshBalanceChipValue{color:var(--dsw-alias-label-primary);font-weight:500;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}\
.dshBalanceChip[data-state=failed] .dshBalanceChipValue{color:var(--dsw-alias-label-tertiary)}\
.dshBalanceChip[data-state=loading]{opacity:.65}\
.dshBalanceChip[data-busy=true] .dshBalanceChipValue{opacity:.55}\
.dshBalanceChipDot{flex:none;width:5px;height:5px;margin-left:-2px;border-radius:50%;background:var(--dsw-alias-state-warning-primary,var(--dsw-alias-label-tertiary))}\
.dshBalanceCard{position:absolute;top:-4px;right:-4px;z-index:1;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;min-width:196px;padding:4px;border:.5px solid var(--dsw-alias-border-l3);border-radius:14px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-elevation-panel);animation:dshBalanceCardIn .14s ease-out}\
.dshBalanceCardButton{width:100%;justify-content:flex-end}\
.dshBalanceActions{display:flex;gap:6px;padding:2px}\
.dshBalanceAction{box-sizing:border-box;flex:1;min-width:0;height:28px;padding:0 8px;border:none;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;font-weight:400;line-height:1;white-space:nowrap;cursor:pointer}\
.dshBalanceAction:hover{background:var(--dsw-alias-interactive-bg-hover-solid,var(--dsw-alias-interactive-bg-hover))}\
.dshBalanceAction[data-primary=true]{background:var(--dsw-alias-state-business-primary);color:#fff}\
.dshBalanceAction[data-primary=true]:hover{opacity:.9}\
.dshBalanceAction:disabled{opacity:.5;cursor:default}\
@keyframes dshBalanceCardIn{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}\
[data-dsh-balance-chip=overlay]{display:none;position:absolute;top:calc(var(--dsh-frame-top-clearance,0px) + 10px);right:52px}\
body:not(:has([data-dsh-balance-chip=inline])) [data-rightbar-collapsed] [data-dsh-balance-chip=overlay]{display:inline-flex}\
.dshBalancePlatformOverlay{z-index:2000;background:var(--dsw-alias-bg-base);flex-direction:column;display:flex;position:fixed;inset:0}\
[data-windows-titlebar] .dshBalancePlatformOverlay{padding-top:var(--dsh-windows-titlebar-height)}\
.dshBalancePlatformHeader{box-sizing:border-box;border-bottom:.5px solid var(--dsw-alias-border-l1);flex:none;height:48px;padding:6px 16px;display:flex;align-items:center}\
.dshBalancePlatformBack{box-sizing:border-box;border-radius:var(--dsw-radius-sm);height:28px;color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border:none;justify-content:center;align-items:center;gap:8px;padding:0 6px;font-size:14px;line-height:22px;display:inline-flex}\
.dshBalancePlatformBack:hover{background:var(--dsw-alias-interactive-bg-hover)}\
.dshBalancePlatformViewport{min-height:0;flex:1;position:relative}\
.dshBalancePlatformStatus{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--dsw-alias-label-tertiary);font-size:14px}\
.dshBalancePlatformRetry{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);min-width:58px;height:32px;padding:0 12px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;cursor:pointer}\
";
		const tagId = "dsh-balance-chip/BalanceChip.module.css?v=4";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-balance-chip";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region dsh-balance-chip/format.js
		const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

		/**
		 * Format one Platform wallet amount. Platform's rules: positive amounts are
		 * truncated to cents and positive sub-cent amounts read `<0.01`; negative
		 * amounts are rounded with a minimum displayed magnitude of 0.01.
		 * @param raw - decimal string as returned by the Host.
		 * @param currency - `CNY` or `USD`; anything else falls back to `¥`.
		 * @returns display-ready amount such as `¥12.34`, `<¥0.01`, or `-¥3.20`.
		 */
		function formatMoney(raw, currency) {
			const symbol = currency === "USD" ? "$" : "¥";
			let text = String(raw == null ? "" : raw).trim();
			if (text === "" || !DECIMAL.test(text)) return symbol + "--";
			const negative = text.startsWith("-");
			if (negative || text.startsWith("+")) text = text.slice(1);
			if (/[eE]/.test(text)) {
				const numeric = Number((negative ? "-" : "") + text);
				if (!Number.isFinite(numeric)) return symbol + "--";
				text = Math.abs(numeric).toFixed(6);
			}
			let parts = text.split(".");
			let whole = (parts[0] || "0").replace(/^0+(?=\d)/, "");
			if (whole === "") whole = "0";
			const fraction = (parts[1] || "") + "0000";
			let cents = BigInt(whole) * BigInt(100) + BigInt(fraction.slice(0, 2));
			if (negative) {
				if (fraction.charAt(2) >= "5") cents += BigInt(1);
				if (cents === BigInt(0)) cents = BigInt(1);
			} else if (cents === BigInt(0) && /[1-9]/.test(fraction.slice(2))) {
				return "<" + symbol + "0.01";
			}
			const digits = cents.toString().padStart(3, "0");
			const wholeOut = digits.slice(0, -2).replace(/^0+(?=\d)/, "");
			const fractionOut = digits.slice(-2);
			const grouped = wholeOut.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return (negative ? "-" : "") + symbol + grouped + "." + fractionOut;
		}

		/** Sum positive bonus wallets per currency, preserving wallet order. */
		function bonusAmounts(wallets) {
			const totals = new Map();
			for (const wallet of wallets || []) {
				const raw = String(wallet == null ? "" : wallet.balance == null ? "" : wallet.balance).trim();
				if (raw === "" || raw.startsWith("-")) continue;
				const currency = wallet.currency === "USD" ? "USD" : "CNY";
				const cents = toCents(raw);
				if (cents === null || cents === BigInt(0)) continue;
				totals.set(currency, (totals.get(currency) || BigInt(0)) + cents);
			}
			return [...totals].map(([currency, cents]) => ({ currency, cents }));
		}

		/** Convert a non-negative decimal string to integer cents, truncating sub-cent digits. */
		function toCents(raw) {
			if (!DECIMAL.test(raw) || raw.startsWith("-")) return null;
			const text = raw.replace(/^[+]/, "");
			if (/[eE]/.test(text)) {
				const numeric = Number(text);
				if (!Number.isFinite(numeric) || numeric < 0) return null;
				raw = numeric.toFixed(6);
			}
			const parts = raw.split(".");
			const whole = (parts[0] || "0").replace(/^0+(?=\d)/, "") || "0";
			const fraction = (parts[1] || "") + "00";
			return BigInt(whole) * BigInt(100) + BigInt(fraction.slice(0, 2));
		}

		/** Render integer cents for one currency, reusing the display rules above. */
		function centsToMoney(cents, currency) {
			const digits = BigInt(cents).toString().padStart(3, "0");
			const whole = digits.slice(0, -2).replace(/^0+(?=\d)/, "");
			const fraction = digits.slice(-2);
			const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return (currency === "USD" ? "$" : "¥") + grouped + "." + fraction;
		}

		/** Human-readable wallet list joined for the compact chip. */
		function formatWallets(wallets) {
			const rows = [];
			for (const wallet of wallets || []) {
				if (wallet == null) continue;
				rows.push(formatMoney(wallet.balance, wallet.currency));
			}
			return rows.length === 0 ? "" : rows.join(" · ");
		}
		//#endregion

		//#region dsh-balance-chip/locales.js
		const NS = "balanceChip";
		const en = {
			label: "Balance",
			"tooltip.loading": "Loading balance…",
			"tooltip.failed": "Balance unavailable — click to retry",
			"tooltip.updated": "Updated {time}",
			"tooltip.bonus": "Bonus {amount}",
			"tooltip.refresh": "Click to refresh",
			"tooltip.signedOut": "Not signed in",
			usage: "Usage",
			topUp: "Top up",
			back: "Back to DeepSeek Harness",
			loading: "Opening…",
			openFailed: "Couldn’t open the page",
			retry: "Retry"
		};
		const zh = {
			label: "余额",
			"tooltip.loading": "正在读取余额…",
			"tooltip.failed": "余额读取失败，点击重试",
			"tooltip.updated": "更新于 {time}",
			"tooltip.bonus": "赠送 {amount}",
			"tooltip.refresh": "点击刷新",
			"tooltip.signedOut": "未登录",
			usage: "查询用量",
			topUp: "充值",
			back: "返回 DeepSeek Harness",
			loading: "正在打开…",
			openFailed: "页面打开失败",
			retry: "重试"
		};
		//#endregion

		//#region dsh-balance-chip/store.js
		/**
		 * Read the signed-in account balance through the Host's account Remote
		 * namespace (never the Platform token) and publish a small snapshot.
		 * @param ctx - client plugin context with `remote.account` and `locale`.
		 * @returns snapshot store plus a manual `refresh` action.
		 */
		function createBalanceStore(ctx) {
			let state = {
				status: "loading",
				wallets: [],
				bonusWallets: [],
				links: null,
				updatedAt: 0,
				error: null,
				refreshing: false
			};
			const listeners = new Set();
			let inflight = null;

			const publish = (next) => {
				state = next;
				for (const listener of listeners) {
					try {
						listener();
					} catch (error) {
						console.error("[balance-chip] listener failed", error);
					}
				}
			};

			const client = () => {
				const version = globalThis.__DSH_BOOT__ && globalThis.__DSH_BOOT__.release && globalThis.__DSH_BOOT__.release.version;
				return {
					version: typeof version === "string" && version !== "" ? version : "0.0.0",
					locale: ctx.locale.getSnapshot().active,
					timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60
				};
			};

			const read = () => {
				if (inflight !== null) return inflight;
				publish({ ...state, refreshing: true });
				inflight = (async () => {
					let links = state.links;
					try {
						const account = await ctx.remote.account.getState();
						if (!account.ok) throw new Error("account state failed");
						links = account.value?.links ?? null;
						if (account.value == null || account.value.status !== "credential-stored") {
							publish({ status: "signed-out", wallets: [], bonusWallets: [], links, updatedAt: Date.now(), error: null, refreshing: false });
							return;
						}
						const result = await ctx.remote.account.getBalance(client());
						if (!result.ok) throw new Error("balance failed");
						const balance = result.value;
						if (balance == null) {
							publish({ status: "signed-out", wallets: [], bonusWallets: [], links, updatedAt: Date.now(), error: null, refreshing: false });
							return;
						}
						if (balance.status === "ready") {
							publish({
								status: "ready",
								wallets: Array.isArray(balance.value) ? balance.value : [],
								bonusWallets: Array.isArray(balance.bonusWallets) ? balance.bonusWallets : [],
								links,
								updatedAt: Date.now(),
								error: null,
								refreshing: false
							});
							return;
						}
						throw new Error("balance unavailable");
					} catch (error) {
						const keepOld = state.status === "ready" || state.wallets.length > 0;
						publish({
							...state,
							status: keepOld ? "ready" : "failed",
							links,
							error: error instanceof Error ? error.message : String(error),
							refreshing: false,
							updatedAt: keepOld ? state.updatedAt : 0
						});
					} finally {
						inflight = null;
					}
				})();
				return inflight;
			};

			return {
				subscribe(listener) {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				getSnapshot() {
					return state;
				},
				read,
				refresh() {
					return read();
				}
			};
		}
		//#endregion

		//#region dsh-balance-chip/platform.js
		/** One shared native Platform page request, opened from the balance menu. */
		function createPlatformPages(native) {
			let current = null;
			const listeners = new Set();
			const publish = () => {
				for (const listener of listeners) {
					try {
						listener();
					} catch (error) {
						console.error("[balance-chip] platform listener failed", error);
					}
				}
			};
			return {
				native,
				subscribe(listener) {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				getSnapshot() {
					return current;
				},
				open(page) {
					current = { page };
					publish();
				},
				close() {
					if (current === null) return;
					current = null;
					publish();
				}
			};
		}

		/** Hosts the native Platform view while a menu action requests one. */
		function BalancePlatformHost({ pages, t }) {
			const claim = react.useSyncExternalStore(pages.subscribe, pages.getSnapshot, pages.getSnapshot);
			if (claim === null) return null;
			return react.createElement(PlatformOverlay, { pages, page: claim.page, t });
		}

		/**
		 * Draws the web-side frame (back bar plus viewport) and hands the viewport
		 * bounds to the Desktop native Platform view.
		 */
		function PlatformOverlay({ pages, page, t }) {
			const viewport = react.useRef(null);
			const [status, setStatus] = react.useState("loading");
			const [attempt, setAttempt] = react.useState(0);

			react.useEffect(() => {
				const element = viewport.current;
				if (element === null) return;
				let closed = false;
				const bounds = () => {
					const rect = element.getBoundingClientRect();
					return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
				};
				setStatus("loading");
				Promise.resolve(pages.native.open(page, bounds())).then(() => {
					if (!closed) setStatus("loaded");
				}, () => {
					if (!closed) setStatus("failed");
				});
				let observer;
				if (typeof ResizeObserver === "function") {
					observer = new ResizeObserver(() => {
						try {
							Promise.resolve(pages.native.setBounds(bounds())).catch(() => {});
						} catch {
							/* a hidden frame is not an error */
						}
					});
					observer.observe(element);
				}
				return () => {
					closed = true;
					if (observer !== undefined) observer.disconnect();
					try {
						Promise.resolve(pages.native.close()).catch(() => {});
					} catch {
						/* already closed */
					}
				};
			}, [pages, page, attempt]);

			return reactDom.createPortal(react.createElement("div", {
				className: "dshBalancePlatformOverlay",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": page === "usage" ? t("usage") : t("topUp")
			}, react.createElement("header", { className: "dshBalancePlatformHeader" }, react.createElement("button", {
				type: "button",
				className: "dshBalancePlatformBack",
				onClick: () => pages.close()
			}, react.createElement(primitives.IconChevronLeftOutlineRegular, { size: 16 }), t("back"))), react.createElement("div", {
				className: "dshBalancePlatformViewport",
				ref: viewport
			}, status === "loaded" ? null : react.createElement("div", { className: "dshBalancePlatformStatus" }, status === "failed" ? react.createElement(react.Fragment, null, t("openFailed"), react.createElement("button", {
				type: "button",
				className: "dshBalancePlatformRetry",
				onClick: () => setAttempt((value) => value + 1)
			}, t("retry"))) : t("loading")))), document.body);
		}
		//#endregion

		//#region dsh-balance-chip/BalanceChip.js
		/** Shared compact control: balance row plus the hover actions. */
		function BalanceChip({ variant, store, refresh, openPage, canNative, t }) {
			const state = react.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
			const [open, setOpen] = react.useState(false);
			const closeTimer = react.useRef(0);
			react.useEffect(() => () => {
				window.clearTimeout(closeTimer.current);
			}, []);
			if (state.status === "signed-out") return null;
			const amount = formatWallets(state.wallets);
			const value = amount === "" ? "--" : amount;
			const bonus = bonusAmounts(state.bonusWallets).map((row) => centsToMoney(row.cents, row.currency));
			let tooltip;
			if (state.status === "loading") tooltip = t("tooltip.loading");
			else if (state.status === "failed") tooltip = t("tooltip.failed");
			else {
				const parts = [];
				if (state.updatedAt > 0) {
					const time = new Date(state.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
					parts.push(t("tooltip.updated", { time }));
				}
				if (bonus.length > 0) parts.push(t("tooltip.bonus", { amount: bonus.join(" · ") }));
				if (state.error != null) parts.push(t("tooltip.failed"));
				else parts.push(t("tooltip.refresh"));
				tooltip = parts.join(" · ");
			}
			const canOpen = state.links != null || canNative === true;
			const enter = () => {
				window.clearTimeout(closeTimer.current);
				setOpen(true);
			};
			const leave = () => {
				window.clearTimeout(closeTimer.current);
				closeTimer.current = window.setTimeout(() => setOpen(false), 160);
			};
			const openAction = (page) => {
				setOpen(false);
				openPage(page);
			};
			const rowContent = () => [
				react.createElement("span", { key: "label", className: "dshBalanceChipLabel" }, t("label")),
				react.createElement("span", { key: "value", className: "dshBalanceChipValue" }, value),
				state.error != null && state.status === "ready" ? react.createElement("span", { key: "dot", className: "dshBalanceChipDot", "aria-hidden": "true" }) : null
			];
			const card = open ? react.createElement("div", { className: "dshBalanceCard" }, react.createElement("button", {
				type: "button",
				className: "dshBalanceChip dshBalanceCardButton",
				"data-state": state.status,
				"data-busy": state.refreshing ? "true" : undefined,
				"aria-label": tooltip,
				onClick: () => {
					void refresh();
				}
			}, ...rowContent()), react.createElement("div", { className: "dshBalanceActions" }, react.createElement("button", {
				type: "button",
				className: "dshBalanceAction",
				disabled: !canOpen,
				onClick: () => openAction("usage")
			}, t("usage")), react.createElement("button", {
				type: "button",
				className: "dshBalanceAction",
				"data-primary": "true",
				disabled: !canOpen,
				onClick: () => openAction("top-up")
			}, t("topUp")))) : null;
			return react.createElement("div", {
				className: "dshBalanceMenu",
				"data-dsh-balance-chip": variant,
				"data-open": open ? "true" : undefined,
				onMouseEnter: enter,
				onMouseLeave: leave,
				onFocusCapture: enter,
				onBlurCapture: (event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) leave();
				}
			}, react.createElement(primitives.Tooltip, {
				label: tooltip,
				side: "bottom",
				delayMs: 300,
				disabled: open
			}, react.createElement("button", {
				type: "button",
				className: "dshBalanceChip dshBalanceCompact",
				"data-state": state.status,
				"data-busy": state.refreshing ? "true" : undefined,
				"aria-label": tooltip,
				onClick: () => {
					void refresh();
				}
			}, ...rowContent())), card);
		}
		//#endregion

		//#region dsh-balance-chip/index.js
		/** Services required by the chip. */
		const inject = ["slots", "locale", "remote", "remote.account"];

		/**
		 * Register the balance chip in the conversation header's utility list and a
		 * top-right fallback overlay used while no session header is mounted.
		 * @param ctx - client plugin context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "balance-chip: dictionaries");
			const t = ctx.locale.bind(NS);
			const store = createBalanceStore(ctx);

			ctx.effect(() => {
				const override = globalThis.__DSH_BALANCE_CHIP__ && Number(globalThis.__DSH_BALANCE_CHIP__.refreshIntervalMs);
				const every = Number.isFinite(override) && override >= 15000 ? override : 180000;
				const refreshIfStale = () => {
					if (Date.now() - store.getSnapshot().updatedAt > 20000) void store.read();
				};
				void store.read();
				const timer = window.setInterval(() => {
					if (document.visibilityState !== "hidden") void store.read();
				}, every);
				const onFocus = () => refreshIfStale();
				const onVisibility = () => {
					if (document.visibilityState === "visible") refreshIfStale();
				};
				window.addEventListener("focus", onFocus);
				document.addEventListener("visibilitychange", onVisibility);
				return () => {
					window.clearInterval(timer);
					window.removeEventListener("focus", onFocus);
					document.removeEventListener("visibilitychange", onVisibility);
				};
			}, "balance-chip: refresh loop");

			ctx.effect(() => {
				if (typeof ctx.remote.$on !== "function") return;
				let off;
				try {
					off = ctx.remote.$on("credentials/reference-updated", () => {
						void store.read();
					});
				} catch {
					return;
				}
				return () => {
					if (typeof off === "function") off();
				};
			}, "balance-chip: credential changes");

			const native = globalThis.dshPlatform;
			const platformPages = native !== undefined && typeof native.open === "function" && typeof native.setBounds === "function" && typeof native.close === "function" ? createPlatformPages(native) : null;
			const openPage = (page) => {
				if (platformPages !== null) {
					platformPages.open(page);
					return;
				}
				const links = store.getSnapshot().links;
				const url = page === "usage" ? links?.usageUrl : links?.topUpUrl;
				if (typeof url === "string" && url !== "") window.open(url, "_blank", "noopener,noreferrer");
			};
			if (platformPages !== null) {
				ctx.effect(() => () => platformPages.close(), "balance-chip: platform page lifetime");
				ctx.slots.inject("shell.overlay", () => ctx.slots.register({
					name: "shell.overlay",
					id: "balance-chip-platform",
					locale: NS,
					inject: () => ({ pages: platformPages })
				}, BalancePlatformHost));
			}

			const shared = (variant) => ({ variant, store, refresh: () => store.read(), openPage, canNative: platformPages !== null });
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "balance-chip",
				order: 50,
				locale: NS,
				inject: () => shared("inline")
			}, BalanceChip));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "balance-chip",
				locale: NS,
				inject: () => shared("overlay")
			}, BalanceChip));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		exports.formatMoney = formatMoney;
		return module.exports;
	}
});

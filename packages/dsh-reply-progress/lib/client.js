window.__ModuleLoader__.load({
	id: "dsh-reply-progress",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		//#region dsh-css:dsh-reply-progress/ReplyProgress.module.css
		const css = "\
.dshReplyProgress{box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;min-width:150px;max-width:240px;height:20px;color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px;white-space:nowrap;opacity:1;transition:opacity .3s ease}\
.dshReplyProgress[data-phase=done]{opacity:0}\
.dshReplyProgressLabel{flex:none;overflow:hidden;text-overflow:ellipsis}\
.dshReplyProgressTrack{position:relative;flex:1 1 72px;min-width:48px;height:3px;border-radius:2px;background:var(--dsw-alias-border-l3);overflow:hidden}\
.dshReplyProgressFill{position:absolute;top:0;bottom:0;left:0;border-radius:2px;background:var(--dsw-alias-state-business-primary);transition:width .45s cubic-bezier(.22,.61,.36,1)}\
.dshReplyProgressValue{flex:none;min-width:34px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right}\
@media (max-width:700px){.dshReplyProgressLabel{display:none}.dshReplyProgress{min-width:110px}}\
@media (prefers-reduced-motion:reduce){.dshReplyProgressFill{transition:none}}\
";
		const tagId = "dsh-reply-progress/ReplyProgress.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-reply-progress";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region dsh-reply-progress/estimate.js
		/** Default target when the session has no usable completed reply to learn from. */
		const DEFAULT_TARGET = 1600;
		/** Time constant of the elapsed-time curve; ~63% of its share at this many ms. */
		const TIME_CONSTANT_MS = 30000;
		/** Hard ceiling while the turn is still open; completion renders 100. */
		const RUNNING_CEILING = 97;

		/**
		 * Estimated completion percentage for one running turn. The final length is
		 * unknowable, so this combines generated-character progress against a target
		 * learned from earlier replies with an elapsed-time floor that keeps the bar
		 * moving while tools run or output stalls.
		 * @param input - generated characters, learned target, and elapsed milliseconds.
		 * @returns whole percentage in 1..97; the caller renders 100 only on completion.
		 */
		function estimatePercent({ chars, target, elapsedMs }) {
			const safeTarget = Number.isFinite(target) && target > 0 ? target : DEFAULT_TARGET;
			const safeChars = Number.isFinite(chars) && chars > 0 ? chars : 0;
			const safeElapsed = Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
			// Character progress saturates instead of stalling: reaching the learned
			// target reads 85, twice the target 91, and longer replies creep upward.
			const charPercent = safeChars <= safeTarget ? (safeChars / safeTarget) * 85 : 85 + 12 * (1 - safeTarget / safeChars);
			const timePercent = 95 * (1 - Math.exp(-safeElapsed / TIME_CONSTANT_MS));
			return Math.max(1, Math.min(RUNNING_CEILING, Math.round(Math.max(charPercent, timePercent))));
		}

		/**
		 * Learn a character target from recent completed replies. No history means a
		 * neutral default; only substantial replies count, and the result is clamped.
		 * @param lengths - per-turn completed character counts, oldest first.
		 * @returns target characters for the running turn.
		 */
		function averageTarget(lengths) {
			const usable = (lengths || []).filter((length) => Number.isFinite(length) && length >= 120).slice(-4);
			if (usable.length === 0) return DEFAULT_TARGET;
			const average = usable.reduce((sum, length) => sum + length, 0) / usable.length;
			return Math.max(400, Math.min(8000, Math.round(average * 1.1)));
		}

		/** Count visible text of DOM nodes, preferring laid-out text over raw text. */
		function nodeLength(node) {
			if (node == null) return 0;
			if (node.hidden === true) return 0;
			if (typeof node.hasAttribute === "function" && node.hasAttribute("data-turn-process-hidden")) return 0;
			if (typeof node.getClientRects === "function" && node.getClientRects().length === 0) return 0;
			const text = typeof node.innerText === "string" ? node.innerText : node.textContent;
			return typeof text === "string" ? text.length : 0;
		}

		/** Sum visible text lengths for a node list. */
		function sumLengths(nodes) {
			let total = 0;
			for (const node of nodes || []) total += nodeLength(node);
			return total;
		}

		/** Turn number of the latest turn rendered in one chat flow. */
		function latestTurn(flow) {
			if (flow === null) return undefined;
			let latest;
			for (const node of flow.querySelectorAll("[data-chat-turn]")) {
				const turn = Number(node.getAttribute("data-chat-turn"));
				if (Number.isSafeInteger(turn) && (latest === undefined || turn > latest)) latest = turn;
			}
			return latest;
		}

		/** A closed tail appears only after the turn ends; otherwise the turn is live. */
		function turnFinished(flow, turn) {
			if (flow === null || turn === undefined) return true;
			const tail = flow.querySelector(`[data-turn-tail="${turn}"]`);
			return tail !== null && tail.hasAttribute("data-actions-reveal");
		}

		/** Current generated characters for one turn. */
		function turnLength(flow, turn) {
			if (flow === null || turn === undefined) return 0;
			const nodes = flow.querySelectorAll(`[data-chat-flow-kind="assistant-step"][data-chat-turn="${turn}"]`);
			return sumLengths(nodes);
		}

		/** Target for `turn` learned from earlier turns in the same flow. */
		function baselineFor(nodes, turn) {
			const byTurn = new Map();
			for (const node of nodes || []) {
				if (node == null || typeof node.getAttribute !== "function") continue;
				const value = Number(node.getAttribute("data-chat-turn"));
				if (!Number.isSafeInteger(value)) continue;
				byTurn.set(value, (byTurn.get(value) || 0) + nodeLength(node));
			}
			const lengths = [];
			for (const [value, length] of byTurn) {
				if (turn !== undefined && value >= turn) continue;
				lengths.push(length);
			}
			return averageTarget(lengths);
		}
		//#endregion

		//#region dsh-reply-progress/locales.js
		const NS = "replyProgress";
		const en = {
			label: "Est. progress",
			aria: "Estimated {percent}% complete",
			hint: "Estimated from generated text and elapsed time; not exact."
		};
		const zh = {
			label: "预计进度",
			aria: "预计完成 {percent}%",
			hint: "按已生成内容和已用时间估算，不是精确进度。"
		};
		//#endregion

		//#region dsh-reply-progress/ReplyProgress.js
		/**
		 * Composer-dock meter for the reply currently being generated. It mounts for
		 * any session and renders only while that session has an unfinished turn;
		 * completed replies leave no visible DOM behind.
		 */
		function ReplyProgress({ sessionId, t }) {
			const [view, setView] = react.useState(null);
			const rootRef = react.useRef(null);
			const hideTimer = react.useRef(0);

			react.useEffect(() => {
				const state = { turn: undefined, startedAt: 0, baseline: DEFAULT_TARGET, active: false };
				const finish = () => {
					if (!state.active) return;
					state.active = false;
					setView({ percent: 100, phase: "done" });
					window.clearTimeout(hideTimer.current);
					hideTimer.current = window.setTimeout(() => setView(null), 650);
				};
				const tick = () => {
					try {
						const host = rootRef.current === null ? null : rootRef.current.closest("[data-conversation-session]");
						const flow = host === null ? null : host.querySelector("[data-chat-flow]");
						const turn = latestTurn(flow);
						if (flow === null || turn === undefined || turnFinished(flow, turn)) {
							finish();
							return;
						}
						if (state.turn !== turn) {
							state.turn = turn;
							state.startedAt = Date.now();
							state.baseline = baselineFor(flow.querySelectorAll('[data-chat-flow-kind="assistant-step"]'), turn);
							window.clearTimeout(hideTimer.current);
							state.active = true;
						}
						const chars = turnLength(flow, turn);
						const percent = estimatePercent({ chars, target: state.baseline, elapsedMs: Date.now() - state.startedAt });
						setView((previous) => previous && previous.phase === "run" && previous.percent === percent ? previous : { percent, phase: "run" });
					} catch {
						/* a stale DOM must never break the composer */
					}
				};
				tick();
				const timer = window.setInterval(tick, 450);
				return () => {
					window.clearInterval(timer);
					window.clearTimeout(hideTimer.current);
				};
			}, [sessionId]);

			if (view === null) return react.createElement("span", {
				ref: rootRef,
				hidden: true,
				"data-dsh-reply-progress": "idle"
			});
			return react.createElement("div", {
				ref: rootRef,
				className: "dshReplyProgress",
				"data-phase": view.phase,
				role: "progressbar",
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-valuenow": view.percent,
				"aria-label": t("aria", { percent: view.percent }),
				title: t("hint")
			}, react.createElement("span", { className: "dshReplyProgressLabel" }, t("label")), react.createElement("span", { className: "dshReplyProgressTrack" }, react.createElement("span", {
				className: "dshReplyProgressFill",
				style: { width: `${view.percent}%` }
			})), react.createElement("span", { className: "dshReplyProgressValue" }, `${view.percent}%`));
		}
		//#endregion

		//#region dsh-reply-progress/index.js
		/** Services required by the meter. */
		const inject = ["slots", "locale"];

		/**
		 * Register the estimated reply-progress meter in the composer dock.
		 * @param ctx - client plugin context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "reply-progress: dictionaries");
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "reply-progress",
				order: -1,
				locale: NS
			}, ReplyProgress));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		exports.estimatePercent = estimatePercent;
		exports.averageTarget = averageTarget;
		exports.sumLengths = sumLengths;
		exports.baselineFor = baselineFor;
		exports.latestTurn = latestTurn;
		exports.turnFinished = turnFinished;
		exports.turnLength = turnLength;
		return module.exports;
	}
});

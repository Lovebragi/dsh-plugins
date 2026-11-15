window.__ModuleLoader__.load({
	id: "dsh-jump-to-question",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		//#region dsh-jump-to-question/JumpToQuestion.module.css
		const css = `\
.dshJumpRoot{display:inline-flex;align-items:center;min-width:0}\
.dshJumpRoot[hidden]{display:none}\
.dshJumpButton{box-sizing:border-box;display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border:none;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-tertiary);font-family:inherit;font-size:12px;font-weight:400;line-height:1;white-space:nowrap;cursor:pointer;transition:background .15s ease,color .15s ease}\
.dshJumpButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}\
.dshJumpButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}\
.dshJumpButton svg{flex:none;width:12px;height:12px;display:block}\
@media (max-width:700px){.dshJumpButton{padding:0 6px}}\
@media (prefers-reduced-motion:reduce){.dshJumpButton{transition:none}}\
`;
		const tagId = "dsh-jump-to-question/JumpToQuestion.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-jump-to-question";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region dsh-jump-to-question/dom.js
		/** Turn number of the latest turn rendered in one chat flow. */
		function latestTurn(flow) {
			if (flow == null) return undefined;
			let latest;
			for (const node of flow.querySelectorAll("[data-chat-turn]")) {
				const turn = Number(node.getAttribute("data-chat-turn"));
				if (Number.isSafeInteger(turn) && (latest === undefined || turn > latest)) latest = turn;
			}
			return latest;
		}

		/** A completed answer tail is marked with data-actions-reveal="always". */
		function turnFinished(flow, turn) {
			if (flow == null || turn === undefined) return false;
			const tail = flow.querySelector(`[data-turn-tail="${turn}"]`);
			if (tail === null) return false;
			const reveal = tail.getAttribute("data-actions-reveal");
			if (reveal === "always") return true;
			if (reveal !== "hover") return false;
			// Cards (deliverables, files) can follow the text and change the reveal
			// mode to "hover"; the turn is still complete if it produced an answer.
			for (const node of flow.querySelectorAll(`[data-chat-flow-kind="assistant-step"][data-chat-turn="${turn}"]`)) {
				const content = typeof node.innerText === "string" ? node.innerText : node.textContent;
				if (typeof content === "string" && content.trim() !== "") return true;
			}
			return false;
		}

		/** The durable user message that opened one turn. */
		function promptFor(flow, turn) {
			if (flow == null || turn === undefined) return null;
			const direct = flow.querySelector(`[data-chat-flow-kind="user"][data-chat-turn="${turn}"]`);
			if (direct !== null) return direct;
			const rows = flow.querySelectorAll(`[data-chat-turn="${turn}"]`);
			for (const row of rows) {
				if (row.getAttribute("data-chat-flow-kind") === "user") return row;
			}
			return rows.length > 0 ? rows[0] : null;
		}

		/** True when the prompt is entirely above the scrollport. */
		function isAbove(prompt, scroller) {
			if (prompt == null || scroller == null) return false;
			if (typeof prompt.getClientRects === "function" && prompt.getClientRects().length === 0) return false;
			const promptRect = prompt.getBoundingClientRect();
			const scrollerRect = scroller.getBoundingClientRect();
			return promptRect.bottom <= scrollerRect.top + 8;
		}

		/** Distance in pixels between the current scroll position and the floor. */
		function bottomDistance(scroller) {
			if (scroller == null) return 0;
			return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
		}

		/** Whether the viewport is still parked at (or very near) the end. */
		function nearBottom(scroller, threshold) {
			return bottomDistance(scroller) <= (Number.isFinite(threshold) ? threshold : 160);
		}

		/** Scroll offset that puts the prompt near the top of the scrollport. */
		function scrollTopFor(prompt, scroller, padding) {
			const gap = Number.isFinite(padding) ? padding : 20;
			const promptRect = prompt.getBoundingClientRect();
			const scrollerRect = scroller.getBoundingClientRect();
			const top = promptRect.top - scrollerRect.top + scroller.scrollTop - gap;
			const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
			return Math.max(0, Math.min(top, max));
		}

		/** Find the nearest scrollport that owns the transcript. */
		function findScroller(flow) {
			if (flow == null) return null;
			let fallback = null;
			let node = flow.parentElement;
			while (node !== null) {
				const style = typeof window !== "undefined" && typeof window.getComputedStyle === "function" ? window.getComputedStyle(node) : null;
				if (style !== null && /(auto|scroll)/.test(style.overflowY)) {
					if (node.scrollHeight > node.clientHeight + 1) return node;
					if (fallback === null) fallback = node;
				}
				node = node.parentElement;
			}
			return fallback;
		}

		/** Scroll the transcript to the prompt, respecting reduced motion. */
		function scrollToPrompt(prompt, scroller, behavior) {
			const top = scrollTopFor(prompt, scroller, 20);
			const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function"
				&& window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			const mode = reduced ? "auto" : behavior === "instant" ? "auto" : "smooth";
			if (typeof scroller.scrollTo === "function") scroller.scrollTo({ top, behavior: mode });
			else scroller.scrollTop = top;
			return top;
		}
		//#endregion

		//#region dsh-jump-to-question/locales.js
		const NS = "jumpToQuestion";
		const en = {
			label: "Back to question",
			title: "Jump to the message that started this reply"
		};
		const zh = {
			label: "回到问题",
			title: "跳到我发出这个问题的位置"
		};
		//#endregion

		//#region dsh-jump-to-question/JumpToQuestion.js
		/**
		 * Small composer-dock control that appears when the question for the latest
		 * completed answer is above the viewport. The same component watches turn
		 * completion and, when the reader is still at the floor, jumps automatically;
		 * scrolling up first opts out so reading is never yanked away.
		 */
		function JumpToQuestion({ sessionId, useSession, t }) {
			const running = typeof useSession === "function" ? useSession((snapshot) => snapshot.running) : undefined;
			const rootRef = react.useRef(null);
			const manualAt = react.useRef(0);
			const jumpAt = react.useRef(0);
			const runningRef = react.useRef(undefined);
			runningRef.current = running;
			const [show, setShow] = react.useState(false);

			react.useEffect(() => {
				const mount = rootRef.current;
				if (mount === null) return;
				const host = typeof mount.closest === "function" ? mount.closest("[data-conversation-session]") : null;
				if (host === null) return;
				// The chat flow can appear after the dock (new session) or be replaced;
				// resolve both the flow and its scrollport on every pass.
				const flowOf = () => host.querySelector("[data-chat-flow]");
				const scrollerOf = () => findScroller(flowOf());

				const override = globalThis.__DSH_JUMP_TO_QUESTION__ ?? {};
				const autoJump = override.autoJump !== false;
				const delayMs = Number.isFinite(override.delayMs) ? Math.max(0, override.delayMs) : 1400;
				const threshold = Number.isFinite(override.bottomThresholdPx) ? Math.max(0, override.bottomThresholdPx) : 32;
				const state = { turn: undefined, done: false, initial: true, timer: 0 };

				const paint = () => {
					if (Date.now() - jumpAt.current < 1800) {
						setShow(false);
						return;
					}
					if (autoJump && !state.done && state.timer !== 0) {
						setShow(false);
						return;
					}
					try {
						const flow = flowOf();
						const scroller = scrollerOf();
						if (flow === null || scroller === null) {
							setShow(false);
							return;
						}
						const turn = latestTurn(flow);
						const prompt = turn === undefined ? null : promptFor(flow, turn);
						setShow(prompt !== null && turnFinished(flow, turn) && isAbove(prompt, scroller));
					} catch {
						setShow(false);
					}
				};

				const automaticJump = (turn) => {
					state.timer = 0;
					const flow = flowOf();
					const scroller = scrollerOf();
					if (flow === null || scroller === null) return;
					if (state.done || latestTurn(flow) !== turn) return;
					const prompt = promptFor(flow, turn);
					if (prompt === null || !isAbove(prompt, scroller)) {
						state.done = true;
						paint();
						return;
					}
					if (Date.now() - manualAt.current < 2500) {
						state.done = true;
						paint();
						return;
					}
					if (!nearBottom(scroller, threshold)) {
						state.done = true;
						paint();
						return;
					}
					jumpAt.current = Date.now();
					scrollToPrompt(prompt, scroller, "instant");
					state.done = true;
					setShow(false);
				};

				const tick = () => {
					try {
						const flow = flowOf();
						if (flow === null) {
							setShow(false);
							return;
						}
						const scroller = scrollerOf();
						if (scroller === null) {
							setShow(false);
							return;
						}
						const turn = latestTurn(flow);
						if (turn === undefined) {
							setShow(false);
							return;
						}
						if (turn !== state.turn) {
							state.turn = turn;
							state.done = false;
							if (state.initial) {
								state.initial = false;
								// A session opened on history must never jump late: only a turn
								// known to be running at mount may finish into an auto-jump.
								if (runningRef.current === false || turnFinished(flow, turn)) state.done = true;
							}
							window.clearTimeout(state.timer);
							state.timer = 0;
						}
						if (!state.done && turnFinished(flow, turn)) {
							if (!autoJump) {
								state.done = true;
							} else if (state.timer === 0) {
								if (nearBottom(scroller, threshold)) {
									state.timer = window.setTimeout(() => automaticJump(turn), delayMs);
								} else {
									// The reader already moved away; show the affordance
									// immediately instead of waiting out the timer.
									state.done = true;
								}
							} else if (!nearBottom(scroller, threshold)) {
								window.clearTimeout(state.timer);
								state.timer = 0;
								state.done = true;
							}
						}
						paint();
					} catch {
						setShow(false);
					}
				};

				const hideOnScroll = () => setShow(false);

				tick();
				const interval = window.setInterval(tick, 500);
				host.addEventListener("scroll", hideOnScroll, { passive: true, capture: true });
				window.addEventListener("resize", hideOnScroll);
				return () => {
					window.clearInterval(interval);
					window.clearTimeout(state.timer);
					host.removeEventListener("scroll", hideOnScroll, { capture: true });
					window.removeEventListener("resize", hideOnScroll);
				};
			}, [sessionId]);

			const jump = () => {
				manualAt.current = Date.now();
				jumpAt.current = Date.now();
				try {
					const mount = rootRef.current;
					const host = mount === null ? null : mount.closest("[data-conversation-session]");
					const flow = host === null ? null : host.querySelector("[data-chat-flow]");
					const scroller = findScroller(flow);
					const turn = latestTurn(flow);
					const prompt = turn === undefined ? null : promptFor(flow, turn);
					if (scroller !== null && prompt !== null) scrollToPrompt(prompt, scroller);
				} catch {
					/* a stale DOM must never break the composer */
				}
				setShow(false);
			};

			return react.createElement("span", {
				ref: rootRef,
				className: "dshJumpRoot",
				hidden: show ? undefined : true
			}, show ? react.createElement("button", {
				type: "button",
				className: "dshJumpButton",
				title: t("title"),
				"aria-label": t("label"),
				onClick: jump
			}, react.createElement("svg", {
				viewBox: "0 0 12 12",
				"aria-hidden": "true"
			}, react.createElement("path", {
				d: "M6 10V2.5M2.8 5.7 6 2.5l3.2 3.2",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})), react.createElement("span", null, t("label"))) : null);
		}
		//#endregion

		//#region dsh-jump-to-question/index.js
		/** Services required by the dock control. */
		const inject = ["slots", "locale"];

		/**
		 * Register the jump control in the composer dock.
		 * @param ctx - client plugin context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "jump-to-question: dictionaries");
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "jump-to-question",
				order: 10,
				locale: NS
			}, JumpToQuestion));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		exports.latestTurn = latestTurn;
		exports.turnFinished = turnFinished;
		exports.promptFor = promptFor;
		exports.isAbove = isAbove;
		exports.bottomDistance = bottomDistance;
		exports.nearBottom = nearBottom;
		exports.scrollTopFor = scrollTopFor;
		exports.findScroller = findScroller;
		exports.scrollToPrompt = scrollToPrompt;
		return module.exports;
	}
});

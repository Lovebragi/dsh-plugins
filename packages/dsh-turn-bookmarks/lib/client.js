window.__ModuleLoader__.load({
	id: "dsh-turn-bookmarks",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let reactDom = require("react-dom");

		//#region dsh-turn-bookmarks/TurnBookmarks.module.css
		const css = `\
.dshBookmarksRail{position:fixed;z-index:8;box-sizing:border-box;width:24px;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;color:var(--dsw-alias-label-tertiary)}\
.dshBookmarksTop{position:relative;flex:none;width:24px;height:24px;padding:0;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto}\
.dshBookmarksTop:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}\
.dshBookmarksTop:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}\
.dshBookmarksTop[data-open=true]{color:#e6b23a;background:var(--dsw-alias-interactive-bg-hover)}\
.dshBookmarksTop svg{width:14px;height:14px;display:block}\
.dshBookmarksCount{position:absolute;top:-4px;right:-4px;min-width:13px;height:13px;padding:0 3px;border-radius:7px;background:#e6b23a;color:#392a08;font-family:inherit;font-size:9px;font-weight:700;line-height:13px;text-align:center;box-sizing:border-box}\
.dshBookmarksTrack{position:relative;flex:1;width:100%;min-height:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:3px 0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;pointer-events:none}\
.dshBookmarksTrack::-webkit-scrollbar{display:none}\
.dshBookmarksTrack::before{content:'';position:absolute;top:0;bottom:0;left:50%;width:1px;background:var(--dsw-alias-border-l2);opacity:.7}\
.dshBookmarksTrack[data-empty=true]::before{display:none}\
.dshBookmarksMark{position:relative;flex:none;width:24px;height:20px;padding:0;border:0;border-radius:6px;background:transparent;cursor:pointer;pointer-events:auto}\
.dshBookmarksMark::before{content:'';position:absolute;top:50%;right:0;left:0;height:3px;border-radius:3px;background:#e6b23a;box-shadow:0 0 5px rgba(230,178,58,.28);transform:translateY(-50%) scaleX(.86);transform-origin:right center;transition:transform .14s ease,opacity .14s ease}\
.dshBookmarksMark:hover::before{transform:translateY(-50%) scaleX(1)}\
.dshBookmarksMark:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}\
.dshBookmarksEmpty{display:block;width:1px;flex:1;min-height:18px}\
.dshBookmarksPanel{position:fixed;z-index:60;box-sizing:border-box;width:332px;max-height:min(60vh,460px);display:flex;flex-direction:column;overflow:hidden;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-elevation-panel);color:var(--dsw-alias-label-primary);pointer-events:auto}\
.dshBookmarksHeader{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:.5px solid var(--dsw-alias-border-l1)}\
.dshBookmarksTitle{flex:1;min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\
.dshBookmarksTotal{flex:none;color:var(--dsw-alias-label-tertiary);font-size:11px;font-variant-numeric:tabular-nums}\
.dshBookmarksClose{flex:none;width:22px;height:22px;padding:0;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:16px;line-height:1;cursor:pointer}\
.dshBookmarksClose:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}\
.dshBookmarksClose:focus-visible,.dshBookmarksRemove:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}\
.dshBookmarksList{min-height:0;overflow-y:auto;padding:4px}\
.dshBookmarksRow{display:flex;align-items:stretch;gap:2px;border-radius:8px}\
.dshBookmarksRow:hover{background:var(--dsw-alias-interactive-bg-hover)}\
.dshBookmarksOpen{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;align-items:flex-start;padding:7px 8px;border:none;border-radius:8px;background:transparent;color:inherit;font-family:inherit;text-align:left;cursor:pointer}\
.dshBookmarksOpen:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}\
.dshBookmarksTurn{color:#d8a52c;font-size:11px;font-weight:600;line-height:1.3}\
.dshBookmarksText{display:-webkit-box;width:100%;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}\
.dshBookmarksRemove{flex:none;width:26px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);font-family:inherit;font-size:16px;cursor:pointer}\
.dshBookmarksRemove:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}\
.dshBookmarksEmptyState{padding:22px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.6;text-align:center}\
[data-dsh-turn-bookmarked=true]::before{background:#e6b23a!important;transform:translateY(-50%) scaleX(1)!important}\
@media (max-width:900px){.dshBookmarksRail,.dshBookmarksPanel{display:none}}\
@media (prefers-reduced-motion:reduce){.dshBookmarksMark::before{transition:none}}\
`;
		const tagId = "dsh-turn-bookmarks/TurnBookmarks.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-turn-bookmarks";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region dsh-turn-bookmarks/dom.js
		const TURN_MARK = "button[data-index]";
		const STORE_PREFIX = "dsh-turn-bookmarks:v1:";

		/** Read the turn number from one host rail mark. */
		function turnFromMark(button) {
			const label = button.getAttribute("aria-label") ?? "";
			const match = label.match(/(\d+)/);
			if (match !== null) {
				const turn = Number(match[1]);
				if (Number.isSafeInteger(turn) && turn > 0) return turn;
			}
			const rawIndex = button.getAttribute("data-index");
			if (rawIndex === null || rawIndex === "") return undefined;
			const index = Number(rawIndex);
			if (!Number.isSafeInteger(index) || index < 0) return undefined;
			// A label without digits should not silently become index + 1:
			// calibrate against any rendered sibling that has both a label and
			// an index, so trimmed/imported logs still map to the right turn.
			const nav = typeof button.closest === "function" ? button.closest("nav") : null;
			if (nav !== null) {
				for (const sibling of nav.querySelectorAll(TURN_MARK)) {
					if (sibling === button) continue;
					const siblingLabel = sibling.getAttribute("aria-label") ?? "";
					const siblingMatch = siblingLabel.match(/(\d+)/);
					const siblingIndex = Number(sibling.getAttribute("data-index"));
					if (siblingMatch !== null && Number.isSafeInteger(siblingIndex)) {
						return Number(siblingMatch[1]) + (index - siblingIndex);
					}
				}
			}
			return undefined;
		}

		/** Find the current session's conversation host. */
		function findHost(sessionId) {
			let best = null;
			let bestArea = -1;
			for (const element of document.querySelectorAll("[data-conversation-session]")) {
				if (sessionId !== undefined && element.getAttribute("data-conversation-session") !== sessionId) continue;
				const rect = element.getBoundingClientRect();
				const area = rect.width * rect.height;
				if (area > bestArea) {
					best = element;
					bestArea = area;
				}
			}
			return best;
		}

		/** Find the turn-navigation rail inside one conversation host. */
		function findRailNav(host) {
			if (host === null) return null;
			for (const nav of host.querySelectorAll("nav")) {
				const marks = nav.querySelectorAll(TURN_MARK);
				if (marks.length > 0 && turnFromMark(marks[0]) !== undefined) return nav;
			}
			return null;
		}

		/** Find the rendered mark for one turn, if the rail has virtualized it. */
		function markForTurn(nav, turn) {
			if (nav === null) return null;
			for (const button of nav.querySelectorAll(TURN_MARK)) {
				if (turnFromMark(button) === turn) return button;
			}
			return null;
		}

		/** Wait for virtualization, then click the host mark for a turn. */
		function clickMarkWhenReady(nav, turn, attempt = 0) {
			if (!nav.isConnected) return;
			const mark = markForTurn(nav, turn);
			if (mark !== null) {
				mark.click();
				return;
			}
			if (attempt >= 4) return;
			window.setTimeout(() => clickMarkWhenReady(nav, turn, attempt + 1), 40);
		}

		/** The nearest actual scrollport around the chat flow. */
		function findScroller(host) {
			if (host === null) return null;
			const flow = host.querySelector("[data-chat-flow]");
			if (flow === null) return null;
			let node = flow.parentElement;
			while (node !== null) {
				const style = window.getComputedStyle(node);
				if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) return node;
				node = node.parentElement;
			}
			return null;
		}

		/** Scroll a loaded prompt to the top of its scrollport. */
		function scrollToPrompt(prompt, scroller) {
			if (prompt === null || scroller === null) return;
			const promptRect = prompt.getBoundingClientRect();
			const scrollerRect = scroller.getBoundingClientRect();
			const top = Math.max(0, Math.min(
				promptRect.top - scrollerRect.top + scroller.scrollTop - 20,
				Math.max(0, scroller.scrollHeight - scroller.clientHeight)
			));
			const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			if (typeof scroller.scrollTo === "function") scroller.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
			else scroller.scrollTop = top;
		}

		/** Short single-line preview of a turn's user prompt. */
		function previewFor(host, turn) {
			if (host === null) return "";
			const node = host.querySelector(`[data-chat-flow-kind="user"][data-chat-turn="${turn}"]`);
			if (node === null) return "";
			const raw = typeof node.innerText === "string" ? node.innerText : node.textContent;
			return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 180);
		}

		/** Estimate the virtual rail index for a turn from a rendered mark. */
		function railIndexFor(nav, turn) {
			for (const button of nav.querySelectorAll(TURN_MARK)) {
				const renderedTurn = turnFromMark(button);
				const index = Number(button.getAttribute("data-index"));
				if (renderedTurn !== undefined && Number.isSafeInteger(index)) return index + (turn - renderedTurn);
			}
			return Math.max(0, turn - 1);
		}

		/** Navigate to a turn, preferring the host rail's own paging/navigation. */
		function navigateToTurn(sessionId, turn) {
			const host = findHost(sessionId);
			if (host === null) return false;
			const nav = findRailNav(host);
			if (nav !== null) {
				const direct = markForTurn(nav, turn);
				if (direct !== null) {
					direct.click();
					return true;
				}
			}
			const prompt = host.querySelector(`[data-chat-flow-kind="user"][data-chat-turn="${turn}"]`);
			if (prompt !== null) {
				const scroller = findScroller(host);
				if (scroller !== null) {
					scrollToPrompt(prompt, scroller);
					return true;
				}
			}
			if (nav === null || nav.getBoundingClientRect().width === 0) return false;
			const scroller = nav.querySelector("div");
			if (scroller === null) return false;
			// The rail is a 10px-pitch virtual list. Bring the calibrated index
			// into view, wait for the virtualizer to render it, then use the host's
			// own mark click so history paging and landing behavior stay intact.
			scroller.scrollTop = Math.max(0, railIndexFor(nav, turn) * 10 - scroller.clientHeight / 2);
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => clickMarkWhenReady(nav, turn));
			});
			return true;
		}

		/** Paint gold on the host rail marks for the bookmarked turns. */
		function syncMarks(host, items) {
			if (host === null) return;
			const nav = findRailNav(host);
			if (nav === null) return;
			const turns = new Set(items.map((item) => item.turn));
			for (const button of nav.querySelectorAll(TURN_MARK)) {
				const turn = turnFromMark(button);
				if (turn !== undefined && turns.has(turn)) button.setAttribute("data-dsh-turn-bookmarked", "true");
				else button.removeAttribute("data-dsh-turn-bookmarked");
			}
		}

		function storageKey(sessionId) {
			return STORE_PREFIX + String(sessionId ?? "unknown");
		}

		/** Load and normalize one session's bookmarks. */
		function readBookmarks(sessionId) {
			try {
				const raw = window.localStorage.getItem(storageKey(sessionId));
				if (raw === null) return [];
				const value = JSON.parse(raw);
				if (!Array.isArray(value)) return [];
				const byTurn = new Map();
				for (const entry of value) {
					const turn = typeof entry === "number" ? entry : Number(entry?.turn);
					if (!Number.isSafeInteger(turn) || turn < 1) continue;
					const text = typeof entry === "object" && entry !== null && typeof entry.text === "string" ? entry.text.slice(0, 180) : "";
					if (!byTurn.has(turn)) byTurn.set(turn, { turn, text });
				}
				return [...byTurn.values()].sort((left, right) => left.turn - right.turn);
			} catch {
				return [];
			}
		}

		function writeBookmarks(sessionId, items) {
			try {
				window.localStorage.setItem(storageKey(sessionId), JSON.stringify(items));
			} catch {
				/* private mode / quota: keep the in-memory state */
			}
		}
		//#endregion

		//#region dsh-turn-bookmarks/locales.js
		const NS = "turnBookmarks";
		const en = {
			open: "Bookmarked turns",
			panel: "Bookmarked turns",
			close: "Close",
			empty: "No bookmarks yet. Right-click a turn marker on the right to save one.",
			turn: "Turn {turn}",
			unloaded: "Not loaded yet — open to load this turn",
			remove: "Remove bookmark"
		};
		const zh = {
			open: "收藏的回合",
			panel: "收藏的回合",
			close: "关闭",
			empty: "还没有收藏。右键右侧的回合刻度，就能把那一轮存到这里。",
			turn: "第 {turn} 轮",
			unloaded: "尚未加载，点击加载并跳转",
			remove: "取消收藏"
		};
		//#endregion

		//#region dsh-turn-bookmarks/TurnBookmarks.js
		/**
		 * Left-side gold rail of bookmarked turns plus a favorites panel. The
		 * panel button sits at the rail's top and the panel lists every saved turn
		 * independently of the right rail's own scroll position.
		 */
		function TurnBookmarks({ sessionId, t }) {
			const [items, setItems] = react.useState(() => readBookmarks(sessionId));
			const [itemsSession, setItemsSession] = react.useState(sessionId);
			const [open, setOpen] = react.useState(false);
			const [layout, setLayout] = react.useState(null);
			const dockRef = react.useRef(null);
			const itemsRef = react.useRef(items);
			itemsRef.current = items;

			const hostNow = () => {
				const mount = dockRef.current;
				const closest = mount !== null && typeof mount.closest === "function" ? mount.closest("[data-conversation-session]") : null;
				return closest ?? findHost(sessionId);
			};

			react.useEffect(() => {
				setItems(readBookmarks(sessionId));
				setItemsSession(sessionId);
				setOpen(false);
			}, [sessionId]);

			const toggle = react.useCallback((turn, text) => {
				if (!Number.isSafeInteger(turn) || turn < 1) return;
				setItems((previous) => {
					const exists = previous.some((item) => item.turn === turn);
					const next = exists
						? previous.filter((item) => item.turn !== turn)
						: [...previous, { turn, text: String(text ?? "").slice(0, 180) }].sort((left, right) => left.turn - right.turn);
					writeBookmarks(sessionId, next);
					return next;
				});
			}, [sessionId]);

			// Rail placement follows the conversation scrollport, not the window.
			react.useEffect(() => {
				let timer = 0;
				let observer = null;
				const update = () => {
					const host = hostNow();
					if (host === null) {
						setLayout(null);
						return;
					}
					const scroll = host.querySelector("[data-conversation-scroll]") ?? host;
					const rect = scroll.getBoundingClientRect();
					if (rect.width < 320 || rect.height < 260) {
						setLayout(null);
						return;
					}
					const height = Math.min(420, Math.max(180, rect.height - 200));
					const top = rect.top + Math.max(40, (rect.height - 152 - height) / 2);
					const left = Math.max(8, rect.left + 2);
					setLayout((previous) => previous !== null
						&& previous.left === left && previous.top === top && previous.height === height
						? previous
						: { left, top, height });
					if (observer === null && typeof ResizeObserver === "function") {
						observer = new ResizeObserver(update);
						observer.observe(host);
						observer.observe(scroll);
					}
				};
				update();
				window.addEventListener("resize", update);
				timer = window.setInterval(update, 800);
				return () => {
					window.removeEventListener("resize", update);
					window.clearInterval(timer);
					if (observer !== null) observer.disconnect();
				};
			}, [sessionId]);

			react.useEffect(() => {
				if (layout === null) setOpen(false);
			}, [layout]);

			// Refresh previews captured while a turn was still unloaded.
			react.useEffect(() => {
				if (!open) return;
				const host = hostNow();
				if (host === null) return;
				setItems((previous) => {
					let changed = false;
					const next = previous.map((item) => {
						if (item.text !== "") return item;
						const text = previewFor(host, item.turn);
						if (text === "") return item;
						changed = true;
						return { ...item, text };
					});
					if (changed) writeBookmarks(sessionId, next);
					return changed ? next : previous;
				});
			}, [open, layout, sessionId]);

			// Keep the gold marks on the host rail in sync with saved turns.
			react.useEffect(() => {
				if (itemsSession !== sessionId) return;
				const host = hostNow();
				if (host !== null) syncMarks(host, items);
			}, [items, itemsSession, layout, sessionId]);

			react.useEffect(() => {
				let frame = 0;
				const sync = () => {
					if (frame !== 0) return;
					frame = window.requestAnimationFrame(() => {
						frame = 0;
						const host = hostNow();
						if (host !== null) syncMarks(host, itemsRef.current);
					});
				};
				const host = hostNow();
				if (host !== null) host.addEventListener("scroll", sync, { passive: true, capture: true });
				const timer = window.setInterval(sync, 1000);
				return () => {
					if (host !== null) host.removeEventListener("scroll", sync, { capture: true });
					window.clearInterval(timer);
					if (frame !== 0) window.cancelAnimationFrame(frame);
					for (const candidate of document.querySelectorAll("[data-conversation-session]")) {
						const nav = findRailNav(candidate);
						if (nav === null) continue;
						for (const button of nav.querySelectorAll(TURN_MARK)) button.removeAttribute("data-dsh-turn-bookmarked");
					}
				};
			}, [sessionId]);

			// Right-click a host rail mark to add/remove its turn.
			react.useEffect(() => {
				const onContextMenu = (event) => {
					const target = event.target;
					if (target === null || typeof target.closest !== "function") return;
					const mark = target.closest(TURN_MARK);
					if (mark === null) return;
					const nav = mark.closest("nav");
					const host = mark.closest("[data-conversation-session]");
					if (nav === null || host === null) return;
					if (host.getAttribute("data-conversation-session") !== sessionId) return;
					const turn = turnFromMark(mark);
					if (turn === undefined) return;
					event.preventDefault();
					event.stopPropagation();
					const exists = itemsRef.current.some((item) => item.turn === turn);
					if (exists) mark.removeAttribute("data-dsh-turn-bookmarked");
					else mark.setAttribute("data-dsh-turn-bookmarked", "true");
					toggle(turn, previewFor(host, turn));
				};
				document.addEventListener("contextmenu", onContextMenu, true);
				return () => document.removeEventListener("contextmenu", onContextMenu, true);
			}, [sessionId, toggle]);

			// Dismiss the panel on an outside press or Escape.
			react.useEffect(() => {
				if (!open) return;
				const onPointerDown = (event) => {
					const target = event.target;
					if (target !== null && typeof target.closest === "function" && target.closest("[data-dsh-turn-bookmarks]") !== null) return;
					setOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("keydown", onKeyDown, true);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("keydown", onKeyDown, true);
				};
			}, [open]);

			const count = items.length;
			const panelId = "dsh-turn-bookmarks-panel";
			const ready = itemsSession === sessionId;
			const rail = layout === null || !ready ? null : reactDom.createPortal(react.createElement("div", {
				className: "dshBookmarksRail",
				"data-dsh-turn-bookmarks": "rail",
				style: { left: layout.left, top: layout.top, height: layout.height }
			}, react.createElement("button", {
				type: "button",
				className: "dshBookmarksTop",
				"data-dsh-turn-bookmarks": "top",
				"data-open": open ? "true" : undefined,
				title: t("open"),
				"aria-label": count > 0 ? `${t("open")} (${count})` : t("open"),
				"aria-controls": panelId,
				"aria-expanded": open,
				onClick: () => setOpen((value) => !value)
			}, react.createElement("svg", {
				viewBox: "0 0 16 16",
				"aria-hidden": "true"
			}, react.createElement("path", {
				d: "m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.8Z",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				strokeLinejoin: "round"
			})), count > 0 ? react.createElement("span", { className: "dshBookmarksCount" }, count > 99 ? "99+" : String(count)) : null), react.createElement("div", {
				className: "dshBookmarksTrack",
				"data-empty": count === 0 ? "true" : undefined
			}, count === 0 ? react.createElement("span", { className: "dshBookmarksEmpty", "aria-hidden": "true" }) : items.map((item) => react.createElement("button", {
				key: item.turn,
				type: "button",
				className: "dshBookmarksMark",
				"data-turn": item.turn,
				"data-dsh-turn-bookmarks": "mark",
				title: `${t("turn", { turn: item.turn })}${item.text === "" ? "" : ` · ${item.text}`}`,
				"aria-label": `${t("turn", { turn: item.turn })}${item.text === "" ? "" : `: ${item.text}`}`,
				onClick: () => {
					if (navigateToTurn(sessionId, item.turn)) setOpen(false);
				},
				onContextMenu: (event) => {
					event.preventDefault();
					event.stopPropagation();
					toggle(item.turn, item.text);
				}
			})))), document.body);

			const panel = layout === null || !open || !ready ? null : reactDom.createPortal(react.createElement("div", {
				className: "dshBookmarksPanel",
				id: panelId,
				"data-dsh-turn-bookmarks": "panel",
				role: "dialog",
				"aria-label": t("panel"),
				style: {
					left: layout.left + 30,
					top: Math.max(12, Math.min(layout.top, (window.innerHeight || 800) - 380))
				}
			}, react.createElement("header", { className: "dshBookmarksHeader" }, react.createElement("span", { className: "dshBookmarksTitle" }, t("panel")), react.createElement("span", { className: "dshBookmarksTotal" }, String(count)), react.createElement("button", {
				type: "button",
				className: "dshBookmarksClose",
				autoFocus: true,
				"aria-label": t("close"),
				onClick: () => setOpen(false)
			}, "×")), react.createElement("div", { className: "dshBookmarksList" }, count === 0 ? react.createElement("div", { className: "dshBookmarksEmptyState" }, t("empty")) : items.map((item) => react.createElement("div", { key: item.turn, className: "dshBookmarksRow" }, react.createElement("button", {
				type: "button",
				className: "dshBookmarksOpen",
				onClick: () => {
					if (navigateToTurn(sessionId, item.turn)) setOpen(false);
				}
			}, react.createElement("span", { className: "dshBookmarksTurn" }, t("turn", { turn: item.turn })), react.createElement("span", { className: "dshBookmarksText" }, item.text === "" ? t("unloaded") : item.text)), react.createElement("button", {
				type: "button",
				className: "dshBookmarksRemove",
				title: t("remove"),
				"aria-label": t("remove"),
				onClick: () => toggle(item.turn, item.text)
			}, "×"))))), document.body);

			return react.createElement(react.Fragment, null,
				react.createElement("span", { ref: dockRef, hidden: true, "data-dsh-turn-bookmarks": "dock" }),
				rail,
				panel);
		}
		//#endregion

		//#region dsh-turn-bookmarks/index.js
		/** Services required by the bookmark rail. */
		const inject = ["slots", "locale"];

		/**
		 * Register the invisible dock owner; the visible rail/panel are portaled
		 * to the document body so they can sit beside the conversation frame.
		 * @param ctx - client plugin context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "turn-bookmarks: dictionaries");
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "turn-bookmarks",
				order: 20,
				locale: NS
			}, TurnBookmarks));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		exports.turnFromMark = turnFromMark;
		exports.findHost = findHost;
		exports.findRailNav = findRailNav;
		exports.markForTurn = markForTurn;
		exports.previewFor = previewFor;
		exports.navigateToTurn = navigateToTurn;
		exports.syncMarks = syncMarks;
		exports.readBookmarks = readBookmarks;
		exports.writeBookmarks = writeBookmarks;
		return module.exports;
	}
});

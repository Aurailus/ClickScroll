"use strict";

const THRESHOLD = 8;
const ICONS = [ 'w', 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw' ];

let active = false;
let speed = 16;

chrome.storage.sync.get("speed", ({ speed: newSpd }) => speed = newSpd ?? 16);
chrome.storage.sync.onChanged.addListener(({ speed: newSpd }) => speed = newSpd.newValue ?? 16);

function findNearestScrolling(elem) {
	if (elem === null || elem.tagName === 'A' || elem.tagName === 'BUTTON' || elem.tagName === 'INPUT') return null;

	let style = window.getComputedStyle(elem);
	let ovX = style.getPropertyValue('overflow-x');
	let ovY = style.getPropertyValue('overflow-y');

	if (elem.scrollWidth > elem.clientWidth && elem.clientWidth !== 0 &&
		(ovX === 'scroll' || ovX === 'auto' || elem === document.body || elem === document.documentElement) ||

		(elem.scrollHeight > elem.clientHeight && elem.clientHeight !== 0 &&
		(ovY === 'scroll' || ovY === 'auto' || elem === document.body || elem === document.documentElement)))
		return elem;

	return findNearestScrolling(elem.parentElement);
}

document.body.addEventListener("mousedown", (evt) => {
	if (evt.button !== 1 || active) return;

	let target = findNearestScrolling(evt.target);

	if (!target) return;
	if (target === document.body || target === document.documentElement) target = window;

	active = true;
	let moved = false;

	const startX = evt.clientX;
	const startY = evt.clientY;

	let screen = document.createElement("div");
	screen.classList.add("clickscroll_screen");
	document.body.appendChild(screen);

	let head = document.createElement("div");
	head.classList.add("clickscroll_head");
	head.style.left = (startX - 16) + "px";
	head.style.top = (startY - 16) + "px";
	screen.appendChild(head);

	let distX = 0;
	let distY = 0;
	let start = performance.now();

	const onMove = (evt) => {
		distX = evt.clientX - startX;
		distY = evt.clientY - startY;
		let angle = Math.round(((Math.atan2(distY, distX) + Math.PI) / Math.PI / 2 - 1/8) * 8) + 1;
		screen.style.cursor = ICONS[angle] + '-resize';
	};

	const onStep = (now) => {
		const elapsed = (now - start) / 1000;

		if (Math.sqrt(distX ** 2 + distY ** 2) > THRESHOLD) {
			moved = true;
			target.scrollBy({
				top: distY * speed * elapsed,
				left: distX * speed * elapsed,
				behavior: 'auto'
			});
		}

		start = now;
		if (active) window.requestAnimationFrame(onStep);
	}

	const onCancel = (evt) => {
		if (evt.type === 'mouseup' && !moved) return;
		setTimeout(() => document.documentElement.classList.remove('clickscroll_active'), 50);
		document.body.removeEventListener("mousemove", onMove);
		document.body.removeEventListener("mouseup", onCancel);
		document.body.removeEventListener("mouseclick", onCancel);
		evt.preventDefault();
		evt.stopPropagation();
		screen.remove();
		active = false;
	}

	document.documentElement.classList.add('clickscroll_active');
	document.body.addEventListener("mousemove", onMove);
	document.body.addEventListener("mouseup", onCancel);
	document.body.addEventListener("mouseclick", onCancel);
	window.requestAnimationFrame(onStep);
});

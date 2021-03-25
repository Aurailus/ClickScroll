"use strict";

let input = document.querySelector("#speed");

chrome.storage.sync.get("speed", ({ speed }) => {
	input.value = speed || 16
});

let onChange = (evt) => {
	if (document.querySelector("#speed:valid") && parseInt(evt.target.value, 10)) {
		chrome.storage.sync.set({ speed: parseInt(evt.target.value, 10) });
	}
};

input.addEventListener("change", onChange);
input.addEventListener("input", onChange);

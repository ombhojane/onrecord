const h = await (await fetch("https://onrecord.omisaur.app/", { cache: "no-store" })).text();
console.log(h.includes("crowd_a.png") ? "LIVE: two-panel bazaar hero" : h.includes("Tipsters delete") ? "live: partial (headline only)" : "live: older build");

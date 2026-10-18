const h = await (await fetch("https://onrecord.omisaur.app/", { cache: "no-store" })).text();
console.log(h.includes("/art/crowd.png") ? "LIVE: new vector hero" : h.includes("/art/frieze") ? "live: previous hero" : "live: older build");

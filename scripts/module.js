Hooks.once("ready", async () => {
    if (!game.user.isGM) return;
    const mac = game.macros.getName("Harrowing Apply Effects");
    if (!mac) {
        console.warn("Harrowing Helper | Harrowing Apply Effects macro not found in world.");
        return;
    }
    const updates = {};
    if (mac.author?.id !== game.user.id) updates.author = game.user.id;
    if ((mac.ownership?.default ?? 3) !== 2) updates.ownership = { default: 2 };
    if (!mac.getFlag("advanced-macros", "runForSpecificUser"))
        updates["flags.advanced-macros.runForSpecificUser"] = "GM";
    if (Object.keys(updates).length) {
        console.log("Harrowing Helper | Configuring HAE macro:", updates);
        await mac.update(updates);
        console.log("Harrowing Helper | HAE macro configured successfully.");
    } else {
        console.log("Harrowing Helper | HAE macro already configured correctly.");
    }
});

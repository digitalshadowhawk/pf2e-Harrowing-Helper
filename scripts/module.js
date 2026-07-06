Hooks.once("ready", async () => {
    if (!game.user.isGM) return;
    const mac = game.macros.getName("Harrowing Apply Effects");
    if (!mac) return;
    const updates = {};
    if (mac.author?.id !== game.user.id) updates.author = game.user.id;
    if ((mac.ownership?.default ?? 3) >= 3) updates.ownership = { default: 1 };
    if (!mac.getFlag("advanced-macros", "runForSpecificUser"))
        updates["flags.advanced-macros.runForSpecificUser"] = "GM";
    if (Object.keys(updates).length) await mac.update(updates);
});

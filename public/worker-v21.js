// worker.js

self.onmessage = function (e) {
    const { athletes, activities, todayStr, dateStrs } = e.data;

    // ---- Build indexes
    const activityMap = new Map();    // `${athleteId}-${yyyy-mm-dd}` -> [acts]
    const distanceTotals = new Map(); // athleteId -> total KM up to today
    const activeDays = new Map();     // key: athleteId -> count of distinct days with ≥1 act (≤ today)

    for (const entry of activities) {
        const athleteId = entry.athleteId;
        const byDate = entry.activitiesByDate || {};
        for (const dateStr in byDate) {
            const key = `${athleteId}-${dateStr}`;
            const list = activityMap.get(key);
            if (list) list.push(...byDate[dateStr]);
            else activityMap.set(key, [...byDate[dateStr]]);

            if (dateStr <= todayStr) {
                const dayKmRaw = byDate[dateStr].reduce((sum, a) => sum + (+a.distance || 0), 0);
                const dayKm = Math.min(dayKmRaw, 12);
                distanceTotals.set(athleteId, (distanceTotals.get(athleteId) || 0) + dayKm);

                // active day count
                if (dayKmRaw > 0) {
                    activeDays.set(athleteId, (activeDays.get(athleteId) || 0) + 1);
                }
            }
        }
    }

    // ---- Sort athletes: 1) Real Accounts First, 2) Total Distance (desc)
    const sortedAthletes = [...athletes].sort((a, b) => {
        // Dummy check: false < true (so false comes first)
        const aDum = !!a.dummy;
        const bDum = !!b.dummy;
        if (aDum !== bDum) return aDum ? 1 : -1;

        const db = distanceTotals.get(b.id) || 0;
        const da = distanceTotals.get(a.id) || 0;
        return db - da;
    });

    // Prepare data for main thread
    // We can't send Maps directly if we want to use them easily in the same way, 
    // but structured clone algorithm handles Maps fine.
    // However, to be safe and consistent with previous logic, we'll keep them as Maps.

    // Add _nameLower for search
    const processedAthletes = sortedAthletes.map(a => ({
        ...a,
        _nameLower: `${a.firstname} ${a.lastname}`.toLowerCase()
    }));

    self.postMessage({
        athletes: processedAthletes,
        activityMap,
        distanceTotals,
        activeDays
    });
};

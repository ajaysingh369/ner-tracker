// worker-v23.js

self.onmessage = function (e) {
    const { athletes, activities, todayStr, dateStrs } = e.data;

    // ---- Build indexes
    const activityMap = new Map();    // `${athleteId}-${yyyy-mm-dd}` -> [acts]
    const distanceTotals = new Map(); // athleteId -> total KM up to today
    const activeDays = new Map();     // key: athleteId -> count of distinct days with ≥1 act (≤ today)

    // Pre-process activities into a map for easy lookup by date
    const actsByAthleteAndDate = new Map(); // `${athleteId}-${dateStr}` -> [acts]
    for (const entry of activities) {
        const athleteId = entry.athleteId;
        const byDate = entry.activitiesByDate || {};
        for (const dateStr in byDate) {
            actsByAthleteAndDate.set(`${athleteId}-${dateStr}`, byDate[dateStr]);
        }
    }

    // Process athletes and their activities day-by-day (chronologically)
    for (const athlete of athletes) {
        const athleteId = athlete.id;
        const category = athlete.category || "100";
        let totalDist = 0;
        let daysActiveCount = 0;
        let hasUsedBonus = false;

        for (const dateStr of dateStrs) {
            const key = `${athleteId}-${dateStr}`;
            const acts = actsByAthleteAndDate.get(key) || [];

            if (acts.length > 0) {
                activityMap.set(key, acts);
            }

            if (dateStr <= todayStr) {
                const dayKmRaw = acts.reduce((sum, a) => sum + (+a.distance || 0), 0);

                if (dayKmRaw > 0) {
                    let dayKm = Math.min(dayKmRaw, 12);

                    // Refined rule for 200 KM category: 
                    // One-time 21km bonus ONLY if they run >= 21km
                    if (category === "200" && !hasUsedBonus && dayKmRaw >= 21) {
                        dayKm = Math.min(dayKmRaw, 21);
                        hasUsedBonus = true;
                    }

                    totalDist += dayKm;
                    daysActiveCount++;
                }
            }
        }
        distanceTotals.set(athleteId, totalDist);
        activeDays.set(athleteId, daysActiveCount);
    }

    // ---- Sort athletes: 1) Real Accounts First, 2) Total Distance (desc)
    const sortedAthletes = [...athletes].sort((a, b) => {
        const aDum = !!a.dummy;
        const bDum = !!b.dummy;
        if (aDum !== bDum) return aDum ? 1 : -1;

        const db = distanceTotals.get(b.id) || 0;
        const da = distanceTotals.get(a.id) || 0;
        return db - da;
    });

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

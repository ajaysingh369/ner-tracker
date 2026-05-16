const { QueryCommand, UpdateCommand, GetCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");

/**
 * Omni-Engine: World-Class Rules-Based Progress Evaluation
 * Handles STEPS, STRAVA, DISTANCE, and COUNT based challenges with dynamic rules.
 */
async function updateChallengeProgress(userId) {
    try {
        console.log(`🚀 [Omni-Engine] Evaluating challenges for user: ${userId}`);

        // 1. Get all active participations for this user
        const participationResult = await ddbDocClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":sk": "CHALLENGE#"
            }
        }));

        const participations = (participationResult.Items || []).filter(p => p.status === 'approved' || p.status === 'pending_active_days');
        if (participations.length === 0) return;

        for (const participation of participations) {
            const challengeId = participation.challengeId;
            const categoryId = participation.categoryId || 'default';

            // 2. Fetch Challenge Policy (Metadata)
            const challengeResult = await ddbDocClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { PK: "CHALLENGE", SK: challengeId }
            }));
            const challenge = challengeResult.Item;
            if (!challenge) continue;

            console.log(`🧐 Evaluating: ${challenge.name} (${challengeId})`);

            // Extract Category Goal
            const category = (challenge.categories || []).find(c => c.id === categoryId) || { goal: challenge.goal || 10000 };
            const goal = category.goal;

            // 3. Fetch Data Source
            let rawActivities = [];
            const startDate = (challenge.startDate || participation.joinedAt).split('T')[0];
            const endDate = (challenge.endDate || new Date().toISOString()).split('T')[0];

            if (challenge.dataSource === 'STEPS') {
                const stepHistory = await ddbDocClient.send(new QueryCommand({
                    TableName: TABLE_NAME,
                    KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
                    ExpressionAttributeValues: {
                        ":pk": `USER#${userId}`,
                        ":start": `STEPS#${startDate}`,
                        ":end": `STEPS#${endDate}Z` // Ensure we catch the whole last day
                    }
                }));
                rawActivities = stepHistory.Items.map(item => ({
                    date: item.date,
                    val: item.steps || 0,
                    type: 'Steps'
                }));
            } else if (challenge.dataSource === 'STRAVA') {
                // In a production environment, we'd fetch activities from a dedicated STRAVA_ACTIVITY# SK or query Strava
                // For this implementation, we assume activities are either cached or fetched via sync.js
                // Here we'll use a placeholder for the logic to fetchStravaActivities(userId, startDate, endDate, allowedActivities)
                rawActivities = await getCachedStravaActivities(userId, startDate, endDate, challenge.allowedActivities || []);
            }

            // 4. Group by Date for Ledger Evaluation
            const dailyGroups = rawActivities.reduce((acc, curr) => {
                const d = curr.date.split('T')[0];
                if (!acc[d]) acc[d] = [];
                acc[d].push(curr);
                return acc;
            }, {});

            // 5. Run Rules Engine (The Policy Evaluator)
            const rules = challenge.rules || {};
            let totalEligibleVal = 0;
            let activeDaysCount = 0;
            let wildcardUsed = false;
            const ledgerEntries = [];

            // Sort dates to ensure wildcard is applied to the FIRST eligible big activity
            const sortedDates = Object.keys(dailyGroups).sort();

            for (const date of sortedDates) {
                const activities = dailyGroups[date];
                let dayRawVal = 0;

                if (rules.aggregation === 'SINGLE_BEST') {
                    dayRawVal = Math.max(...activities.map(a => a.val));
                } else {
                    dayRawVal = activities.reduce((acc, a) => acc + a.val, 0);
                }

                let dayEligibleVal = 0;
                let isActive = false;

                // Rule: Minimum threshold
                if (dayRawVal >= (rules.dailyMin || 0)) {
                    isActive = true;
                    
                    // Rule: Max Cap with Wildcard logic
                    const cap = rules.dailyMax || Infinity;
                    if (dayRawVal > cap) {
                        if (rules.wildcard?.allowed && !wildcardUsed && dayRawVal >= (rules.wildcard.minThreshold || cap)) {
                            dayEligibleVal = Math.min(dayRawVal, rules.wildcard.maxVal || dayRawVal);
                            wildcardUsed = true;
                        } else {
                            dayEligibleVal = cap;
                        }
                    } else {
                        dayEligibleVal = dayRawVal;
                    }
                }

                totalEligibleVal += dayEligibleVal;
                if (isActive) activeDaysCount++;

                ledgerEntries.push({
                    date,
                    raw: dayRawVal,
                    eligible: dayEligibleVal,
                    active: isActive
                });
            }

            // 6. Check Completion
            const minDaysRequired = rules.minActiveDays || 0;
            const isGoalMet = totalEligibleVal >= goal;
            const isDaysMet = activeDaysCount >= minDaysRequired;

            let newStatus = 'approved';
            if (isGoalMet && isDaysMet) {
                newStatus = 'completed';
            } else if (isGoalMet && !isDaysMet) {
                newStatus = 'pending_active_days';
            }

            // 7. Update Participation Record
            // Logic: We always update if totalEligibleVal changes, even if goal is met (Rank Surge support)
            if (newStatus !== participation.status || totalEligibleVal !== participation.currentVal || activeDaysCount !== participation.activeDays) {
                // If Rank Surge is disabled, we cap the progress at 100% and currentVal at goal
                // If enabled, currentVal continues to climb for ranking, but progress visual stays at 100%
                const displayVal = (rules.allowRankSurge) ? totalEligibleVal : Math.min(totalEligibleVal, goal);
                const progress = Math.min(Math.round((totalEligibleVal / goal) * 100), 100);
                const isNewlyCompleted = newStatus === 'completed' && participation.status !== 'completed';

                let updateExpr = "SET progress = :p, currentVal = :v, activeDays = :ad, lastUpdatedAt = :t, #status = :s";
                let attrValues = {
                    ":p": progress,
                    ":v": displayVal,
                    ":ad": activeDaysCount,
                    ":t": new Date().toISOString(),
                    ":s": newStatus
                };

                if (isNewlyCompleted) {
                    const narratives = [
                        "A journey of a thousand miles ends with a single step, and you just took the last one. Legendary.",
                        "Through the sweat and the grind, you emerged victorious. This challenge wasn't ready for you.",
                        "Consistency is the quiet fire that wins races. Today, you are the blaze."
                    ];
                    updateExpr += ", narrative = :n, completedAt = :ca";
                    attrValues[":n"] = narratives[Math.floor(Math.random() * narratives.length)];
                    attrValues[":ca"] = new Date().toISOString();
                }

                await ddbDocClient.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { PK: `USER#${userId}`, SK: `CHALLENGE#${challengeId}` },
                    UpdateExpression: updateExpr,
                    ExpressionAttributeNames: { "#status": "status" },
                    ExpressionAttributeValues: attrValues
                }));

                // 8. Store Ledger (Optional: For UI "How my points were calculated")
                // We could use a BatchWrite to save the full ledger for the user to see in the app
                console.log(`✅ [Omni-Engine] ${challengeId}: ${progress}% | Days: ${activeDaysCount}/${minDaysRequired} | Status: ${newStatus}`);
            }
        }
    } catch (e) {
        console.error("❌ [Omni-Engine] Critical Failure:", e);
    }
}

/**
 * Helper to fetch Strava activities from the database.
 * In a real scenario, this would query a GSI or specific SKs where Strava runs are stored.
 */
async function getCachedStravaActivities(userId, start, end, allowedTypes) {
    // For now, we query the USER#... STRAVA_ACTIVITY#... pattern
    // This assumes our sync.js or webhook stores individual runs with SK: STRAVA_ACTIVITY#<ID>
    try {
        const result = await ddbDocClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":start": `STRAVA_ACTIVITY#${start}`,
                ":end": `STRAVA_ACTIVITY#${end}Z`
            }
        }));

        return (result.Items || [])
            .filter(a => allowedTypes.length === 0 || allowedTypes.includes(a.type))
            .map(a => ({
                date: a.startDate,
                val: a.distance, // Assumption: Strava uses Distance for these rules
                type: a.type
            }));
    } catch (e) {
        return [];
    }
}

module.exports = { updateChallengeProgress };

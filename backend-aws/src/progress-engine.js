const { QueryCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");

/**
 * Recalculates progress for all challenges a user is currently participating in.
 * Triggered after a successful Step Sync or Strava Sync.
 */
async function updateChallengeProgress(userId) {
    try {
        console.log(`🔄 Recalculating challenge progress for user: ${userId}`);

        // 1. Get all APPROVED challenges for this user
        const participationResult = await ddbDocClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":sk": "CHALLENGE#"
            }
        }));

        const participations = (participationResult.Items || []).filter(p => p.status === 'approved');
        if (participations.length === 0) return;

        // 2. Process each challenge
        for (const participation of participations) {
            const challengeId = participation.challengeId;

            // Get Challenge metadata (Goal, Dates, Type)
            const challengeResult = await ddbDocClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { PK: "CHALLENGE", SK: challengeId }
            }));
            const challenge = challengeResult.Item;
            if (!challenge) continue;

            let currentVal = 0;

            if (challenge.type === 'STEPS') {
                // Aggregate steps since challenge joinedAt or fixed start date
                const startDate = challenge.startDate || participation.joinedAt;
                const stepHistory = await ddbDocClient.send(new QueryCommand({
                    TableName: TABLE_NAME,
                    KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
                    ExpressionAttributeValues: {
                        ":pk": `USER#${userId}`,
                        ":start": `STEPS#${startDate.split('T')[0]}`,
                        ":end": `STEPS#ZZZ`
                    }
                }));
                currentVal = stepHistory.Items.reduce((acc, curr) => acc + (curr.steps || 0), 0);
            } 
            else if (challenge.type === 'STRAVA_DISTANCE') {
                // In real app, we'd query saved Strava activities
                currentVal = participation.totalDistance || 0; 
            }

            // 3. Calculate % and Update
            const goal = challenge.goal || 10000;
            const progress = Math.min(Math.round((currentVal / goal) * 100), 100);

            if (progress !== participation.progress) {
                const isNewlyCompleted = progress === 100 && participation.progress < 100;
                let updateExpr = "SET progress = :p, currentVal = :v, lastUpdatedAt = :t";
                let attrValues = {
                    ":p": progress,
                    ":v": currentVal,
                    ":t": new Date().toISOString()
                };

                if (isNewlyCompleted) {
                    const narratives = [
                        "A journey of a thousand miles ends with a single step, and you just took the last one. Legendary.",
                        "Through the sweat and the grind, you emerged victorious. This challenge wasn't ready for you.",
                        "Consistency is the quiet fire that wins races. Today, you are the blaze.",
                        "Challenge conquered. The leaderboard honors your name today."
                    ];
                    const selectedNarrative = narratives[Math.floor(Math.random() * narratives.length)];
                    
                    updateExpr += ", #status = :s, narrative = :n, completedAt = :ca";
                    attrValues[":s"] = "completed";
                    attrValues[":n"] = selectedNarrative;
                    attrValues[":ca"] = new Date().toISOString();
                }

                await ddbDocClient.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { PK: `USER#${userId}`, SK: `CHALLENGE#${challengeId}` },
                    UpdateExpression: updateExpr,
                    ExpressionAttributeNames: isNewlyCompleted ? { "#status": "status" } : undefined,
                    ExpressionAttributeValues: attrValues
                }));
                console.log(`✅ Updated ${challengeId}: ${progress}% ${isNewlyCompleted ? '(COMPLETED)' : ''}`);
            }
        }
    } catch (e) {
        console.error("❌ Challenge Progress Update Failed:", e);
    }
}

module.exports = { updateChallengeProgress };

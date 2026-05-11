const { GetCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-internal-secret",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

exports.handler = async (event) => {
    const path = event.rawPath || event.path;
    const method = event.requestContext?.http?.method || event.httpMethod;

    if (method === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    try {
        let response;
        if (path.endsWith("/notifications") && method === "GET") response = await handleGetNotifications(event);
        else if (path.endsWith("/notifications/read") && method === "POST") response = await handleMarkAsRead(event);
        else response = { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Notification Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};

async function handleGetNotifications(event) {
    const { userId } = event.queryStringParameters || {};
    if (!userId) return { statusCode: 400, body: "userId required" };

    const result = await ddbDocClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "NOTIF#" },
        ScanIndexForward: false, 
        Limit: 20
    }));

    return { statusCode: 200, body: JSON.stringify({ status: "success", notifications: result.Items }) };
}

async function handleMarkAsRead(event) {
    const { userId, notifId } = JSON.parse(event.body || "{}");
    if (!userId || !notifId) return { statusCode: 400, body: "userId and notifId required" };

    await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: notifId },
        UpdateExpression: "SET isRead = :r",
        ExpressionAttributeValues: { ":r": true }
    }));

    return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
}

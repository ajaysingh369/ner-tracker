const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { ddbDocClient, TABLE_NAME } = require("./db");
const crypto = require("crypto");

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "runastra_internal_sync_secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "runastra@2026"; // Default for dev, override in Lambda ENV
const ASSETS_BUCKET = process.env.ASSETS_BUCKET || "runastra-media-assets";

const s3Client = new S3Client({ region: "us-east-1" });

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-internal-secret,x-admin-secret",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

exports.handler = async (event) => {
    const path = event.rawPath || event.path;
    const method = event.requestContext?.http?.method || event.httpMethod;

    if (method === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    // 1. Check Internal Secret (Legacy/Internal)
    const secret = event.headers["x-internal-secret"] || event.headers["X-Internal-Secret"];
    
    // 2. Check Admin Master Password (New Security Layer)
    const adminSecret = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];

    // Validate: Must have either valid internal secret or valid admin password
    const isAuthorized = (secret === INTERNAL_SECRET) || (adminSecret === ADMIN_PASSWORD);

    if (!isAuthorized) {
        return { 
            statusCode: 401, 
            headers: CORS_HEADERS, 
            body: JSON.stringify({ error: "Unauthorized", message: "Invalid master key" }) 
        };
    }

    try {
        let response;
        if (path.endsWith("/admin/registrations") && method === "GET") {
            response = await handleGetRegistrations();
        } else if (path.endsWith("/admin/registrations/approve") && method === "POST") {
            response = await handleApproveRegistration(event);
        } else if (path.endsWith("/admin/challenges") && method === "POST") {
            response = await handleUpsertChallenge(event);
        } else if (path.endsWith("/admin/banners") && method === "POST") {
            response = await handleUpsertBanner(event);
        } else if (path.endsWith("/admin/events") && method === "POST") {
            response = await handleUpsertEvent(event);
        } else if (path.endsWith("/admin/generate-upload-url") && method === "POST") {
            response = await handleGenerateUploadUrl(event);
        } else if (path.endsWith("/admin/item") && method === "DELETE") {
            response = await handleDeleteItem(event);
        } else {
            response = { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
        }

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Admin Error:", error);
        return { 
            statusCode: 500, 
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Server Error" }) 
        };
    }
};

async function handleGenerateUploadUrl(event) {
    const { fileName, contentType } = JSON.parse(event.body || "{}");
    if (!fileName || !contentType) return { statusCode: 400, body: "fileName and contentType required" };

    const fileKey = `uploads/${crypto.randomUUID()}-${fileName}`;
    const command = new PutObjectCommand({
        Bucket: ASSETS_BUCKET,
        Key: fileKey,
        ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${ASSETS_BUCKET}.s3.amazonaws.com/${fileKey}`;

    return { 
        statusCode: 200, 
        body: JSON.stringify({ status: "success", uploadUrl, publicUrl, fileKey }) 
    };
}

async function handleGetRegistrations() {
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :sk) AND #s = :status",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":sk": "CHALLENGE#", ":status": "REG#PENDING" }
    }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", registrations: result.Items }) };
}

async function handleApproveRegistration(event) {
    const { userId, challengeId } = JSON.parse(event.body || "{}");
    if (!userId || !challengeId) return { statusCode: 400, body: "userId and challengeId required" };

    await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: `CHALLENGE#${challengeId}` },
        UpdateExpression: "SET #s = :s, approvedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "REG#APPROVED", ":t": new Date().toISOString() }
    }));

    return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
}

async function handleUpsertChallenge(event) {
    const data = JSON.parse(event.body || "{}");
    const id = data.id || data.SK || crypto.randomUUID();
    const item = {
        PK: "CHALLENGE",
        ...data,
        SK: id,
        id,
        updatedAt: new Date().toISOString()
    };
    await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", item }) };
}

async function handleUpsertBanner(event) {
    const data = JSON.parse(event.body || "{}");
    const id = data.id || data.SK || crypto.randomUUID();
    const item = {
        PK: "BANNER",
        ...data,
        SK: id,
        id,
        updatedAt: new Date().toISOString()
    };
    await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", item }) };
}

async function handleUpsertEvent(event) {
    const data = JSON.parse(event.body || "{}");
    const id = data.id || data.SK || crypto.randomUUID();
    const item = {
        PK: "EVENT",
        ...data,
        SK: id,
        id,
        updatedAt: new Date().toISOString()
    };
    await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", item }) };
}

async function handleDeleteItem(event) {
    const { pk, sk } = event.queryStringParameters || {};
    if (!pk || !sk) return { statusCode: 400, body: "pk and sk required" };

    await ddbDocClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk }
    }));
    return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
}

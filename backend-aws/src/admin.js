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

    // 0. Normalize Headers (Case-Insensitive)
    const headers = Object.keys(event.headers || {}).reduce((acc, key) => {
        acc[key.toLowerCase()] = event.headers[key];
        return acc;
    }, {});

    // 1. Check Internal Secret (Legacy/Internal)
    const secret = headers["x-internal-secret"];
    
    // 2. Check Admin Master Password (New Security Layer)
    const adminSecret = headers["x-admin-secret"];

    // 3. New: Role-Based Access Check
    let adminRole = 'ORGANIZER';
    let accessibleChallengeIds = [];
    let isAuthorized = false;

    // Check MASTER credentials first
    if ((secret === INTERNAL_SECRET) || (adminSecret === ADMIN_PASSWORD)) {
        isAuthorized = true;
        adminRole = 'MASTER';
    } else if (adminSecret) {
        // Check if it's a specific Organizer login
        const adminUser = await getAdminUserBySecret(adminSecret);
        if (adminUser && adminUser.status === 'active') {
            isAuthorized = true;
            adminRole = 'ORGANIZER';
            accessibleChallengeIds = adminUser.assignedChallenges || [];
        }
    }

    if (!isAuthorized) {
        return { 
            statusCode: 401, 
            headers: CORS_HEADERS, 
            body: JSON.stringify({ error: "Unauthorized", message: "Invalid credentials" }) 
        };
    }

    try {
        let response;
        if (path.endsWith("/admin/login") && method === "POST") {
            response = await handleAdminLogin(event, adminRole, accessibleChallengeIds);
        } else if (path.endsWith("/admin/users") && method === "GET") {
            if (adminRole !== 'MASTER') return { statusCode: 403, body: "Forbidden" };
            response = await handleGetAdminUsers();
        } else if (path.endsWith("/admin/users") && method === "POST") {
            if (adminRole !== 'MASTER') return { statusCode: 403, body: "Forbidden" };
            response = await handleUpsertAdminUser(event);
        } else if (path.endsWith("/admin/registrations") && method === "GET") {
            response = await handleGetRegistrations(adminRole, accessibleChallengeIds);
        } else if (path.includes("/admin/challenge/participants") && method === "GET") {
            response = await handleGetChallengeParticipants(event, adminRole, accessibleChallengeIds);
        } else if (path.includes("/admin/challenge/export") && method === "GET") {
            response = await handleDownloadChallengeCSV(event, adminRole, accessibleChallengeIds);
        } else if (path.endsWith("/admin/registrations/approve") && method === "POST") {
            response = await handleApproveRegistration(event);
        } else if (path.endsWith("/admin/challenges") && method === "POST") {
            response = await handleUpsertChallenge(event, adminRole, accessibleChallengeIds);
        } else if (path.endsWith("/admin/banners") && method === "POST") {
            if (adminRole !== 'MASTER') return { statusCode: 403, body: "Forbidden" };
            response = await handleUpsertBanner(event);
        } else if (path.endsWith("/admin/events") && method === "POST") {
            if (adminRole !== 'MASTER') return { statusCode: 403, body: "Forbidden" };
            response = await handleUpsertEvent(event);
        } else if (path.endsWith("/admin/generate-upload-url") && method === "POST") {
            response = await handleGenerateUploadUrl(event);
        } else if (path.endsWith("/admin/item") && method === "DELETE") {
            response = await handleDeleteItem(event, adminRole, accessibleChallengeIds);
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

async function handleGetRegistrations(role, accessibleIds) {
    let filter = "begins_with(SK, :sk) AND #s = :status";
    let attrValues = { ":sk": "CHALLENGE#", ":status": "REG#PENDING" };

    if (role === 'ORGANIZER') {
        if (accessibleIds.length === 0) return { statusCode: 200, body: JSON.stringify({ status: "success", registrations: [] }) };
        
        // Filter by assigned challenge IDs
        const idFilters = accessibleIds.map((id, i) => `#id${i} = :id${i}`).join(" OR ");
        filter += ` AND (${idFilters})`;
        accessibleIds.forEach((id, i) => {
            attrValues[`:id${i}`] = id;
        });
    }

    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filter,
        ExpressionAttributeNames: { 
            "#s": "status",
            ...(role === 'ORGANIZER' ? accessibleIds.reduce((acc, _, i) => ({ ...acc, [`#id${i}`]: "challengeId" }), {}) : {})
        },
        ExpressionAttributeValues: attrValues
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

async function handleUpsertChallenge(event, role, accessibleIds) {
    const data = JSON.parse(event.body || "{}");
    const id = data.id || data.SK || crypto.randomUUID();

    if (role === 'ORGANIZER' && data.SK && !accessibleIds.includes(data.SK)) {
        return { statusCode: 403, body: "Forbidden: You do not have access to this challenge" };
    }

    const item = {
        PK: "CHALLENGE",
        ...data,
        SK: id,
        id,
        updatedAt: new Date().toISOString()
    };
    await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    // If new challenge created by organizer (though usually master creates and assigns)
    // we might want to auto-assign it here if needed.

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

async function handleUpsertEvent(event, role) {
    if (role !== 'MASTER') return { statusCode: 403, body: "Forbidden" };
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

async function handleDeleteItem(event, role, accessibleIds) {
    const { pk, sk } = event.queryStringParameters || {};
    if (!pk || !sk) return { statusCode: 400, body: "pk and sk required" };

    if (role === 'ORGANIZER') {
        if (pk === 'CHALLENGE' && !accessibleIds.includes(sk)) return { statusCode: 403, body: "Forbidden" };
        if (pk !== 'CHALLENGE') return { statusCode: 403, body: "Forbidden" };
    }

    await ddbDocClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk }
    }));
    return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
}

async function handleGetChallengeParticipants(event, role, accessibleIds) {
    const { challengeId, limit = 50, nextToken } = event.queryStringParameters || {};
    if (!challengeId) return { statusCode: 400, body: "challengeId required" };

    if (role === 'ORGANIZER' && !accessibleIds.includes(challengeId)) {
        return { statusCode: 403, body: "Forbidden" };
    }

    // 1. Scan with Pagination for participations
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: { ":sk": `CHALLENGE#${challengeId}` },
        Limit: parseInt(limit),
        ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
    }));

    const participations = result.Items || [];
    const nextTokenEncoded = result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null;
    
    // 2. Hydrate with user profiles
    const hydrated = await Promise.all(participations.map(async (p) => {
        const userId = p.PK.split('#')[1];
        const profileRes = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: "PROFILE" }
        }));
        const profile = profileRes.Item || {};
        return {
            ...p,
            userName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Runner',
            email: profile.email || 'N/A',
            city: profile.city || 'N/A'
        };
    }));

    return { statusCode: 200, body: JSON.stringify({ status: "success", participants: hydrated, nextToken: nextTokenEncoded }) };
}

async function handleDownloadChallengeCSV(event, role, accessibleIds) {
    const { challengeId } = event.queryStringParameters || {};
    if (!challengeId) return { statusCode: 400, body: "challengeId required" };

    const response = await handleGetChallengeParticipants(event, role, accessibleIds);
    if (response.statusCode !== 200) return response;

    const { participants } = JSON.parse(response.body);

    let csv = "User Name,Email,City,Category,Progress %,Total Value,Active Days,Status,Completed At\n";
    participants.forEach(p => {
        csv += `"${p.userName}","${p.email}","${p.city}","${p.categoryId}","${p.progress}%","${p.currentVal}","${p.activeDays || 0}","${p.status}","${p.completedAt || ''}"\n`;
    });

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename=participants_${challengeId}.csv`
        },
        body: csv
    };
}

async function getAdminUserBySecret(secret) {
    const res = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "PK = :pk AND secret = :s",
        ExpressionAttributeValues: { ":pk": "ADMIN_USER", ":s": secret }
    }));
    return res.Items?.[0];
}

async function handleAdminLogin(event, role, accessibleIds) {
    return {
        statusCode: 200,
        body: JSON.stringify({ status: "success", role, assignedChallenges: accessibleIds })
    };
}

async function handleGetAdminUsers() {
    const res = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "ADMIN_USER" }
    }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", users: res.Items }) };
}

async function handleUpsertAdminUser(event) {
    const data = JSON.parse(event.body || "{}");
    const id = data.id || `admin_${crypto.randomUUID()}`;
    const item = {
        PK: "ADMIN_USER",
        SK: id,
        id,
        ...data,
        updatedAt: new Date().toISOString()
    };
    await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", item }) };
}

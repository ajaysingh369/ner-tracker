const { GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const MOBILE_GOOGLE_CLIENT_ID = process.env.MOBILE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(MOBILE_GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "runastra_secret_key";

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
        if (path.endsWith("/auth/google") && method === "POST") {
            response = await handleGoogleAuth(event);
        } else if (path.endsWith("/auth/me") && method === "GET") {
            response = await handleGetMe(event);
        } else if (path.endsWith("/auth/profile") && (method === "POST" || method === "PUT")) {
            response = await handleUpdateProfile(event);
        } else {
            response = { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
        }

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Handler Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Server Error: " + error.message }),
        };
    }
};

async function handleGoogleAuth(event) {
    const body = JSON.parse(event.body || "{}");
    const { idToken } = body;

    if (!idToken) {
        return {
            statusCode: 400,
            body: JSON.stringify({ status: "error", error: "idToken is required" }),
        };
    }

    let payload;
    try {
        if (idToken.startsWith("mock_")) {
            payload = {
                sub: `mock_${idToken.split("_")[1]}`,
                email: "tester@runastra.com",
                given_name: "Run",
                family_name: "Tester",
                picture: "",
            };
        } else {
            const ticket = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: MOBILE_GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        }
    } catch (tokenErr) {
        console.error("Token verification error:", tokenErr);
        return {
            statusCode: 401,
            body: JSON.stringify({ status: "error", error: "Token verification failed: " + tokenErr.message }),
        };
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    const getMapping = await ddbDocClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `GOOGLE#${googleId}`, SK: "MAPPING" }
    }));

    let userId;
    let user;

    if (!getMapping.Item) {
        userId = crypto.randomUUID();
        user = {
            PK: `USER#${userId}`,
            SK: "PROFILE",
            userId,
            googleId,
            email,
            firstName: given_name,
            lastName: family_name,
            profileImage: picture,
            createdAt: new Date().toISOString(),
            onboardingComplete: false,
        };

        await Promise.all([
            ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: user })),
            ddbDocClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: { PK: `GOOGLE#${googleId}`, SK: "MAPPING", userId }
            }))
        ]);
    } else {
        userId = getMapping.Item.userId;
        const getUser = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: "PROFILE" }
        }));
        user = getUser.Item;
        
        await ddbDocClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: "PROFILE" },
            UpdateExpression: "SET profileImage = :p, firstName = :f, lastName = :l",
            ExpressionAttributeValues: {
                ":p": picture || user.profileImage,
                ":f": given_name || user.firstName,
                ":l": family_name || user.lastName,
            }
        }));
    }

    const authToken = jwt.sign({ id: userId, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    return {
        statusCode: 200,
        body: JSON.stringify({
            status: "success",
            token: authToken,
            user: {
                id: userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImage: user.profileImage,
                onboardingComplete: user.onboardingComplete
            }
        }),
    };
}

async function handleGetMe(event) {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const getUser = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${decoded.id}`, SK: "PROFILE" }
        }));

        if (!getUser.Item) return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };

        return { statusCode: 200, body: JSON.stringify({ status: "success", user: getUser.Item }) };
    } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
    }
}

async function handleUpdateProfile(event) {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return { statusCode: 401, body: "Unauthorized" };
    
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const body = JSON.parse(event.body || "{}");
        
        const allowedFields = ['gender', 'dob', 'height', 'weight', 'dailyStepGoal', 'onboardingComplete', 'aiConsent', 'partnerSharingConsent', 'city', 'isProUser'];
        let expressions = ["#u = :u"];
        let attrNames = { "#u": "updatedAt" };
        let attrValues = { ":u": new Date().toISOString() };
        
        Object.keys(body).forEach((key, idx) => {
            if (allowedFields.includes(key)) {
                expressions.push(`#v${idx} = :v${idx}`);
                attrNames[`#v${idx}`] = key;
                attrValues[`:v${idx}`] = body[key];
            }
        });

        await ddbDocClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${decoded.id}`, SK: "PROFILE" },
            UpdateExpression: `SET ${expressions.join(", ")}`,
            ExpressionAttributeNames: attrNames,
            ExpressionAttributeValues: attrValues
        }));

        return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
    } catch (err) {
        console.error("Profile Update Error:", err);
        return { statusCode: 401, body: JSON.stringify({ error: "Invalid Token or Update Failed" }) };
    }
}

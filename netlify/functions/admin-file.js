const { getStore, connectLambda } = require("@netlify/blobs");
const crypto = require("crypto");

const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
};

function verifyAdmin(event) {
    const secret = process.env.ADMIN_SESSION_SECRET;

    if (!secret || secret.length < 32) return false;

    const cookie = event.headers.cookie || "";
    const token = cookie
        .split(";")
        .map(item => item.trim())
        .find(item => item.startsWith("admin_session="))
        ?.substring("admin_session=".length);

    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (
        a.length !== b.length ||
        !crypto.timingSafeEqual(a, b)
    ) {
        return false;
    }

    try {
        const data = JSON.parse(
            Buffer.from(payload, "base64url").toString()
        );

        return (
            data.email?.toLowerCase() ===
                process.env.ADMIN_EMAIL?.toLowerCase() &&
            data.expires > Date.now()
        );
    } catch {
        return false;
    }
}

exports.handler = async (event) => {
    if (!verifyAdmin(event)) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Unauthorized"
            })
        };
    }

    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Method not allowed"
            })
        };
    }

    try {
        const params = event.queryStringParameters || {};
        const submissionId = params.id;
        const fileKey = params.key;

        if (!submissionId || !fileKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Missing file information"
                })
            };
        }

        connectLambda(event);

        const submissionsStore = getStore("academy-submissions");
        const filesStore = getStore("academy-submission-files");

        const record = await submissionsStore.get(submissionId, {
            type: "json"
        });

        if (!record) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Submission not found"
                })
            };
        }

        const attachment = (record.attachments || []).find(
            file => file.key === fileKey
        );

        if (!attachment) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "File not found"
                })
            };
        }

        const fileData = await filesStore.get(fileKey, {
            type: "arrayBuffer"
        });

        if (!fileData) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "File data not found"
                })
            };
        }

        const safeName = String(attachment.fileName || "download")
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        return {
            statusCode: 200,
            headers: {
                "Content-Type": attachment.contentType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${safeName}"`,
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff"
            },
            isBase64Encoded: true,
            body: Buffer.from(fileData).toString("base64")
        };

    } catch (error) {
        console.error("Admin file error:", error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Unable to download file"
            })
        };
    }
};
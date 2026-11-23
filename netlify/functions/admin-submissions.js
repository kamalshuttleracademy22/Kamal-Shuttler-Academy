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

    if (a.length !== b.length ||
        !crypto.timingSafeEqual(a, b)) {
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
                message: "Unauthorized. Please login."
            })
        };
    }

    if (!["GET", "POST", "DELETE"].includes(event.httpMethod)) {
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
        connectLambda(event);
        const store = getStore("academy-submissions");

        if (event.httpMethod === "GET") {
            const result = await store.list();
            const submissions = [];

            for (const item of result.blobs) {
                const record = await store.get(item.key, {
                    type: "json"
                });

                if (record) submissions.push(record);
            }

            submissions.sort(
                (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    submissions
                })
            };
        }

        const data = JSON.parse(event.body || "{}");

        if (event.httpMethod === "POST") {
            if (!data.id ||
                !["Pending", "Approved", "Rejected"].includes(data.status)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid submission update"
                    })
                };
            }

            const record = await store.get(data.id, {
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

            record.status = data.status;

            await store.setJSON(data.id, record);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Status updated"
                })
            };
        }

        if (event.httpMethod === "DELETE") {
            if (!data.id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Submission ID required"
                    })
                };
            }

            await store.delete(data.id);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Submission deleted"
                })
            };
        }

    } catch (error) {
        console.error("Admin submissions error:", error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Unable to process submissions"
            })
        };
    }
};
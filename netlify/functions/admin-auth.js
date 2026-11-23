const crypto = require("crypto");

const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
};

function createToken(email, secret) {
    const payload = Buffer.from(
        JSON.stringify({
            email,
            expires: Date.now() + 8 * 60 * 60 * 1000
        })
    ).toString("base64url");

    const signature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64url");

    return `${payload}.${signature}`;
}

function verifyToken(token, secret) {
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

        return data.expires > Date.now();
    } catch {
        return false;
    }
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
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
        const {
            ADMIN_EMAIL,
            ADMIN_PASSWORD,
            ADMIN_SESSION_SECRET
        } = process.env;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD ||
            !ADMIN_SESSION_SECRET ||
            ADMIN_SESSION_SECRET.length < 32) {
            throw new Error("Admin configuration missing");
        }

        const action = JSON.parse(event.body || "{}");

        if (action.action === "login") {
            const email = String(action.email || "").trim();
            const password = String(action.password || "");

            const emailMatch =
                email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

            const passwordMatch =
                password === ADMIN_PASSWORD;

            if (!emailMatch || !passwordMatch) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid email or password"
                    })
                };
            }

            const token = createToken(
                ADMIN_EMAIL,
                ADMIN_SESSION_SECRET
            );

            return {
                statusCode: 200,
                headers: {
                    ...headers,
                   "Set-Cookie":
    `admin_session=${token}; HttpOnly; ${process.env.CONTEXT === "production" ? "Secure;" : ""} SameSite=Strict; Path=/; Max-Age=28800`
                },
                body: JSON.stringify({
                    success: true,
                    message: "Login successful"
                })
            };
        }

        if (action.action === "logout") {
            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    "Set-Cookie":
                        "admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
                },
                body: JSON.stringify({
                    success: true,
                    message: "Logged out"
                })
            };
        }

        if (action.action === "verify") {
            const cookie = event.headers.cookie || "";
            const token = cookie
                .split(";")
                .map(item => item.trim())
                .find(item => item.startsWith("admin_session="))
                ?.substring("admin_session=".length);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: verifyToken(
                        token,
                        ADMIN_SESSION_SECRET
                    )
                })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Invalid action"
            })
        };

    } catch (error) {
        console.error("Admin auth error:", error.message);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Authentication service error"
            })
        };
    }
};
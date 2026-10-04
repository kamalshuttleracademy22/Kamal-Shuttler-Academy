exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                message: "Method not allowed"
            })
        };
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Supabase environment variables are missing.");

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Server configuration error"
                })
            };
        }

        const data = JSON.parse(event.body || "{}");

        if (!data.form_type) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Form type is required"
                })
            };
        }

        // ==========================================
        // PAYMENT SCREENSHOT UPLOAD
        // ==========================================

        let paymentProofPath = null;

        if (data.payment_screenshot) {

            const fileBuffer = Buffer.from(
                data.payment_screenshot.file,
                "base64"
            );

            const fileName =
                data.payment_screenshot.fileName || "payment-proof.jpg";

            const contentType =
                data.payment_screenshot.contentType || "image/jpeg";

            const orderId =
                data.order_id || "unknown-order";

            const safeFileName = fileName.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

            paymentProofPath =
                `${orderId}/${Date.now()}-${safeFileName}`;

            const uploadResponse = await fetch(
                `${supabaseUrl}/storage/v1/object/payment-proofs/${paymentProofPath}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": contentType,
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "x-upsert": "false"
                    },
                    body: fileBuffer
                }
            );

            const uploadText = await uploadResponse.text();

            if (!uploadResponse.ok) {
                console.error(
                    "Payment screenshot upload failed:",
                    uploadResponse.status,
                    uploadText
                );

                return {
                    statusCode: 500,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        success: false,
                        message: "Payment screenshot upload failed"
                    })
                };
            }

            console.log(
                "Payment screenshot uploaded:",
                paymentProofPath
            );

            // Original screenshot data database me nahi bhejna
            delete data.payment_screenshot;

            // Sirf storage path save hoga
            data.payment_proof_path = paymentProofPath;
        }

        // ==========================================
        // SAVE ORDER DATA TO DATABASE
        // ==========================================

        const response = await fetch(
            `${supabaseUrl}/rest/v1/form_submissions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseKey,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    form_type: data.form_type,
                    data: data
                })
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            console.error(
                "Supabase REST error:",
                response.status,
                responseText
            );

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Unable to save form"
                })
            };
        }

        console.log("Form and payment screenshot saved successfully.");

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                message: "Form submitted successfully",
                payment_proof_path: paymentProofPath
            })
        };

    } catch (error) {
        console.error("Function error:", error);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                message: "Something went wrong"
            })
        };
    }
};
exports.handler = async (event) => {
    // Sirf POST request allow hai
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
        // Supabase settings
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Check environment variables
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

        console.log("SUPABASE URL:", supabaseUrl);
        console.log(
            "SUPABASE KEY TYPE:",
            supabaseKey.substring(0, 10) + "********"
        );

        // Form data receive karo
        const data = JSON.parse(event.body || "{}");

        // Form type check
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

        // Supabase REST API
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

        // Supabase error
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

        // Success
        console.log("Form saved successfully.");

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                message: "Form submitted successfully"
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
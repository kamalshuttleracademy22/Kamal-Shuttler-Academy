const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
    // Only allow POST requests
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
        // Read Supabase credentials from Netlify environment variables
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

        const supabase = createClient(
            supabaseUrl,
            supabaseKey
        );

        // Read submitted form data
        const data = JSON.parse(event.body || "{}");

        // Basic validation
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

        // Save submission
        const { error } = await supabase
            .from("form_submissions")
            .insert([
                {
                    form_type: data.form_type,
                    data: data
                }
            ]);

        if (error) {
            console.error("Supabase error:", error);

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
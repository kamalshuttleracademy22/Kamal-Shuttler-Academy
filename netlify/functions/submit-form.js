const nodemailer = require("nodemailer");

exports.handler = async (event) => {

    const headers = {
        "Content-Type": "application/json"
    };

    // Only POST requests are allowed
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

        // Gmail configuration from Netlify environment variables
        const {
            GMAIL_USER,
            GMAIL_APP_PASSWORD,
            RECEIVING_EMAIL
        } = process.env;

        if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !RECEIVING_EMAIL) {
            throw new Error("Email configuration missing");
        }

        const requestData = JSON.parse(event.body || "{}");

        // Supported form types
        const allowedTypes = [
            "course_enrollment",
            "product_order",
            "job_application",
            "camp_booking",
            "contact_message"
        ];

        if (!allowedTypes.includes(requestData.form_type)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Invalid form type"
                })
            };
        }

        // Gmail transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD
            }
        });

        let emailBody = "";
        let subject = "";
        let replyTo;
        const attachments = [];

        // =====================================
        // JOB APPLICATION
        // =====================================

        if (requestData.form_type === "job_application") {

            const data = requestData.data || {};
            const uploadedFiles = requestData.attachments || [];

            if (
                typeof data["Full Name"] !== "string" ||
                !data["Full Name"].trim() ||
                typeof data.Email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email) ||
                typeof data["Mobile Number"] !== "string" ||
                !data["Mobile Number"].trim() ||
                typeof data["Job Position"] !== "string" ||
                !data["Job Position"].trim() ||
                data["Terms Accepted"] !== "Yes"
            ) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Please complete all required fields."
                    })
                };
            }

            if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Please upload your resume."
                    })
                };
            }

            let totalSize = 0;
            let hasPDF = false;

            const allowedMimeTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            for (const file of uploadedFiles) {

                if (
                    !file ||
                    typeof file.file !== "string" ||
                    typeof file.fileName !== "string" ||
                    !allowedMimeTypes.includes(file.contentType) ||
                    !/^[A-Za-z0-9+/]+={0,2}$/.test(file.file)
                ) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Invalid uploaded document."
                        })
                    };
                }

                const buffer = Buffer.from(file.file, "base64");

                if (buffer.length === 0) {
                    throw new Error("Empty uploaded file");
                }

                totalSize += buffer.length;

                // PDF validation
                if (file.contentType === "application/pdf") {

                    if (
                        buffer.length < 5 ||
                        buffer.toString("ascii", 0, 5) !== "%PDF-"
                    ) {
                        throw new Error("Invalid PDF file");
                    }

                    hasPDF = true;

                } else {

                    // Image validation
                    const signatures = {

                        "image/jpeg":
                            buffer[0] === 0xFF &&
                            buffer[1] === 0xD8 &&
                            buffer[2] === 0xFF,

                        "image/png":
                            buffer.subarray(0, 8).equals(
                                Buffer.from([
                                    137, 80, 78, 71, 13, 10, 26, 10
                                ])
                            ),

                        "image/webp":
                            buffer.toString("ascii", 0, 4) === "RIFF" &&
                            buffer.toString("ascii", 8, 12) === "WEBP"
                    };

                    if (!signatures[file.contentType]) {
                        throw new Error("Invalid image file");
                    }

                }

                const safeName = file.fileName
                    .replace(/[^a-zA-Z0-9._-]/g, "_")
                    .slice(0, 100);

                attachments.push({
                    filename: safeName,
                    content: buffer,
                    contentType: file.contentType
                });

            }

            if (!hasPDF) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Please upload your resume in PDF format."
                    })
                };
            }

            if (totalSize > 2 * 1024 * 1024) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "All documents together must be under 2 MB."
                    })
                };
            }

            subject = "New Job Application - Kamal Shuttler Academy";
            replyTo = data.Email;

            emailBody = `
KAMAL SHUTTLER ACADEMY
NEW JOB APPLICATION

PERSONAL DETAILS

Name: ${data["Full Name"]}
Age: ${data.Age || "N/A"}
Mobile: ${data["Mobile Number"]}
Email: ${data.Email}
Location: ${data["Current Location"] || "N/A"}

PROFESSIONAL DETAILS

Job Position: ${data["Job Position"]}
Current Profession: ${data["Current Profession"] || "N/A"}
Experience: ${data["Total Experience"] || "N/A"}
Qualification: ${data["Qualification"] || "N/A"}
Skills: ${data.Skills || "N/A"}
Previous Company: ${data["Previous Company"] || "N/A"}

JOB PREFERENCE

Preferred Location: ${data["Preferred Job Location"] || "N/A"}
Job Type: ${JSON.stringify(data["Job Type"] || "N/A")}
Expected Salary: ${data["Expected Salary"] || "N/A"}
Minimum Salary: ${data["Minimum Acceptable Salary"] || "N/A"}

ACCOMMODATION & FOOD

Accommodation: ${data["Accommodation Required"] || "No"}
Food: ${data["Food Required"] || "No"}
Requirements: ${data["Food & Accommodation Requirement"] || "N/A"}

JOINING DETAILS

Joining Date: ${data["Joining Date"] || "N/A"}
Currently Working: ${data["Currently Working"] || "No"}
Notice Period: ${data["Notice Period"] || "N/A"}

ADDITIONAL INFORMATION

About: ${data["About Yourself"] || "N/A"}
Other Expectations: ${data["Other Expectations"] || "N/A"}

ATTACHMENTS

${attachments.map(file => file.filename).join("\n")}
`;

        }

        // =====================================
        // CAMP BOOKING
        // =====================================

        else if (requestData.form_type === "camp_booking") {

            const data = requestData.data || {};

            const requiredFields = [
                "Full Name",
                "Organization / Academy",
                "Country",
                "City",
                "Email Address",
                "Mobile Number",
                "Camp Date",
                "Training Days",
                "Players",
                "Age Group",
                "Playing Level"
            ];

            for (const field of requiredFields) {

                if (
                    typeof data[field] !== "string" ||
                    !data[field].trim()
                ) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: `Please provide ${field}.`
                        })
                    };
                }

            }

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data["Email Address"]) ||
                data["Terms Accepted"] !== "Yes" ||
                !Number.isInteger(Number(data["Training Days"])) ||
                Number(data["Training Days"]) < 1 ||
                !Number.isInteger(Number(data.Players)) ||
                Number(data.Players) < 1
            ) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Please check your camp booking details."
                    })
                };
            }

            subject = "New International Camp Booking - Kamal Shuttler Academy";

            replyTo = data["Email Address"];

            emailBody = `
KAMAL SHUTTLER ACADEMY
NEW INTERNATIONAL CAMP BOOKING

ORGANIZER INFORMATION

Full Name: ${data["Full Name"]}
Organization / Academy: ${data["Organization / Academy"]}
Country: ${data.Country}
City: ${data.City}
Email: ${data["Email Address"]}
Mobile Number: ${data["Mobile Number"]}

CAMP DETAILS

Proposed Camp Date: ${data["Camp Date"]}
Training Days: ${data["Training Days"]}
Number of Players: ${data.Players}
Age Group: ${data["Age Group"]}
Playing Level: ${data["Playing Level"]}

VENUE INFORMATION

Venue Name: ${data["Venue Name"] || "N/A"}
Number of Courts: ${data["Number of Courts"] || "N/A"}
Shuttle Brand: ${data["Shuttle Brand"] || "N/A"}
Training Timings: ${data["Training Timings"] || "N/A"}

ADDITIONAL REQUIREMENTS

${data.Requirements || "N/A"}

TERMS

Accepted: ${data["Terms Accepted"]}

Please contact the organizer to discuss the camp schedule and logistics.
`;

        }

        // =====================================
        // CONTACT MESSAGE
        // =====================================

        else if (requestData.form_type === "contact_message") {

            const data = requestData.data || {};

            const requiredFields = [
                "name",
                "email",
                "phone",
                "message"
            ];

            for (const field of requiredFields) {

                if (
                    typeof data[field] !== "string" ||
                    !data[field].trim()
                ) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: `Please provide ${field}.`
                        })
                    };
                }

            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid email address."
                    })
                };
            }

            subject = "New Contact Message - Kamal Shuttler Academy";

            replyTo = data.email;

            emailBody = `
KAMAL SHUTTLER ACADEMY
NEW CONTACT MESSAGE

CUSTOMER DETAILS

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

MESSAGE

${data.message}

--------------------------------
Kamal Shuttler Academy
`;

        }

        // =====================================
        // PRODUCT ORDER / COURSE ENROLLMENT
        // =====================================

        else {

            const data = requestData;

            const requiredFields = [
                "name",
                "email",
                "phone",
                "order_id",
                "product",
                "transaction_id"
            ];

            for (const field of requiredFields) {

                if (
                    typeof data[field] !== "string" ||
                    !data[field].trim()
                ) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: `Missing required field: ${field}`
                        })
                    };
                }

            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid email address"
                    })
                };
            }

            const file = data.payment_screenshot;

            if (
                !file ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.contentType) ||
                typeof file.file !== "string" ||
                !/^[A-Za-z0-9+/]+={0,2}$/.test(file.file)
            ) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Valid payment screenshot is required."
                    })
                };
            }

            const buffer = Buffer.from(file.file, "base64");

            if (
                buffer.length === 0 ||
                buffer.length > 3 * 1024 * 1024
            ) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Screenshot must be under 3 MB."
                    })
                };
            }

            const signatures = {

                "image/jpeg":
                    buffer[0] === 0xFF &&
                    buffer[1] === 0xD8 &&
                    buffer[2] === 0xFF,

                "image/png":
                    buffer.subarray(0, 8).equals(
                        Buffer.from([
                            137, 80, 78, 71, 13, 10, 26, 10
                        ])
                    ),

                "image/webp":
                    buffer.toString("ascii", 0, 4) === "RIFF" &&
                    buffer.toString("ascii", 8, 12) === "WEBP"
            };

            if (!signatures[file.contentType]) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid image content."
                    })
                };
            }

            const extension = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            }[file.contentType];

            attachments.push({
                filename: `payment-proof.${extension}`,
                content: buffer,
                contentType: file.contentType
            });

            const formTitle =
                data.form_type === "course_enrollment"
                    ? "Course Enrollment"
                    : "Product Order";

            subject = `${formTitle} - ${data.order_id}`;

            replyTo = data.email;

            emailBody = `
KAMAL SHUTTLER ACADEMY
${formTitle}

Order ID: ${data.order_id}
Date: ${data.order_date || "N/A"}

PRODUCT DETAILS

Product: ${data.product}
Price: ${data.price || "N/A"}

CUSTOMER DETAILS

Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}
Address: ${data.address || "N/A"}
Pincode: ${data.pincode || "N/A"}

DELIVERY

${data.delivery || "N/A"}

PAYMENT

Transaction ID: ${data.transaction_id}

NOTES

${data.notes || "N/A"}
`;

        }

        // =====================================
        // SEND EMAIL
        // =====================================

        await transporter.sendMail({

            from: `"Kamal Shuttler Academy" <${GMAIL_USER}>`,

            to: RECEIVING_EMAIL,

            replyTo,

            subject,

            text: emailBody,

            attachments

        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: "Form submitted successfully."
            })
        };

    } catch (error) {

        console.error("Email submission error:", error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Unable to submit form. Please try again."
            })
        };

    }

};
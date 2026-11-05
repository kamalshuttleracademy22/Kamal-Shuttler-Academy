// ==========================
// KAMAL SHUTTLER ACADEMY
// script.js
// Gmail Submission Version
// ==========================

window.onload = function () {
    document.body.style.opacity = "1";
};


// ==========================
// AUTO COURSE / PRODUCT DETAILS
// ==========================
const params = new URLSearchParams(window.location.search);

const product =
    params.get("product") ||
    params.get("course") ||
    "";

const price = params.get("price") || "";

const productInput = document.getElementById("product");
const priceInput = document.getElementById("price");

if (productInput && product) {
    productInput.value = product;
}

if (priceInput && price) {
    priceInput.value = "₹" + price;
}

// ==========================
// ORDER ID GENERATOR
// ==========================

function generateOrderID() {
    return "KBH" + Math.floor(100000 + Math.random() * 900000);
}

const orderInput = document.getElementById("orderid");

if (orderInput) {
    orderInput.value = generateOrderID();
}

const dateInput = document.getElementById("datetime");

if (dateInput) {
    dateInput.value = new Date().toLocaleString();
}


// ==========================
// AUTOMATIC FORM HEADING
// ==========================

const heading = document.getElementById("formHeading");

if (heading) {

    if (window.location.pathname.includes("order.html")) {

        heading.innerText = "Complete Your Badminton Racket Order";

    } else if (window.location.pathname.includes("shoes")) {

        heading.innerText = "Complete Your Yonex Shoes Order";

    } else {

        heading.innerText = "Fill The Form";

    }
}


// ==========================
// PLACE ORDER / ENROLLMENT
// ==========================

async function placeOrder() {

    const product = document.getElementById("product")?.value || "";
    const price = document.getElementById("price")?.value || "";

    const orderid = document.getElementById("orderid")?.value || "";
    const datetime = document.getElementById("datetime")?.value || "";

    const name = document.getElementById("name")?.value.trim() || "";
    const phone = document.getElementById("phone")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";

    const address = document.getElementById("address")?.value.trim() || "";
    const pincode = document.getElementById("pincode")?.value.trim() || "";

    const delivery = document.getElementById("delivery")?.value || "";

    const transaction =
        document.getElementById("transaction")?.value.trim() || "";

    const notes =
        document.getElementById("notes")?.value.trim() || "";

    const isEnrollmentForm =
        document.getElementById("enrollForm") !== null;

    const screenshotInput =
        document.getElementById("paymentScreenshot");

    // Required fields

    if (!name || !phone || !email || !address || !pincode || !transaction) {

        alert("Please fill all required fields.");
        return;

    }

    // Email validation

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        alert("Please enter a valid email address.");
        return;

    }

    // Screenshot validation

    if (!screenshotInput || !screenshotInput.files.length) {

        alert("Please upload payment screenshot.");
        return;

    }

    const screenshotFile = screenshotInput.files[0];

    if (!["image/jpeg", "image/png", "image/webp"].includes(screenshotFile.type)) {

        alert("Please upload JPG, PNG or WEBP image.");
        return;

    }

    // Maximum 3 MB

    if (screenshotFile.size > 3 * 1024 * 1024) {

        alert("Payment screenshot must be less than 3 MB.");
        return;

    }

    try {

        const screenshotBase64 = await fileToBase64(screenshotFile);

        const formData = {

            form_type: isEnrollmentForm
                ? "course_enrollment"
                : "product_order",

            product: product,
            price: price,

            order_id: orderid,
            order_date: datetime,

            name: name,
            phone: phone,
            email: email,

            address: address,
            pincode: pincode,

            delivery: delivery,

            transaction_id: transaction,

            notes: notes || "N/A",

            payment_screenshot: {

                file: screenshotBase64,
                fileName: screenshotFile.name,
                contentType: screenshotFile.type

            }

        };

        const button = document.querySelector(".submit-btn");

        if (button) {
            button.disabled = true;
            button.innerText = "Submitting...";
        }

        const submitted = await submitByEmail(formData);

        if (!submitted) {

            alert("Submission failed. Please try again.");

            if (button) {
                button.disabled = false;
                button.innerText = "Submit";
            }

            return;

        }

        // Success

        if (isEnrollmentForm) {

            alert(
                "Enrollment submitted successfully!\n\n" +
                "Enrollment ID: " + orderid
            );

        } else {

            alert(
                "Order submitted successfully!\n\n" +
                "Order ID: " + orderid
            );

        }

    } catch (error) {

        console.error("Submission error:", error);

        alert("Something went wrong. Please try again.");

    }

}


// ==========================
// FILE TO BASE64
// ==========================

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            const base64String = reader.result.split(",")[1];

            resolve(base64String);

        };

        reader.onerror = () => {

            reject(new Error("Unable to read payment screenshot."));

        };

        reader.readAsDataURL(file);

    });

}


// ==========================
// SEND FORM THROUGH GMAIL API
// ==========================

async function submitByEmail(formData) {

    try {

        const response = await fetch(
            "/.netlify/functions/submit-form",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(formData)

            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            console.error("Email submission failed:", result);

            return false;

        }

        console.log("Email submitted successfully:", result);

        return true;

    } catch (error) {

        console.error("Connection error:", error);

        return false;

    }

}


// ==========================
// MALDIVES POPUP
// ==========================

function closeMaldivesPopup() {

    const popup = document.getElementById("maldivesPopup");

    if (popup) {

        popup.style.display = "none";

    }

}

// JOB POPUP

function openJobPopup() {
    const popup = document.getElementById("jobPopup");

    if (popup) {
        popup.style.display = "flex";
    }
}

function closeJobPopup() {
    const popup = document.getElementById("jobPopup");

    if (popup) {
        popup.style.display = "none";
    }
}

window.addEventListener("load", function () {

    const popup = document.getElementById("jobPopup");

    if (!popup) return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("popup") === "1") {
        setTimeout(function () {
            popup.style.display = "flex";
        }, 500);
    }

    popup.addEventListener("click", function (event) {
        if (event.target === popup) {
            closeJobPopup();
        }
    });

});
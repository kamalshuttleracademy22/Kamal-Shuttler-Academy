window.onload = function(){

document.body.style.opacity="1";

}
// ==========================
// KAMAL SHUTTLER ACADEMY
// script.js
// ==========================

// Auto Course Name from URL
const params = new URLSearchParams(window.location.search);

const product = params.get("product");
const price = params.get("price");

if (product) {
    document.getElementById("product").value = decodeURIComponent(product);
    document.getElementById("price").value = "₹" + price;
}

document.getElementById("orderid").value = generateOrderID();
document.getElementById("datetime").value = new Date().toLocaleString();
// Change heading automatically
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
// Generate Order ID
function generateOrderID() {
    return "KBH" + Math.floor(100000 + Math.random() * 900000);
}
async function placeOrder() {

    let product = document.getElementById("product").value;
    let price = document.getElementById("price").value;
    let orderid = document.getElementById("orderid").value;
    let datetime = document.getElementById("datetime").value;

    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let email = document.getElementById("email").value.trim();
    let address = document.getElementById("address").value.trim();
    let pincode = document.getElementById("pincode").value.trim();

    let delivery = document.getElementById("delivery").value;
    let transaction = document.getElementById("transaction").value.trim();
    let notes = document.getElementById("notes").value.trim();

    // Payment screenshot
    const screenshotInput = document.getElementById("paymentScreenshot");

    if (!name || !phone || !email || !address || !pincode || !transaction) {
        alert("Please fill all required fields.");
        return;
    }

    if (!screenshotInput || !screenshotInput.files.length) {
        alert("Please upload payment screenshot.");
        return;
    }

    const screenshotFile = screenshotInput.files[0];

    if (!screenshotFile.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
    }

   // Maximum 3 MB
if (screenshotFile.size > 3 * 1024 * 1024) {
    alert("Payment screenshot must be less than 3 MB.");
    return;
}

    // Convert image to Base64
    const screenshotBase64 = await fileToBase64(screenshotFile);

    const formData = {
        form_type: "product_order",
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

    const saved = await saveToSupabase(formData);

    if (!saved) {
        alert("Order save nahi ho paya. Please try again.");
        return;
    }

    alert(
        "✅ Order submitted successfully!\n\n" +
        "Order ID: " + orderid
    );
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
// SAVE FORM DATA TO SUPABASE
// ==========================

async function saveToSupabase(formData) {

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

            console.error(
                "Supabase save failed:",
                result
            );

            return false;
        }

        console.log(
            "Form saved successfully:",
            result
        );

        return true;

    } catch (error) {

        console.error(
            "Connection error:",
            error
        );

        return false;
    }
}
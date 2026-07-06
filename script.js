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

// Send to WhatsApp
function sendWhatsApp() {

    let product = document.getElementById("product").value.trim();
    let price = document.getElementById("price").value.trim();
    let orderid = document.getElementById("orderid").value;
    let datetime = document.getElementById("datetime").value;
    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let email = document.getElementById("email").value.trim();
    let address = document.getElementById("address").value.trim();
    let pincode = document.getElementById("pincode").value.trim();
    let delivery = document.getElementById("delivery").value;
    let transaction =
document.getElementById("transaction").value;
    let notes = document.getElementById("notes").value.trim();
    let screenshot = document.getElementById("paymentScreenshot").files.length;

if (screenshot == 0) {
    alert("Please upload payment screenshot.");
    return;
}

    // Validation
    if (!name || !phone || !email || !address || !pincode) {
        alert("Please fill all required fields.");
        return;
    }
    let whatsapp = "918797072208";
let message = `

🏸 KAMAL SHUTTLER ACADEMY

🛒 Product :
${product}

💰 Price :
${price}

🆔 Order ID :
${orderid}

📅 Date & Time :
${datetime}

👤 Name :
${name}

📞 Phone :
${phone}

📧 Email :
${email}

📍 Address :
${address}

📮 PIN :
${pincode}

🚚 Delivery :
${delivery}

💳 Transaction ID :
${transaction}

📝 Notes :
${notes || "N/A"}

❤️ Thank You
KAMAL SHUTTLER ACADEMY

`;
let url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

window.open(url, "_blank");
}

window.onload = function () {

    document.body.style.opacity = "1";

    const params = new URLSearchParams(window.location.search);

    const product = params.get("product");
    const price = params.get("price");

    if (document.getElementById("product")) {
        document.getElementById("product").value = decodeURIComponent(product || "");
    }

    if (document.getElementById("price")) {
        document.getElementById("price").value = "₹" + (price || "");
    }

    if (document.getElementById("orderid")) {
        document.getElementById("orderid").value = generateOrderID();
    }

    if (document.getElementById("datetime")) {
        document.getElementById("datetime").value = new Date().toLocaleString();
    }

}

function generateOrderID() {

    return "KBH" + Math.floor(100000 + Math.random() * 900000);

}

function sendWhatsApp() {

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

    if (!name || !phone || !address || !pincode || !transaction) {

        alert("Please fill all required fields.");

        return;

    }

    let whatsapp = "918797072208";

    let message = `

🏸 *KAMAL BADMINTON HUB*

🆔 Order ID : ${orderid}

📅 Date : ${datetime}

📦 Product : ${product}

💰 Price : ${price}

👤 Name : ${name}

📞 Phone : ${phone}

📧 Email : ${email}

📍 Address : ${address}

📮 PIN : ${pincode}

🚚 Delivery : ${delivery}

💳 Transaction ID : ${transaction}

📸 Payment Screenshot :
Uploaded

📝 Notes : ${notes || "N/A"}

❤️ Thank You

KAMAL BADMINTON HUB

`;

    let url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

}
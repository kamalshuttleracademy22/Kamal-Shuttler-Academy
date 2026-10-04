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

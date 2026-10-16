const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function addToCart(
    productId: number,
    quantity = 1
) {
    const token = localStorage.getItem("shop_token");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    const response = await fetch(`${API_URL}/cart/items`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            product_id: productId,
            quantity,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to add product to cart."
        );
    }

    return data;
}

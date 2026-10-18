import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

function getProductImage(imageUrl: string | null) {
  if (!imageUrl) return "";

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  return `${API_ORIGIN}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}


type CartItem = {
  product_id: number;
  name: string;
  price: number;
  image_url: string | null;
  color: string | null;
  quantity: number;
  stock_quantity?: number;
};

function formatPrice(price: number) {
  return `€${price.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;
}

export default function CartPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("shop_token");

  const loadCart = useCallback(async () => {
    const token = getToken();

    if (!token || !localStorage.getItem("shop_user")) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {

      const response = await fetch(`${API_URL}/cart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

      if (response.status === 401 || response.status === 403) {
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load your cart.");
      }

      const data = await response.json();
      const cartItems = Array.isArray(data) ? data : data.items;

      if (!Array.isArray(cartItems)) {
        throw new Error("The server returned an unexpected cart response.");
      }

      setItems(cartItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const updateQuantity = async (
    productId: number,
    quantity: number
  ) => {
    if (quantity < 1) {
      await removeItem(productId);
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    const previousItems = items;

    setItems((current) =>
      current.map((item) =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      )
    );

    try {
      const response = await fetch(
        `${API_URL}/cart/items/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to update quantity.");
      }

      await loadCart();
    } catch (err) {
      setItems(previousItems);
      setError(
        err instanceof Error ? err.message : "Unable to update quantity."
      );
    }
  };

  const removeItem = async (productId: number) => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/cart/items/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to remove this item.");
      }

      setItems((current) =>
        current.filter((item) => item.product_id !== productId)
      );

      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove item."
      );
    }
  };

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-600">Loading your cart...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            to="/"
            className="font-serif text-2xl font-bold italic"
          >
            CarryCraft<span className="text-green-600">.</span>
          </Link>

          <Link
            to="/"
            className="text-sm font-medium transition hover:text-green-700"
          >
            Continue shopping →
          </Link>
        </div>
      </header>

      {/* Cart */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">
            Your selection
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Shopping cart
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in
            your bag
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              onClick={() => void loadCart()}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <section className="bg-white px-5 py-16 text-center shadow-sm sm:py-24">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M5 8h14l1 13H4L5 8Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Find a bag for your next adventure.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center justify-center bg-green-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Explore bags
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_350px]">
            {/* Cart items */}
            <section className="divide-y divide-stone-200 bg-white px-4 sm:px-6">
              {items.map((item) => (
                <article
                  key={item.product_id}
                  className="flex gap-4 py-6 sm:gap-6"
                >
                  <div className="h-28 w-24 shrink-0 overflow-hidden bg-stone-100 sm:h-36 sm:w-32">
                    {item.image_url ? (
                      <img
                          src={getProductImage(item.image_url)}
                        alt={item.name}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-stone-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold leading-6">
                          {item.name}
                        </h2>

                        {item.color && (
                          <p className="mt-1 text-sm text-stone-500">
                            {item.color}
                          </p>
                        )}

                        <p className="mt-2 text-sm font-bold">
                          {formatPrice(Number(item.price))}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold">
                        {formatPrice(
                          Number(item.price) * item.quantity
                        )}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <div className="flex items-center border border-stone-300">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() =>
                            void updateQuantity(
                              item.product_id,
                              item.quantity - 1
                            )
                          }
                          className="h-9 w-9 hover:bg-stone-100"
                        >
                          −
                        </button>

                        <span className="min-w-9 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={
                            item.stock_quantity !== undefined &&
                            item.quantity >= item.stock_quantity
                          }
                          onClick={() =>
                            void updateQuantity(
                              item.product_id,
                              item.quantity + 1
                            )
                          }
                          className="h-9 w-9 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeItem(item.product_id)}
                        className="text-xs font-semibold text-stone-500 underline underline-offset-4 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* Order summary */}
            <aside className="bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-bold">Order summary</h2>

              <div className="mt-6 flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="mt-4 flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Shipping</span>
                <span className="font-semibold">Calculated at checkout</span>
              </div>

              <div className="mt-6 border-t border-stone-200 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold">Subtotal</span>
                  <span className="text-xl font-black">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Shipping and any applicable taxes are calculated
                  during checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/checkout")
                }
                className="mt-7 w-full bg-green-600 px-5 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-green-700"
              >
                Proceed to checkout →
              </button>

              <Link
                to="/"
                className="mt-4 block text-center text-sm font-medium text-stone-600 hover:text-green-700"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

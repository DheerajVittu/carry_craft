
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addToCart } from "../lib/cart";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  tone: string;
};

type Product = {
  id: number;
  name: string;
  color: string;
  price: number;
  mrp: number;
  image: string;
  description?: string;
  stock_quantity: number;
  category_slug?: string;
  category_name?: string;
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api$/, "");

const image = (id: string, width = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const categories: Category[] = [
//   {
//     id: 1,
//     name: "Backpacks",
//     slug: "backpacks",
//     description: "For campus, commutes and everyday plans.",
//     tone: "bg-[#e5eadf] text-[#263c2d]",
//   },
  {
    id: 2,
    name: "Trolley Bags",
    slug: "trolley-bags",
    description: "For journeys near and far.",
    tone: "bg-[#eee7dc] text-[#57432e]",
  },
  {
    id: 3,
    name: "Travel Bags",
    slug: "travel-bags",
    description: "Make room for your next escape.",
    tone: "bg-[#dce7e7] text-[#234443]",
  },
  {
    id: 4,
    name: "Laptop Bags",
    slug: "laptop-bags",
    description: "Your workday, organised.",
    tone: "bg-[#e8e2ed] text-[#493854]",
  },
  {
    id: 5,
    name: "School Bags",
    slug: "school-bags",
    description: "Ready for every new day.",
    tone: "bg-[#f1e5dc] text-[#704632]",
  },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);

function getProductImage(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${className}`}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToCart() {
    const token = localStorage.getItem("shop_token");
    const userText = localStorage.getItem("shop_user");

    if (!token || !userText) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userText);

      if (user.role !== "customer") {
        window.alert("Please log in with a customer account to shop.");
        return;
      }
    } catch {
      window.location.href = "/login";
      return;
    }

    if (product.stock_quantity <= 0) {
      window.alert("This product is currently out of stock.");
      return;
    }

    try {
      setAdding(true);
      await addToCart(product.id, 1);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not add this product to your bag."
      );
    } finally {
      setAdding(false);
    }
  }

  const discount =
    product.mrp > product.price && product.mrp > 0
      ? Math.round(
          ((product.mrp - product.price) / product.mrp) * 100
        )
      : 0;

  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative overflow-hidden bg-[#f5f4ef]">
        <Link
          to={`/product/${product.id}`}
          className="flex aspect-[4/5] items-center justify-center p-4 sm:p-6"
          aria-label={`View ${product.name}`}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-sm text-stone-400">
              Image unavailable
            </span>
          )}
        </Link>

        {discount > 0 && (
          <span className="absolute left-3 top-3 bg-green-800 px-2 py-1 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || product.stock_quantity <= 0}
          aria-label={`Add ${product.name} to cart`}
          title="Add to cart"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-green-800 hover:text-white disabled:opacity-50"
        >
          {adding ? (
            "…"
          ) : added ? (
            "✓"
          ) : (
            <BagIcon />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <Link to={`/product/${product.id}`} className="flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
            {product.category_name || "CarryCraft collection"}
          </p>

          <h3 className="line-clamp-2 text-sm font-semibold text-stone-900 transition group-hover:text-green-800 sm:text-base">
            {product.name}
          </h3>

          <p className="mt-1 text-xs text-stone-500">
            {product.color || "Classic"}
          </p>
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-bold text-stone-950">
            {formatPrice(product.price)}
          </span>

          {discount > 0 && (
            <span className="text-xs text-stone-400 line-through">
              {formatPrice(product.mrp)}
            </span>
          )}
        </div>

        {product.stock_quantity <= 0 && (
          <p className="mt-2 text-xs text-red-600">
            Out of stock
          </p>
        )}
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.23em] ${
          light ? "text-green-300" : "text-green-800"
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-3 font-serif text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl ${
          light ? "text-white" : "text-stone-950"
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`mt-4 max-w-xl text-sm leading-7 ${
            light ? "text-white/70" : "text-stone-600"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Products could not be loaded (${response.status}).`
          );
        }

        const data: unknown = await response.json();

        const rows: any[] = Array.isArray(data)
          ? data
          : data &&
              typeof data === "object" &&
              "products" in data &&
              Array.isArray((data as any).products)
            ? (data as any).products
            : [];

        const mapped: Product[] = rows
          .map((item) => ({
            id: Number(item.id),
            name: String(item.name ?? ""),
            color: String(item.color ?? "Classic"),
            price: Number(item.price),
            mrp: Number(
              item.mrp ?? item.original_price ?? item.price
            ),
            image: getProductImage(
              item.image_url ?? item.image
            ),
            description: item.description,
            stock_quantity: Number(item.stock_quantity ?? 0),
            category_slug: item.category_slug,
            category_name: item.category_name,
          }))
          .filter(
            (product) =>
              Number.isInteger(product.id) &&
              product.id > 0 &&
              product.name.length > 0 &&
              Number.isFinite(product.price)
          );

        setProducts(mapped);
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => controller.abort();
  }, []);

  // Only four products are displayed on the homepage.
  // No second product grid is used.
  

const normalizeCategory = (value?: string | number | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const featuredProducts = useMemo(() => {
  return categories.flatMap((category) => {
    const product = products.find((item) => {
      const slug = normalizeCategory(item.category_slug);
      const name = normalizeCategory(item.category_name);

      return (
        slug === normalizeCategory(category.slug) ||
        name === normalizeCategory(category.name) ||
        name === normalizeCategory(category.slug)
      );
    });

    return product ? [product] : [];
  });
}, [products]);


  function goToAccount() {
    const token = localStorage.getItem("shop_token");
    const userText = localStorage.getItem("shop_user");

    if (!token || !userText) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userText);

      navigate(
        user.role === "admin" ? "/admin" : "/customer"
      );
    } catch {
      navigate("/login");
    }
  }

  function goToCart() {
    if (!localStorage.getItem("shop_token")) {
      navigate("/login");
      return;
    }

    navigate("/cart");
  }

  const navLinks = [
    { label: "Collections", href: "#categories" },
    { label: "Our selection", href: "#featured" },
    { label: "Our philosophy", href: "#story" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-stone-900">
      {/* Announcement bar */}
      <div className="bg-[#202b23] px-4 py-2.5 text-center text-[10px] font-medium tracking-[0.12em] text-white sm:text-xs">
        MADE FOR EVERYDAY JOURNEYS · BUILT AROUND YOUR LIFE
      </div>

      {/* Header */}
      
<header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
  <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:h-20">
    <Link
      to="/"
      className="shrink-0 font-serif text-xl font-bold tracking-tight sm:text-2xl"
    >
      CarryCraft<span className="text-green-700">.</span>
    </Link>

    <nav className="hidden items-center gap-7 md:flex">
      {navLinks.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-sm font-medium text-stone-700 transition hover:text-green-700"
        >
          {item.label}
        </a>
      ))}
    </nav>

    <div className="flex shrink-0 items-center gap-1 sm:gap-3">
      <button
        type="button"
        onClick={goToAccount}
        className="rounded-lg px-2 py-2 text-xs font-medium hover:bg-stone-100 hover:text-green-700 sm:px-3 sm:text-sm"
      >
        Account
      </button>

      <Link
        to={localStorage.getItem("shop_token") ? "/cart" : "/login"}
        aria-label="Shopping cart"
        title="Shopping cart"
        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-stone-100 hover:text-green-700 sm:h-10 sm:w-10"
      >
        <BagIcon />
      </Link>

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-stone-100 md:hidden"
      >
        {menuOpen ? "×" : "☰"}
      </button>
    </div>
  </div>

  {menuOpen && (
    <nav className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
      {navLinks.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className="block border-b border-stone-100 py-3 text-sm last:border-0"
        >
          {item.label}
        </a>
      ))}

      <Link
        to="/purchase-history"
        onClick={() => setMenuOpen(false)}
        className="block py-3 text-sm"
      >
        Purchase history
      </Link>
    </nav>
  )}
</header>


      {/* Hero: travel landscape instead of another bag photo */}
      <section className="relative isolate min-h-[560px] overflow-hidden bg-[#202720] text-white sm:min-h-[620px] lg:min-h-[690px]">
        <img
          src={image("photo-1464822759023-fed622ff2c3b", 2200)}
          alt="Expansive mountain landscape for your next journey"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        <div className="mx-auto flex min-h-[560px] max-w-7xl items-center px-5 py-20 sm:min-h-[620px] sm:px-8 lg:min-h-[690px] lg:px-12">
          <div className="max-w-3xl">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-green-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-green-200 sm:text-xs">
                The CarryCraft collection
              </p>
            </div>

            <h1 className="max-w-3xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-7xl lg:text-[88px]">
              Your life.
              <br />
              Your plans.
              <br />
              <span className="italic text-green-300">
                Your next chapter.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
              From everyday routines to unexpected adventures,
              find the essentials that move with you.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#categories"
                className="inline-flex min-h-12 items-center justify-center gap-4 bg-green-400 px-6 py-3 text-xs font-bold text-stone-950 transition hover:bg-green-300 sm:text-sm"
              >
                Explore collections
                <ArrowIcon />
              </a>

              <a
                href="#featured"
                className="inline-flex min-h-12 items-center justify-center border border-white/60 px-6 py-3 text-xs font-semibold text-white transition hover:bg-white hover:text-stone-950 sm:text-sm"
              >
                Discover our picks
              </a>
            </div>

            <div className="mt-12 flex items-center gap-4 text-[10px] uppercase tracking-[0.16em] text-white/65 sm:text-xs">
              <span>Everyday</span>
              <span className="h-1 w-1 rounded-full bg-green-300" />
              <span>Work</span>
              <span className="h-1 w-1 rounded-full bg-green-300" />
              <span>Travel</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 right-7 hidden items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/70 lg:flex">
          <span>Carry better</span>
          <span className="h-px w-10 bg-white/50" />
          <span>Go further</span>
        </div>
      </section>

      {/* Minimal benefits strip */}
      <section className="border-b border-stone-200 bg-[#f8f7f3]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-stone-200 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4 py-5 sm:px-5 lg:py-7">
            <span className="font-serif text-2xl text-green-900">01</span>
            <div>
              <p className="text-xs font-semibold sm:text-sm">
                Made for everyday
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Useful styles for real routines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-5 sm:px-5 lg:py-7">
            <span className="font-serif text-2xl text-green-900">02</span>
            <div>
              <p className="text-xs font-semibold sm:text-sm">
                A style for every plan
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Explore by what you need
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-5 sm:px-5 lg:py-7">
            <span className="font-serif text-2xl text-green-900">03</span>
            <div>
              <p className="text-xs font-semibold sm:text-sm">
                Easy to explore
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Find your next everyday essential
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories: graphic tiles, no bag photographs */}
      <section
        id="categories"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Find your everyday essential"
            title="Your world. Your way."
          />

          <p className="max-w-sm text-sm leading-7 text-stone-600">
            Different days call for different bags. Find the
            collection that fits your plans.
          </p>
        </div>

        
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
  {categories.map((category, index) => (
    <Link
      key={category.id}
      to={`/category/${category.slug}`}
      className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden p-5 transition duration-300 hover:-translate-y-1 sm:min-h-[250px] sm:p-6 ${
        category.tone
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold tracking-[0.2em] opacity-60">
          0{index + 1} / COLLECTION
        </span>

        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current/25 transition duration-300 group-hover:rotate-45 group-hover:bg-white/50">
          <ArrowIcon className="-rotate-45" />
        </span>
      </div>

      <div className="relative z-10 mt-8">
        <h3 className="font-serif text-2xl leading-tight sm:text-3xl">
          {category.name}
        </h3>

        <p className="mt-2 text-xs leading-5 opacity-75 sm:text-sm">
          {category.description}
        </p>

        <span className="mt-5 inline-block border-b border-current/40 pb-1 text-[10px] font-bold uppercase tracking-[0.15em]">
          Explore collection
        </span>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-14 -right-8 h-36 w-36 rounded-full border border-current/10 transition duration-500 group-hover:scale-125 sm:h-44 sm:w-44"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-1 h-20 w-20 rounded-full border border-current/10 transition duration-500 group-hover:translate-x-2 group-hover:-translate-y-2"
      />
    </Link>
  ))}
</div>

      </section>

      {/* The only product grid on the homepage */}
      <section
        id="featured"
        className="scroll-mt-20 bg-[#f7f6f2] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="A considered selection"
              title="A few good finds."
              description="Explore four picks from our collection. Each product links to its own details page."
            />

            <Link
              to="/products"
              className="inline-flex items-center gap-3 self-start border-b border-stone-400 pb-2 text-xs font-semibold transition hover:border-green-800 hover:text-green-800 sm:self-auto"
            >
              View all products
              <ArrowIcon />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="aspect-[4/5] bg-stone-200" />
                  <div className="mt-4 h-3 w-3/4 bg-stone-200" />
                  <div className="mt-3 h-3 w-1/3 bg-stone-200" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="border border-stone-200 bg-white px-5 py-12 text-center">
              <p className="text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 border-b border-stone-500 pb-1 text-sm font-semibold"
              >
                Try again
              </button>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border border-stone-200 bg-white px-5 py-12 text-center">
              <p className="font-serif text-2xl">
                Your next favourite is on its way.
              </p>
              <p className="mt-3 text-sm text-stone-500">
                No products are available right now.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Brand story: typography and scenery, not another bag display */}
      <section
        id="story"
        className="scroll-mt-20 bg-[#202b23] text-white"
      >
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
            <SectionHeading
              light
              eyebrow="The CarryCraft philosophy"
              title="Less to worry about. More to explore."
              description="Your day can take you in a hundred different directions. We believe the things you carry should make life feel a little more organised, so you can focus on where you are going."
            />

            <div className="mt-8">
              <a
                href="#categories"
                className="inline-flex items-center gap-3 border-b border-green-300 pb-2 text-sm font-semibold text-green-200 transition hover:text-white"
              >
                Find your collection
                <ArrowIcon />
              </a>
            </div>
          </div>

          <div className="relative min-h-[300px] overflow-hidden sm:min-h-[420px] lg:min-h-[540px]">
            <img
              src={image("photo-1470770841072-f978cf4d019e", 1400)}
              alt="A peaceful lake surrounded by mountains"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            <div className="absolute bottom-7 left-7 border-l border-green-300 pl-4 sm:bottom-10 sm:left-10">
              <p className="font-serif text-2xl italic sm:text-3xl">
                Take the scenic route.
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/75">
                Wherever life takes you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="bg-[#eeeee5] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-green-800">
              Ready when you are
            </p>

            <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight sm:text-4xl">
              Find the bag that fits your next move.
            </h2>
          </div>

          <Link
            to="/products"
            className="inline-flex min-h-12 items-center justify-center gap-4 self-start bg-[#263c2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-900 sm:self-auto"
          >
            Explore all products
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#171c18] px-5 py-10 text-white sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/"
              className="font-serif text-3xl font-bold tracking-tight"
            >
              CarryCraft<span className="text-green-400">.</span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-6 text-stone-400">
              Practical essentials for everyday journeys and
              the adventures waiting beyond them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:gap-x-16">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
                Explore
              </p>

              <nav className="flex flex-col gap-3 text-sm text-stone-300">
                <a
                  href="#categories"
                  className="transition hover:text-white"
                >
                  Collections
                </a>

                <a
                  href="#featured"
                  className="transition hover:text-white"
                >
                  Featured products
                </a>

                <Link to="/#categories">Shop Backpacks</Link>
              </nav>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
                Your account
              </p>

              <nav className="flex flex-col gap-3 text-sm text-stone-300">
                <button
                  type="button"
                  onClick={goToAccount}
                  className="text-left transition hover:text-white"
                >
                  My account
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!localStorage.getItem("shop_token")) {
                      navigate("/login");
                    } else {
                      navigate("/purchase-history");
                    }
                  }}
                  className="text-left transition hover:text-white"
                >
                  Purchase history
                </button>

                <button
                  type="button"
                  onClick={goToCart}
                  className="text-left transition hover:text-white"
                >
                  Shopping cart
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} CarryCraft. All rights reserved.
          </p>
          <p>Carry better. Go further.</p>
        </div>
      </footer>
    </main>
  );
}

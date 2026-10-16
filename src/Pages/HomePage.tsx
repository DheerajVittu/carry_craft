import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { addToCart } from "../lib/cart";

/* =====================================================
   TYPES
===================================================== */

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string;
    image: string;
};

type Product = {
    id: number;
    name: string;
    color: string;
    price: number;
    mrp: number;
    image: string;
    description?: string;
    brand?: string;
    stock_quantity: number;
    category_name?: number;
    category_slug?: string;
};

type PhotoProps = {
    src: string;
    alt: string;
    className?: string;
};

type ProductCardProps = {
    product: Product;
};

type SectionHeadingProps = {
    title: string;
    subtitle?: string;
};

type BannerProps = {
    image: string;
    alt: string;
    children: ReactNode;
    className?: string;
};

/* =====================================================
   API CONFIGURATION
===================================================== */

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

function getProductImage(imageUrl?: string) {
    if (!imageUrl) return "";

    if (/^https?:\/\//i.test(imageUrl)) {
        return imageUrl;
    }

    return `${API_ORIGIN}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

const img = (id: string, width = 800) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

    /* =====================================================
       CATEGORIES
    ===================================================== */

    const categories: Category[] = [
        {
            id: 1,
            name: "Backpacks",
            slug: "backpacks",
            description: "Everyday and laptop backpacks",
            image: img("photo-1553062407-98eeb64c6a62"),
        },
        {
            id: 2,
            name: "Trolley Bags",
            slug: "trolley-bags",
            description: "Wheeled luggage for travel",
            image: img("photo-1565026057447-bc90a3dceb87"),
        },
        {
            id: 3,
            name: "Travel Bags",
            slug: "travel-bags",
            description: "Duffel bags and travel luggage",
            image: img("photo-1547949003-9792a18a2601"),
        },
        {
            id: 4,
            name: "Laptop Bags",
            slug: "laptop-bags",
            description: "Bags designed for laptops",
            image: img("photo-1491637639811-60e2756cc1c7"),
        },
        {
            id: 5,
            name: "School Bags",
            slug: "school-bags",
            description: "Bags for students",
            image: img("photo-1577733966973-d680bffd2e80"),
        },
    ];

/* =====================================================
   UTILITIES
===================================================== */

const formatPrice = (price: number) =>
    `€${price.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const getDiscount = (product: Product) => {
    if (!product.mrp || product.mrp <= product.price) return 0;

    return Math.round(
        ((product.mrp - product.price) / product.mrp) * 100
    );
};

/* =====================================================
   IMAGE COMPONENT
===================================================== */

function Photo({ src, alt, className = "" }: PhotoProps) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    if (!src || failed) {
        return (
            <div
                role="img"
                aria-label={alt}
                className={`flex items-center justify-center bg-stone-100 text-xs text-stone-400 ${className}`}
            >
                Image unavailable
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className={className}
        />
    );
}

/* =====================================================
   SECTION HEADING
===================================================== */

function SectionHeading({
                            title,
                            subtitle,
                        }: SectionHeadingProps) {
    return (
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
                {subtitle && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                        {subtitle}
                    </p>
                )}

                <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl lg:text-3xl">
                    {title}
                </h2>
            </div>
        </div>
    );
}

/* =====================================================
   SHOPPING BAG ICON
===================================================== */

function BagIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
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

/* =====================================================
   PRODUCT CARD
   Products come from PostgreSQL.
===================================================== */

function ProductCard({ product }: ProductCardProps) {
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
                alert("Please log in with a customer account to shop.");
                return;
            }
        } catch {
            window.location.href = "/login";
            return;
        }

        if (!Number.isInteger(product.id) || product.id <= 0) {
            alert("Invalid product ID.");
            return;
        }

        if (product.stock_quantity <= 0) {
            alert("This product is currently out of stock.");
            return;
        }

        try {
            setAdding(true);
            setAdded(false);

            await addToCart(product.id, 1);

            setAdded(true);
            window.setTimeout(() => setAdded(false), 2000);
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to add product to cart."
            );
        } finally {
            setAdding(false);
        }
    }

    return (
        <article className="group relative flex h-full min-w-0 flex-col bg-white">
            <div className="relative overflow-hidden bg-stone-50">
                <Link
                    to={`/product/${product.id}`}
                    aria-label={`View ${product.name}`}
                    className="flex aspect-[4/5] items-center justify-center p-4 sm:p-6"
                >
                    <Photo
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
                    />
                </Link>

                {getDiscount(product) > 0 && (
                    <span className="absolute left-3 top-3 bg-green-600 px-2 py-1 text-[10px] font-bold text-white sm:left-4 sm:top-4">
                        -{getDiscount(product)}%
                    </span>
                )}

                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={adding || product.stock_quantity <= 0}
                    aria-label={`Add ${product.name} to cart`}
                    title="Add to cart"
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center bg-white shadow-sm transition hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:top-4"
                >
                    {adding ? (
                        <span className="text-xs">...</span>
                    ) : added ? (
                        <span className="text-lg text-green-600">✓</span>
                    ) : (
                        <BagIcon />
                    )}
                </button>
            </div>

            <div className="flex flex-1 flex-col px-1 pb-3 pt-4 sm:px-2 sm:pt-5">
                <Link
                    to={`/product/${product.id}`}
                    className="flex-1"
                >
                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-stone-900 transition group-hover:text-green-700 sm:text-base sm:leading-6">
                        {product.name}
                    </h3>

                    <p className="mt-1.5 text-xs text-stone-500 sm:text-sm">
                        {product.color}
                    </p>
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold text-stone-900 sm:text-base">
                        {formatPrice(product.price)}
                    </span>

                    {product.mrp > product.price && (
                        <span className="text-xs text-stone-400 line-through sm:text-sm">
                            {formatPrice(product.mrp)}
                        </span>
                    )}
                </div>

                <Link
                    to={`/product/${product.id}`}
                    className="mt-4 flex min-h-10 items-center justify-center gap-2 border border-stone-300 px-2 py-2 text-xs font-semibold uppercase tracking-wider transition hover:border-stone-900 hover:bg-stone-900 hover:text-white sm:text-sm"
                >
                    View product <span>→</span>
                </Link>
            </div>
        </article>
    );
}

/* =====================================================
   PROMOTIONAL BANNER
===================================================== */

function BannerTile({
                        image,
                        alt,
                        children,
                        className = "",
                    }: BannerProps) {
    return (
        <Link
            to="/login"
            className={`group relative isolate flex min-h-[300px] overflow-hidden bg-stone-800 text-white ${className}`}
        >
            <Photo
                src={image}
                alt={alt}
                className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />

            <div className="flex w-full flex-col items-start justify-end p-6 sm:p-8 lg:p-10">
                {children}
            </div>
        </Link>
    );
}

/* =====================================================
   HEADER ICONS
===================================================== */

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" />
        </svg>
    );
}
import { useNavigate } from "react-router-dom";


function UserIcon() {
    const navigate = useNavigate();

    const handleUserClick = () => {
        const token = localStorage.getItem("shop_token");

        if (token) {
            navigate("/customer");
        } else {
            navigate("/login");
        }
    };

    return (
        <button
            type="button"
            onClick={handleUserClick}
            aria-label="My account"
            title="My account"
            className="inline-flex items-center justify-center"
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
                aria-hidden="true"
            >
                <circle cx="12" cy="7.5" r="3.5" />
                <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
            </svg>
        </button>
    );
}

/* =====================================================
   HOMEPAGE
===================================================== */

export default function HomePage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState("");

    /* -----------------------------------------------
       FETCH PRODUCTS FROM POSTGRESQL
    ------------------------------------------------ */

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            try {
                setProductsLoading(true);
                setProductsError("");

                const response = await fetch(`${API_URL}/products`);

                if (!response.ok) {
                    throw new Error(
                        `Failed to load products (${response.status}).`
                    );
                }

                const data: unknown = await response.json();

                const rows: any[] = Array.isArray(data)
                    ? data
                    : data &&
                    typeof data === "object" &&
                    "products" in data &&
                    Array.isArray((data as { products: unknown }).products)
                        ? (data as { products: any[] }).products
                        : [];

                if (!Array.isArray(rows)) {
                    throw new Error("Invalid products API response.");
                }

                const mappedProducts: Product[] = rows
                    .map((item: any) => ({
                        id: Number(item.id),
                        name: String(item.name ?? ""),
                        color: String(item.color ?? "Classic"),
                        price: Number(item.price),
                        mrp: Number(item.price),
                        image: getProductImage(item.image_url),
                        description: item.description,
                        brand: item.brand,
                        stock_quantity: Number(item.stock_quantity ?? 0),
                        category_name:
                            item.category_name == null
                                ? undefined
                                : Number(item.category_name),
                        category_slug: item.category_slug,
                    }))
                    .filter(
                        (product) =>
                            Number.isInteger(product.id) &&
                            product.id > 0 &&
                            product.name.length > 0 &&
                            Number.isFinite(product.price)
                    );

                if (!cancelled) {
                    setProducts(mappedProducts);
                }
            } catch (error) {
                if (!cancelled) {
                    setProductsError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load products."
                    );
                }
            } finally {
                if (!cancelled) {
                    setProductsLoading(false);
                }
            }
        }

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    /* -----------------------------------------------
       CURRENT USER DEBUG LOGGING
    ------------------------------------------------ */

    useEffect(() => {
        const userText = localStorage.getItem("shop_user");

        if (!userText) return;

        try {
            const user = JSON.parse(userText);
            console.log("Currently logged-in user:", user);
        } catch (error) {
            console.error("Failed to read user details:", error);
        }
    }, []);

    /* -----------------------------------------------
       PRODUCT SECTION HELPER
    ------------------------------------------------ */

    function renderProductGrid(items: Product[], columns = "lg:grid-cols-4") {
        if (productsLoading) {
            return (
                <p className="col-span-full py-8 text-center text-stone-500">
                    Loading CarryCraft products...
                </p>
            );
        }

        if (productsError) {
            return (
                <p className="col-span-full py-8 text-center text-red-600">
                    {productsError}
                </p>
            );
        }

        if (items.length === 0) {
            return (
                <p className="col-span-full py-8 text-center text-stone-500">
                    No products are currently available.
                </p>
            );
        }

        return (
            <div
                className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 ${columns}`}
            >
                {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        );
    }

    // Divide the randomly fetched database products among homepage sections.
    const saleProducts = products.slice(0, 6);
    const girlPowerProducts = products.slice(6, 11);
    const backToSchoolProducts = products.slice(11, 15);

    return (
        <main className="min-h-screen overflow-x-clip bg-white text-stone-900">
            {/* ANNOUNCEMENT BAR */}

            <div className="bg-stone-950 px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-white sm:text-xs sm:tracking-[0.2em]">
                End of season sale — discover your next adventure
            </div>

            {/* HEADER */}

            <header className="relative z-30 border-b border-stone-200 bg-white">
                <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-8 lg:h-[88px] lg:px-12">
                    <Link
                        to="/"
                        className="shrink-0 font-serif text-2xl font-bold italic tracking-tight sm:text-3xl"
                    >
                        CarryCraft<span className="text-green-600">.</span>
                    </Link>

                    <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
                        <a href="#categories" className="text-sm font-medium transition hover:text-green-700">
                            Categories
                        </a>
                        <a href="#girl-power" className="text-sm font-medium transition hover:text-green-700">
                            Collections
                        </a>
                        <a href="#back-to-school" className="text-sm font-medium transition hover:text-green-700">
                            School & travel
                        </a>
                        <a href="#sale" className="text-sm font-semibold text-green-700 transition hover:text-green-800">
                            Sale
                        </a>
                    </nav>

                    <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                        <Link to="/login" aria-label="Search products" className="hidden transition hover:text-green-700 sm:flex">
                            <SearchIcon />
                        </Link>


                        <div className="transition hover:text-green-700">
                            <UserIcon />
                        </div>


                        <Link
                            to={
                                localStorage.getItem("shop_token") &&
                                localStorage.getItem("shop_user")
                                    ? "/cart"
                                    : "/login"
                            }
                            aria-label="Shopping bag"
                            className="transition hover:text-green-700"
                        >
                            <BagIcon />
                        </Link>

                        <button
                            type="button"
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((open) => !open)}
                            className="flex h-10 w-10 items-center justify-center text-2xl lg:hidden"
                        >
                            {menuOpen ? "×" : "☰"}
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <nav className="absolute left-0 top-full flex w-full flex-col border-t border-stone-200 bg-white px-5 py-4 shadow-lg lg:hidden">
                        {[
                            ["Categories", "#categories"],
                            ["Best sellers", "#sale"],
                            ["Collections", "#girl-power"],
                            ["School & travel", "#back-to-school"],
                            ["Sale", "#sale"],
                        ].map(([label, href]) => (
                            <a
                                key={label}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className="border-b border-stone-100 py-3 text-sm font-medium last:border-0"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                )}
            </header>

            {/* HERO */}

            <section className="relative isolate min-h-[570px] overflow-hidden bg-stone-900 text-white sm:min-h-[660px] lg:min-h-[700px]">
                <Photo
                    src={img("photo-1553062407-98eeb64c6a62", 2200)}
                    alt="Backpack ready for everyday adventures"
                    className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
                />

                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />

                <div className="mx-auto grid min-h-[570px] max-w-[1600px] items-center px-5 py-16 sm:min-h-[660px] sm:px-10 lg:min-h-[700px] lg:grid-cols-2 lg:px-16">
                    <div className="max-w-2xl">
                        <div className="mb-6 flex items-center gap-3">
                            <span className="h-px w-10 bg-green-400" />
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-300 sm:text-sm">
                                Built for the bold
                            </p>
                        </div>

                        <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
                            END OF
                            <br />
                            SEASON
                            <br />
                            <span className="text-green-400">SALE.</span>
                        </h1>

                        <p className="mt-6 max-w-md text-sm leading-7 text-white/80 sm:text-base">
                            Wherever life takes you, carry something that moves
                            with you. Find your next favourite bag at a price
                            worth travelling for.
                        </p>

                        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <a
                                href="#sale"
                                className="inline-flex min-h-12 items-center justify-center gap-4 bg-green-500 px-7 py-3 text-sm font-bold uppercase tracking-wider text-stone-950 transition hover:bg-green-400"
                            >
                                Shop the sale <span>→</span>
                            </a>

                            <span className="text-sm font-medium text-white/90">
                                Explore CarryCraft bags
                            </span>
                        </div>
                    </div>

                    <div className="hidden justify-end lg:flex">
                        <div className="max-w-[230px] border-l-2 border-green-400 pl-5">
                            <p className="text-4xl font-black">GO</p>
                            <p className="text-4xl font-black text-green-400">YOUR</p>
                            <p className="text-4xl font-black">OWN WAY.</p>
                            <p className="mt-4 text-sm leading-6 text-white/70">
                                Less ordinary. More adventure. Always CarryCraft.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 h-1 w-full bg-white/15">
                    <div className="h-full w-1/3 bg-green-400" />
                </div>
            </section>

            {/* CATEGORIES */}

            <section id="categories" className="mx-auto max-w-[1600px] px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
                <SectionHeading title="Shop by category" subtitle="Find your perfect bag" />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            to={`/category/${category.slug}`}
                            className="group min-w-0"
                        >
                            <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                                <Photo
                                    src={category.image}
                                    alt={category.name}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                            </div>

                            <div className="border-b border-stone-200 py-3 transition group-hover:border-green-600 sm:py-4">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-stone-900">
                                        {category.name}
                                    </h3>
                                    <span className="shrink-0 transition group-hover:translate-x-1">→</span>
                                </div>

                                <p className="mt-1 text-xs leading-5 text-stone-500">
                                    {category.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* SALE COLLECTION */}

            <section id="sale" className="bg-stone-50 py-14 sm:py-20">
                <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
                    <SectionHeading
                        title="The end-of-season edit."
                        subtitle="Discover CarryCraft"
                    />

                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
                        <BannerTile
                            image={img("photo-1523381210434-271e8be1f52b", 1200)}
                            alt="Seasonal fashion collection"
                            className="col-span-2 min-h-[310px] sm:min-h-[380px] lg:min-h-full"
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
                                Explore CarryCraft
                            </p>

                            <h3 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                                SEASON
                                <br />
                                <span className="text-green-400">SALE.</span>
                            </h3>

                            <p className="mt-4 text-sm text-white/80">
                                Your next adventure starts here.
                            </p>

                            <span className="mt-6 inline-flex items-center gap-3 text-sm font-bold uppercase tracking-wider">
                                Shop the edit <span>→</span>
                            </span>
                        </BannerTile>

                        {productsLoading ? (
                            <p className="col-span-2 py-8 text-center text-stone-500">
                                Loading products...
                            </p>
                        ) : productsError ? (
                            <p className="col-span-2 py-8 text-center text-red-600">
                                {productsError}
                            </p>
                        ) : (
                            saleProducts.slice(0, 2).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        )}
                    </div>

                    <div className="mt-8">
                        {renderProductGrid(saleProducts, "lg:grid-cols-4")}
                    </div>
                </div>
            </section>

            {/* COLLECTIONS */}

            <section id="girl-power" className="mx-auto max-w-[1600px] px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
                <SectionHeading
                    title="Find your next favourite."
                    subtitle="Explore our collections"
                />

                <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
                    <BannerTile
                        image={img("photo-1529139574466-a303027c1d8b", 1200)}
                        alt="Contemporary lifestyle collection"
                        className="col-span-2 min-h-[310px] sm:min-h-[420px] lg:min-h-full"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
                            Made to stand out
                        </p>

                        <h3 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                            YOUR
                            <br />
                            STYLE.
                        </h3>

                        <p className="mt-4 max-w-xs text-sm leading-6 text-white/80">
                            Everyday essentials for confident moves and new adventures.
                        </p>

                        <span className="mt-6 inline-flex items-center gap-3 text-sm font-bold uppercase tracking-wider">
                            Explore collection <span>→</span>
                        </span>
                    </BannerTile>

                    {productsLoading ? (
                        <p className="col-span-2 py-8 text-center text-stone-500">
                            Loading products...
                        </p>
                    ) : productsError ? (
                        <p className="col-span-2 py-8 text-center text-red-600">
                            {productsError}
                        </p>
                    ) : (
                        girlPowerProducts.slice(0, 2).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>

                <div className="mt-8">
                    {renderProductGrid(
                        girlPowerProducts.slice(2),
                        "lg:grid-cols-4"
                    )}
                </div>
            </section>

            {/* BACK TO SCHOOL AND TRAVEL */}

            <section id="back-to-school" className="bg-stone-50 py-14 sm:py-20">
                <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
                    <SectionHeading
                        title="Ready for what's next?"
                        subtitle="Everyday and travel essentials"
                    />

                    <BannerTile
                        image={img("photo-1519501025264-65ba15a82390", 2000)}
                        alt="City lifestyle for the school and travel collection"
                        className="min-h-[340px] sm:min-h-[470px] lg:min-h-[560px]"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-300 sm:text-sm">
                            New adventures await
                        </p>

                        <h3 className="mt-3 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                            MAKE YOUR
                            <br />
                            OWN WAY.
                        </h3>

                        <p className="mt-5 max-w-md text-sm leading-6 text-white/80 sm:text-base">
                            Everyday essentials designed for big plans,
                            busy days and everything in between.
                        </p>

                        <span className="mt-6 inline-flex items-center gap-3 text-sm font-bold uppercase tracking-wider">
                            Shop bags <span>→</span>
                        </span>
                    </BannerTile>

                    <div className="mt-8">
                        {renderProductGrid(
                            backToSchoolProducts,
                            "lg:grid-cols-4"
                        )}
                    </div>
                </div>
            </section>

            {/* BRAND STATEMENT */}

            <section className="bg-green-500 px-5 py-14 text-center sm:py-20">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-900/70">
                    Carry your world
                </p>

                <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
                    YOUR JOURNEY.
                    <br />
                    YOUR RULES.
                </h2>

                <a
                    href="#categories"
                    className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 border border-stone-950 px-7 py-3 text-sm font-bold uppercase tracking-wider text-stone-950 transition hover:bg-stone-950 hover:text-white"
                >
                    Discover CarryCraft <span>→</span>
                </a>
            </section>

            {/* FOOTER */}

            <footer className="bg-stone-950 px-5 py-10 text-white sm:px-8 sm:py-14">
                <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-8 sm:flex-row sm:items-center">
                    <div>
                        <Link
                            to="/"
                            className="font-serif text-2xl font-bold italic tracking-tight"
                        >
                            CarryCraft<span className="text-green-400">.</span>
                        </Link>

                        <p className="mt-3 max-w-sm text-sm leading-6 text-stone-400">
                            Bags for the bold, the curious and the always-on-the-go.
                        </p>
                    </div>

                    <nav
                        aria-label="Footer navigation"
                        className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-300"
                    >
                        <Link to="/login" className="transition hover:text-green-400">
                            My account
                        </Link>
                        <a href="#categories" className="transition hover:text-green-400">
                            Categories
                        </a>
                        <a href="#sale" className="transition hover:text-green-400">
                            Sale
                        </a>
                        <a href="#back-to-school" className="transition hover:text-green-400">
                            Collections
                        </a>
                    </nav>
                </div>

                <div className="mx-auto mt-9 max-w-[1600px] border-t border-white/10 pt-5 text-xs text-stone-500">
                    © {new Date().getFullYear()} CarryCraft. All rights reserved.
                </div>
            </footer>
        </main>
    );
}

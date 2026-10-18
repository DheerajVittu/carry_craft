// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";

// type Product = {
//     id: number | string;
//     name: string;
//     description?: string;
//     color?: string;
//     price: number | string;
//     mrp?: number | string;
//     image?: string;
//     image_url?: string;
// };

// type CategoryInfo = {
//     name: string;
//     description: string;
// };

// const categoryInfo: Record<string, CategoryInfo> = {
//     backpacks: {
//         name: "Backpacks",
//         description: "Everyday and laptop backpacks",
//     },
//     "trolley-bags": {
//         name: "Trolley Bags",
//         description: "Wheeled luggage for travel",
//     },
//     "travel-bags": {
//         name: "Travel Bags",
//         description: "Duffel bags and travel luggage",
//     },
//     "laptop-bags": {
//         name: "Laptop Bags",
//         description: "Bags designed for laptops",
//     },
//     "school-bags": {
//         name: "School Bags",
//         description: "Bags for students",
//     },
//     handbags: {
//         name: "Handbags",
//         description: "Everyday handbags",
//     },
// };

// const formatPrice = (value: number | string) =>
//     `€${Number(value).toLocaleString("de-DE", {
//         maximumFractionDigits: 2,
//     })}`;

// function BagIcon() {
//     return (
//         <svg
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="1.6"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             className="h-5 w-5"
//             aria-hidden="true"
//         >
//             <path d="M5 8h14l1 13H4L5 8Z" />
//             <path d="M9 9V6a3 3 0 0 1 6 0v3" />
//         </svg>
//     );
// }


// function ProductCard({ product }: { product: Product }) {
//     const price = Number(product.price);
//     const mrp = Number(product.mrp ?? product.price);
//     const image = product.image || product.image_url;

//     const discount =
//         mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

//     return (
//         <article className="group flex min-w-0 flex-col bg-white">
//             <div className="relative overflow-hidden bg-stone-50">
//                 <Link
//                     to="/login"
//                     aria-label={`View ${product.name}`}
//                     className="flex aspect-[4/5] items-center justify-center p-4 sm:p-6"
//                 >
//                     {image ? (
//                         <img
//                             src={image}
//                             alt={product.name}
//                             loading="lazy"
//                             className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
//                             onError={(event) => {
//                                 event.currentTarget.style.display = "none";
//                             }}
//                         />
//                     ) : (
//                         <span className="text-sm text-stone-400">
//                             No image available
//                         </span>
//                     )}
//                 </Link>

//                 {discount > 0 && (
//                     <span className="absolute left-3 top-3 bg-green-600 px-2 py-1 text-[10px] font-bold text-white sm:left-4 sm:top-4">
//                         -{discount}%
//                     </span>
//                 )}

//                 <Link
//                     to="/login"
//                     aria-label={`Add ${product.name} to your shopping bag`}
//                     className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm transition hover:bg-green-500 hover:text-white sm:right-4 sm:top-4"
//                 >
//                     <BagIcon />
//                 </Link>
//             </div>

//             <div className="flex flex-1 flex-col px-1 pb-3 pt-4 sm:px-2 sm:pt-5">
//                 <Link to="/login" className="flex-1">
//                     <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-stone-900 transition group-hover:text-green-700 sm:text-base">
//                         {product.name}
//                     </h2>

//                     {product.color && (
//                         <p className="mt-1.5 text-xs text-stone-500 sm:text-sm">
//                             {product.color}
//                         </p>
//                     )}

//                     {product.description && (
//                         <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
//                             {product.description}
//                         </p>
//                     )}
//                 </Link>

//                 <div className="mt-3 flex flex-wrap items-center gap-2">
//                     <span className="text-sm font-bold text-stone-900 sm:text-base">
//                         {formatPrice(product.price)}
//                     </span>

//                     {mrp > price && (
//                         <span className="text-xs text-stone-400 line-through sm:text-sm">
//                             {formatPrice(mrp)}
//                         </span>
//                     )}
//                 </div>
//             </div>
//         </article>
//     );
// }

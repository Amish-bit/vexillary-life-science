import { supabase } from "./supabase.js";

const productsGrid = document.querySelector(".products-grid");

async function loadProducts() {
    if (!productsGrid) return;

    productsGrid.innerHTML = "<p>Loading products...</p>";

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_published", true)
        .order("id", { ascending: true });

    if (error) {
        productsGrid.innerHTML =
            "<p>Unable to load products. Please try again later.</p>";
        console.error(error);
        return;
    }

    if (!data.length) {
        productsGrid.innerHTML = "<p>No products available yet.</p>";
        return;
    }

    productsGrid.innerHTML = data.map(product => `
        <article class="product-card">
            ${product.image_url ? `
                <img
                    class="product-image"
                    src="${escapeHTML(product.image_url)}"
                    alt="${escapeHTML(product.name)}"
                >
            ` : ""}
            <h3>${escapeHTML(product.name)}</h3>
            <p>${escapeHTML(product.description || "")}</p>
        </article>
    `).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

loadProducts();
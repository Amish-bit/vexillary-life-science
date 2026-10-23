import { supabase } from "./supabase.js";

const $ = id => document.getElementById(id);
let editingId = null;
let currentProducts = [];

function message(text) {
    $("message").textContent = text;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

async function checkLogin() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        message("Could not check login status. Please refresh.");
        return;
    }

    const session = data.session;
    $("login").style.display = session ? "none" : "block";
    $("dashboard").style.display = session ? "block" : "none";

    if (session) await loadProducts();
}

$("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    message("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({
        email: $("email").value.trim(),
        password: $("password").value
    });

    if (error) {
        message("Login failed. Check your email and password.");
        return;
    }

    message("Login successful!");
    await checkLogin();
});

async function loadProducts() {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        message("Could not load products: " + error.message);
        return;
    }

    currentProducts = data || [];

    $("productList").innerHTML = currentProducts.length
        ? currentProducts.map(p => `
            <div class="product">
                ${p.image_url ? `<img src="${escapeHTML(p.image_url)}" alt="">` : ""}
                <h3>${escapeHTML(p.name)}</h3>
                <p>${escapeHTML(p.description)}</p>
                <p>${p.is_published ? "Published" : "Hidden"}</p>
                <button data-edit="${p.id}">Edit</button>
                <button class="danger" data-delete="${p.id}">Delete</button>
            </div>
        `).join("")
        : "<p>No products yet.</p>";
}

$("productList").addEventListener("click", async event => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;

    if (editId) {
        const p = currentProducts.find(item => item.id === Number(editId));
        if (!p) return;

        editingId = p.id;
        $("productName").value = p.name;
        $("description").value = p.description || "";
        $("published").checked = p.is_published;
        $("formTitle").textContent = "Edit Product";
        $("cancelEdit").style.display = "block";
        message("Editing " + p.name);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (deleteId && confirm("Delete this product permanently?")) {
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", Number(deleteId));

        if (error) {
            message("Delete failed: " + error.message);
        } else {
            message("Product deleted.");
            await loadProducts();
        }
    }
});

$("cancelEdit").addEventListener("click", resetForm);

function resetForm() {
    editingId = null;
    $("productForm").reset();
    $("published").checked = true;
    $("formTitle").textContent = "Add Product";
    $("cancelEdit").style.display = "none";
}

$("productForm").addEventListener("submit", async event => {
    event.preventDefault();
    message("Saving product...");

    const name = $("productName").value.trim();
    const description = $("description").value.trim();
    const file = $("image").files[0];

    if (file && !file.type.startsWith("image/")) {
        message("Please select an image file.");
        return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
        message("Image must be 5 MB or smaller.");
        return;
    }

    const oldProduct = currentProducts.find(p => p.id === editingId);
    let image_url = oldProduct?.image_url || "";

    if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(path, file, { contentType: file.type });

        if (uploadError) {
            message("Image upload failed: " + uploadError.message);
            return;
        }

        const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(path);

        image_url = data.publicUrl;
    }

    const product = {
        name,
        description,
        image_url,
        is_published: $("published").checked
    };

    const result = editingId
        ? await supabase.from("products").update(product).eq("id", editingId)
        : await supabase.from("products").insert(product);

    if (result.error) {
        message("Save failed: " + result.error.message);
        return;
    }

    message("Product saved successfully!");
    resetForm();
    await loadProducts();
});

$("logout").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        message("Logout failed. Please try again.");
        return;
    }

    resetForm();
    await checkLogin();
    message("Logged out.");
});

supabase.auth.onAuthStateChange((_event, session) => {
    $("login").style.display = session ? "none" : "block";
    $("dashboard").style.display = session ? "block" : "none";
});

checkLogin();
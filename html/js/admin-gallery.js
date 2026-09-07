/* =========================================================
   Pi Master - Admin Gallery
========================================================= */

const galleryContainer = document.getElementById("adminGallery");
const emptyGallery = document.getElementById("emptyGallery");
const adminStatus = document.getElementById("adminStatus");

const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const featuredCount = document.getElementById("featuredCount");

const refreshButton = document.getElementById("refreshGallery");
const filterButtons = document.querySelectorAll(".filter-button");

let galleryItems = [];
let currentFilter = "pending";


/* =========================================================
   Status
========================================================= */

function showStatus(message, type = "") {

    adminStatus.textContent = message;

    adminStatus.className = "admin-status";

    if (type) {
        adminStatus.classList.add(type);
    }

    adminStatus.hidden = false;

}


function hideStatus() {

    adminStatus.hidden = true;

}


/* =========================================================
   Load Gallery
========================================================= */

async function loadGallery() {

    try {

        hideStatus();

        galleryContainer.innerHTML = "";

        const response = await fetch("/api/admin/gallery");

        if (!response.ok) {
            throw new Error("Unable to load gallery.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid gallery response.");
        }

        galleryItems = data;

        updateStatistics();

        renderGallery();

    } catch (error) {

        console.error(error);

        showStatus(
            error.message || "Unable to load gallery.",
            "error"
        );

        galleryContainer.innerHTML = "";

        emptyGallery.hidden = false;

    }

}


/* =========================================================
   Statistics
========================================================= */

function updateStatistics() {

    const pending = galleryItems.filter(
        item => Number(item.approved) === 0
    ).length;

    const approved = galleryItems.filter(
        item => Number(item.approved) === 1
    ).length;

    const featured = galleryItems.filter(
        item => Number(item.featured) === 1
    ).length;


    pendingCount.textContent = pending;

    approvedCount.textContent = approved;

    featuredCount.textContent = featured;

}


/* =========================================================
   Filter
========================================================= */

function getFilteredItems() {

    if (currentFilter === "pending") {

        return galleryItems.filter(
            item => Number(item.approved) === 0
        );

    }


    if (currentFilter === "approved") {

        return galleryItems.filter(
            item => Number(item.approved) === 1
        );

    }


    return galleryItems;

}


/* =========================================================
   Render
========================================================= */

function renderGallery() {

    const items = getFilteredItems();

    galleryContainer.innerHTML = "";


    if (items.length === 0) {

        emptyGallery.hidden = false;

        return;

    }


    emptyGallery.hidden = true;


    items.forEach(item => {

        galleryContainer.appendChild(
            createGalleryCard(item)
        );

    });

}


/* =========================================================
   Gallery Card
========================================================= */

function createGalleryCard(item) {

    const card = document.createElement("article");

    card.className = "admin-gallery-item";


    const image = document.createElement("img");

    image.className = "admin-gallery-image";

    image.alt = item.title || "Gallery screenshot";


    if (item.filename) {

        image.src =
            `/uploads/gallery/${encodeURIComponent(item.filename)}`;

    } else {

        image.src = "/images/logo.png";

    }


    image.onerror = function() {

        this.src = "/images/logo.png";

    };


    card.appendChild(image);


    const content = document.createElement("div");

    content.className = "admin-gallery-content";


    const title = document.createElement("h3");

    title.textContent =
        item.title || "Untitled Screenshot";

    content.appendChild(title);


    if (item.caption) {

        const caption = document.createElement("p");

        caption.className =
            "admin-gallery-caption";

        caption.textContent =
            item.caption;

        content.appendChild(caption);

    }


    const badges = document.createElement("div");

    badges.className =
        "admin-gallery-badges";


    if (Number(item.approved) === 1) {

        badges.appendChild(
            createBadge("Approved", "approved")
        );

    } else {

        badges.appendChild(
            createBadge("Pending", "pending")
        );

    }


    if (Number(item.featured) === 1) {

        badges.appendChild(
            createBadge("Featured", "featured")
        );

    }


    content.appendChild(badges);


    const meta = document.createElement("div");

    meta.className =
        "admin-gallery-meta";


    const uploader = document.createElement("span");

    uploader.textContent =
        `Uploaded by: ${item.uploaded_by || "Unknown"}`;

    meta.appendChild(uploader);


    if (item.created_at) {

        const date = document.createElement("span");

        date.textContent =
            `Uploaded: ${formatDate(item.created_at)}`;

        meta.appendChild(date);

    }


    content.appendChild(meta);


    const actions = document.createElement("div");

    actions.className =
        "admin-gallery-actions";


    if (Number(item.approved) === 0) {

        const approveButton =
            createButton(
                "✓ Approve",
                "button"
            );

        approveButton.addEventListener(
            "click",
            () => approveImage(item.id)
        );

        actions.appendChild(approveButton);

    }


    const featureButton =
        createButton(
            Number(item.featured) === 1
                ? "★ Unfeature"
                : "☆ Feature",
            "button button-secondary"
        );


    featureButton.addEventListener(
        "click",
        () => toggleFeatured(item.id)
    );

    actions.appendChild(featureButton);


    const deleteButton =
        createButton(
            "Delete",
            "button button-danger"
        );


    deleteButton.addEventListener(
        "click",
        () => deleteImage(item.id)
    );

    actions.appendChild(deleteButton);


    content.appendChild(actions);

    card.appendChild(content);


    return card;

}


/* =========================================================
   Badge
========================================================= */

function createBadge(text, type) {

    const badge =
        document.createElement("span");

    badge.className =
        `admin-gallery-badge ${type}`;

    badge.textContent = text;

    return badge;

}


/* =========================================================
   Button
========================================================= */

function createButton(text, className) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className = className;

    button.textContent = text;

    return button;

}


/* =========================================================
   Approve
========================================================= */

async function approveImage(id) {

    if (!confirm(
        "Approve this screenshot?"
    )) {
        return;
    }


    try {

        const response = await fetch(
            `/api/admin/gallery/${id}/approve`,
            {
                method: "POST"
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Unable to approve screenshot."
            );

        }


        showStatus(
            "Screenshot approved.",
            "success"
        );


        await loadGallery();


    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Unable to approve screenshot.",
            "error"
        );

    }

}


/* =========================================================
   Featured
========================================================= */

async function toggleFeatured(id) {

    try {

        const response = await fetch(
            `/api/admin/gallery/${id}/feature`,
            {
                method: "POST"
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Unable to change featured status."
            );

        }


        showStatus(
            data.featured
                ? "Screenshot featured."
                : "Screenshot removed from featured.",
            "success"
        );


        await loadGallery();


    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Unable to change featured status.",
            "error"
        );

    }

}


/* =========================================================
   Delete
========================================================= */

async function deleteImage(id) {

    if (!confirm(
        "Delete this screenshot permanently?"
    )) {
        return;
    }


    try {

        const response = await fetch(
            `/api/admin/gallery/${id}`,
            {
                method: "DELETE"
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Unable to delete screenshot."
            );

        }


        showStatus(
            "Screenshot deleted.",
            "success"
        );


        await loadGallery();


    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Unable to delete screenshot.",
            "error"
        );

    }

}


/* =========================================================
   Date
========================================================= */

function formatDate(value) {

    const date =
        new Date(
            value.replace(" ", "T") + "Z"
        );


    if (Number.isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   Filters
========================================================= */

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filterButtons.forEach(
                item =>
                    item.classList.remove("active")
            );


            button.classList.add("active");


            currentFilter =
                button.dataset.filter;


            renderGallery();

        }
    );

});


/* =========================================================
   Refresh
========================================================= */

refreshButton.addEventListener(
    "click",
    loadGallery
);


/* =========================================================
   Initial Load
========================================================= */

loadGallery();
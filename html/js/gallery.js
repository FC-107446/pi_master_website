/* =========================================================
   Pi Master - Gallery
========================================================= */

const GALLERY_API = "/api/gallery";

const IMAGE_PATH = "/uploads/gallery/";

let galleryItems = [];



/* =========================================================
   HTML Escape
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    const div = document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;

}



/* =========================================================
   Format Date
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date = new Date(
        String(value).replace(" ", "T") + "Z"
    );

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
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
   Convert API Item
========================================================= */

/*
    The API currently returns SQLite rows like:

    [
        id,
        filename,
        title,
        caption,
        uploaded_by,
        created_at,
        approved,
        featured
    ]

    Convert them into normal objects so the rest
    of the JavaScript is easier to work with.
*/

function normaliseGalleryItem(item) {

    if (Array.isArray(item)) {

        return {

            id: item[0],

            filename: item[1],

            title: item[2],

            caption: item[3],

            uploaded_by: item[4],

            created_at: item[5],

            approved: item[6],

            featured: item[7]

        };

    }


    if (item && typeof item === "object") {

        return item;

    }


    return null;

}



/* =========================================================
   Get Image URL
========================================================= */

function getImageURL(item) {

    if (
        item &&
        item.filename &&
        String(item.filename).trim() !== ""
    ) {

        return (
            IMAGE_PATH +
            encodeURIComponent(
                String(item.filename).trim()
            )
        );

    }


    return "/images/logo.png";

}



/* =========================================================
   Create Lightbox
========================================================= */

function createLightbox() {

    if (document.getElementById("galleryLightbox")) {
        return;
    }


    const lightbox =
        document.createElement("div");


    lightbox.id =
        "galleryLightbox";


    lightbox.className =
        "gallery-lightbox";


    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    lightbox.innerHTML = `

        <div
            class="gallery-lightbox-backdrop">
        </div>


        <div
            class="gallery-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-label="Gallery image">


            <button
                type="button"
                class="gallery-lightbox-close"
                aria-label="Close image">

                &times;

            </button>


            <div
                class="gallery-lightbox-image-wrap">


                <img
                    class="gallery-lightbox-image"
                    src=""
                    alt="">


            </div>


            <div
                class="gallery-lightbox-details">


                <h2
                    class="gallery-lightbox-title">
                </h2>


                <div
                    class="gallery-lightbox-author">
                </div>


                <p
                    class="gallery-lightbox-caption">
                </p>


                <div
                    class="gallery-lightbox-date">
                </div>


            </div>


        </div>

    `;


    document.body.appendChild(lightbox);


    const closeButton =
        lightbox.querySelector(
            ".gallery-lightbox-close"
        );


    const backdrop =
        lightbox.querySelector(
            ".gallery-lightbox-backdrop"
        );


    closeButton.addEventListener(
        "click",
        closeLightbox
    );


    backdrop.addEventListener(
        "click",
        closeLightbox
    );


    /*
        Prevent clicks inside the image/details
        from closing the lightbox.
    */

    const content =
        lightbox.querySelector(
            ".gallery-lightbox-content"
        );


    content.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );


    /*
        Escape key closes the lightbox.
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                lightbox.classList.contains("open")
            ) {

                closeLightbox();

            }

        }
    );

}



/* =========================================================
   Open Lightbox
========================================================= */

function openLightbox(item) {

    createLightbox();


    const lightbox =
        document.getElementById(
            "galleryLightbox"
        );


    const image =
        lightbox.querySelector(
            ".gallery-lightbox-image"
        );


    const title =
        lightbox.querySelector(
            ".gallery-lightbox-title"
        );


    const author =
        lightbox.querySelector(
            ".gallery-lightbox-author"
        );


    const caption =
        lightbox.querySelector(
            ".gallery-lightbox-caption"
        );


    const date =
        lightbox.querySelector(
            ".gallery-lightbox-date"
        );


    const imageURL =
        getImageURL(item);


    image.src =
        imageURL;


    image.alt =
        item.title ||
        "Community screenshot";


    title.textContent =
        item.title ||
        "Community Screenshot";


    author.textContent =
        item.uploaded_by
            ? `Uploaded by ${item.uploaded_by}`
            : "Uploaded by Community";


    caption.textContent =
        item.caption ||
        "";


    date.textContent =
        formatDate(item.created_at);


    /*
        Hide empty caption/date elements.
    */

    caption.style.display =
        item.caption
            ? ""
            : "none";


    date.style.display =
        item.created_at
            ? ""
            : "none";


    /*
        Show the lightbox.
    */

    lightbox.classList.add("open");


    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
        Prevent the page underneath from scrolling.
    */

    document.body.classList.add(
        "gallery-lightbox-open"
    );



    /*
        Put keyboard focus on close button.
    */

    const closeButton =
        lightbox.querySelector(
            ".gallery-lightbox-close"
        );


    setTimeout(
        () => closeButton.focus(),
        50
    );

}



/* =========================================================
   Close Lightbox
========================================================= */

function closeLightbox() {

    const lightbox =
        document.getElementById(
            "galleryLightbox"
        );


    if (!lightbox) {
        return;
    }


    lightbox.classList.remove(
        "open"
    );


    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "gallery-lightbox-open"
    );



    /*
        Clear the image after closing.
    */

    const image =
        lightbox.querySelector(
            ".gallery-lightbox-image"
        );


    if (image) {
        image.src = "";
    }

}



/* =========================================================
   Render Gallery
========================================================= */

function renderGallery() {

    const grid =
        document.getElementById(
            "galleryGrid"
        );


    const empty =
        document.getElementById(
            "galleryEmpty"
        );


    if (!grid || !empty) {

        console.error(
            "Gallery HTML elements are missing."
        );

        return;

    }


    /*
        No approved images.
    */

    if (galleryItems.length === 0) {

        grid.innerHTML = "";

        empty.hidden = false;

        return;

    }


    empty.hidden = true;

    grid.innerHTML = "";


    galleryItems.forEach(
        item => {


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "gallery-item";


            const imageURL =
                getImageURL(item);


            const title =
                escapeHTML(
                    item.title ||
                    "Community Screenshot"
                );


            const author =
                escapeHTML(
                    item.uploaded_by ||
                    "Community"
                );


            const caption =
                escapeHTML(
                    item.caption ||
                    ""
                );


            const date =
                formatDate(
                    item.created_at
                );


            card.innerHTML = `

                <div
                    class="gallery-image-wrapper">


                    <img
                        class="gallery-image"
                        src="${escapeHTML(imageURL)}"
                        alt="${title}"
                        loading="lazy">


                    <div
                        class="gallery-image-overlay">


                        <div
                            class="gallery-overlay-content">


                            <h3>
                                ${title}
                            </h3>


                            <span>
                                ${author}
                            </span>


                        </div>


                    </div>


                </div>


                <div
                    class="gallery-item-content">


                    ${
                        caption
                        ? `
                            <p>
                                ${caption}
                            </p>
                        `
                        : ""
                    }


                    ${
                        date
                        ? `
                            <span
                                class="gallery-date">
                                ${date}
                            </span>
                        `
                        : ""
                    }


                </div>

            `;



            /*
                If the image cannot be loaded,
                use the site logo instead.
            */

            const imageElement =
                card.querySelector(
                    ".gallery-image"
                );


            imageElement.addEventListener(
                "error",
                () => {

                    imageElement.src =
                        "/images/logo.png";

                },
                {
                    once: true
                }
            );



            /*
                IMPORTANT:
                Clicking the card opens the
                on-page lightbox.

                There is deliberately NO
                window.open() here.
            */

            card.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    openLightbox(item);

                }
            );


            grid.appendChild(card);

        }
    );

}



/* =========================================================
   Load Gallery
========================================================= */

async function loadGallery() {

    const grid =
        document.getElementById(
            "galleryGrid"
        );


    const empty =
        document.getElementById(
            "galleryEmpty"
        );


    if (!grid || !empty) {

        console.error(
            "Gallery page is missing required elements."
        );

        return;

    }


    /*
        Loading state.
    */

    grid.innerHTML = `

        <div
            class="gallery-loading">


            <div
                class="gallery-loading-icon">

                🖼️

            </div>


            <p>
                Loading gallery...
            </p>


        </div>

    `;


    empty.hidden = true;



    try {

        const response =
            await fetch(
                GALLERY_API,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Gallery API returned HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Gallery API returned invalid data."
            );

        }


        /*
            Convert SQLite rows into objects.
        */

        galleryItems =
            data
                .map(
                    normaliseGalleryItem
                )
                .filter(
                    item =>
                        item &&
                        (
                            item.approved === 1 ||
                            item.approved === true ||
                            item.approved === "1"
                        )
                );


        console.log(
            "Pi Master gallery:",
            galleryItems
        );


        renderGallery();


    }

    catch (error) {

        console.error(
            "Unable to load gallery:",
            error
        );


        grid.innerHTML = "";

        empty.hidden = false;


        const heading =
            empty.querySelector("h3");


        const message =
            empty.querySelector("p");


        if (heading) {

            heading.textContent =
                "Gallery unavailable";

        }


        if (message) {

            message.textContent =
                "The gallery service could not be reached. Please try again later.";

        }

    }

}



/* =========================================================
   Mobile Navigation
========================================================= */

function setupMobileNavigation() {

    const mobileMenu =
        document.querySelector(
            ".mobile-menu"
        );


    const navLinks =
        document.querySelector(
            ".nav-links"
        );


    if (!mobileMenu || !navLinks) {

        return;

    }


    mobileMenu.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            navLinks.classList.toggle(
                "mobile-open"
            );


            const isOpen =
                navLinks.classList.contains(
                    "mobile-open"
                );


            mobileMenu.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );


    /*
        Close the menu when a link
        is selected.
    */

    navLinks
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        navLinks.classList.remove(
                            "mobile-open"
                        );


                        mobileMenu.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );

}



/* =========================================================
   Start
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createLightbox();

        setupMobileNavigation();

        loadGallery();

    }
);
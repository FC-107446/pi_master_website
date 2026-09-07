/* =========================================================
   Pi Master - News
========================================================= */


const NEWS_API = "/api/news";


let newsArticles = [];



/* =========================================================
   HTML Escape
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const div =
        document.createElement("div");


    div.textContent =
        String(value);


    return div.innerHTML;

}



/* =========================================================
   Format Date
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {

        return "Unknown date";

    }


    const date =
        new Date(
            String(dateValue)
                .replace(" ", "T") + "Z"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            dateValue
        );

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}



/* =========================================================
   Image
========================================================= */

function getNewsImage(article) {

    if (
        article &&
        article.image &&
        String(article.image).trim() !== ""
    ) {

        const image =
            String(article.image).trim();


        if (
            image.startsWith("/") ||
            image.startsWith("https://") ||
            image.startsWith("http://")
        ) {

            return image;

        }

    }


    return "/images/logo.png";

}



/* =========================================================
   Lightbox
========================================================= */

function setupNewsLightbox() {

    const lightbox =
        document.getElementById(
            "newsLightbox"
        );


    const closeButton =
        document.getElementById(
            "newsLightboxClose"
        );


    const backdrop =
        lightbox
            ? lightbox.querySelector(
                ".news-lightbox-backdrop"
            )
            : null;


    if (
        !lightbox ||
        !closeButton ||
        !backdrop
    ) {

        console.error(
            "News lightbox elements are missing."
        );

        return;

    }


    closeButton.addEventListener(
        "click",
        closeNewsLightbox
    );


    backdrop.addEventListener(
        "click",
        closeNewsLightbox
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                lightbox.classList.contains("open")
            ) {

                closeNewsLightbox();

            }

        }
    );

}



function openNewsLightbox(article) {

    const lightbox =
        document.getElementById(
            "newsLightbox"
        );


    if (!lightbox) {
        return;
    }


    const image =
        document.getElementById(
            "newsLightboxImage"
        );


    const title =
        document.getElementById(
            "newsLightboxTitle"
        );


    const author =
        document.getElementById(
            "newsLightboxAuthor"
        );


    const date =
        document.getElementById(
            "newsLightboxDate"
        );


    const body =
        document.getElementById(
            "newsLightboxBody"
        );


    image.src =
        getNewsImage(article);


    image.alt =
        article.title ||
        "News article";


    title.textContent =
        article.title ||
        "Untitled";


    author.textContent =
        article.author
            ? `By ${article.author}`
            : "By Admin";


    date.textContent =
        formatDate(
            article.created_at
        );


    body.textContent =
        article.content ||
        article.summary ||
        "";


    lightbox.classList.add(
        "open"
    );


    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "news-lightbox-open"
    );


    setTimeout(
        () => {

            const closeButton =
                document.getElementById(
                    "newsLightboxClose"
                );

            if (closeButton) {
                closeButton.focus();
            }

        },
        50
    );

}



function closeNewsLightbox() {

    const lightbox =
        document.getElementById(
            "newsLightbox"
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
        "news-lightbox-open"
    );


    const image =
        document.getElementById(
            "newsLightboxImage"
        );


    if (image) {

        image.src = "";

    }

}



/* =========================================================
   Featured Article
========================================================= */

function renderFeatured(article) {

    const container =
        document.getElementById(
            "featuredNews"
        );


    if (!container) {
        return;
    }


    if (!article) {

        container.innerHTML = "";

        return;

    }


    const title =
        escapeHTML(
            article.title ||
            "Untitled"
        );


    const summary =
        escapeHTML(
            article.summary ||
            article.content ||
            ""
        );


    const author =
        escapeHTML(
            article.author ||
            "Admin"
        );


    const date =
        formatDate(
            article.created_at
        );


    const image =
        getNewsImage(article);


    container.innerHTML = `

        <article
            class="featured-news-card"
            tabindex="0"
            role="button"
            aria-label="Open ${title}">


            <div
                class="featured-news-image">

                <img
                    src="${escapeHTML(image)}"
                    alt="${title}"
                    loading="lazy">

            </div>



            <div
                class="featured-news-content">


                <span
                    class="featured-news-tag">

                    FEATURED

                </span>


                <h2>
                    ${title}
                </h2>


                <p
                    class="featured-news-summary">

                    ${summary}

                </p>


                <div
                    class="news-meta">

                    <span>
                        ${author}
                    </span>

                    <span>
                        ${date}
                    </span>

                </div>


            </div>

        </article>

    `;


    const card =
        container.querySelector(
            ".featured-news-card"
        );


    const imageElement =
        card.querySelector(
            ".featured-news-image img"
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


    card.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openNewsLightbox(
                article
            );

        }
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openNewsLightbox(
                    article
                );

            }

        }
    );

}



/* =========================================================
   News Card
========================================================= */

function createNewsCard(article) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "news-card";


    card.tabIndex = 0;


    card.setAttribute(
        "role",
        "button"
    );


    const title =
        escapeHTML(
            article.title ||
            "Untitled"
        );


    const summary =
        escapeHTML(
            article.summary ||
            article.content ||
            ""
        );


    const author =
        escapeHTML(
            article.author ||
            "Admin"
        );


    const date =
        formatDate(
            article.created_at
        );


    const image =
        getNewsImage(article);


    card.setAttribute(
        "aria-label",
        `Open ${title}`
    );


    card.innerHTML = `

        <div
            class="news-card-image">

            <img
                src="${escapeHTML(image)}"
                alt="${title}"
                loading="lazy">

        </div>


        <div
            class="news-card-content">


            <h3>
                ${title}
            </h3>


            <p
                class="news-summary">

                ${summary}

            </p>


            <div
                class="news-meta">

                <span>
                    ${author}
                </span>

                <span>
                    ${date}
                </span>

            </div>


        </div>

    `;


    const imageElement =
        card.querySelector(
            ".news-card-image img"
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


    card.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openNewsLightbox(
                article
            );

        }
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openNewsLightbox(
                    article
                );

            }

        }
    );


    return card;

}



/* =========================================================
   Render News
========================================================= */

function renderNews(articles) {

    const featuredContainer =
        document.getElementById(
            "featuredNews"
        );


    const newsGrid =
        document.getElementById(
            "newsGrid"
        );


    const noNews =
        document.getElementById(
            "noNews"
        );


    if (
        !featuredContainer ||
        !newsGrid ||
        !noNews
    ) {

        console.error(
            "News page elements are missing."
        );

        return;

    }


    if (
        !Array.isArray(
            articles
        )
    ) {

        throw new Error(
            "News API returned invalid data."
        );

    }


    articles =
        articles.filter(
            article =>
                article &&
                (
                    article.published === undefined ||
                    article.published === 1 ||
                    article.published === true ||
                    article.published === "1"
                )
        );


    newsArticles =
        articles;


    if (
        articles.length === 0
    ) {

        featuredContainer.innerHTML = "";

        newsGrid.innerHTML = "";

        noNews.hidden = false;

        return;

    }


    noNews.hidden = true;


    /*
        Find featured article.
    */

    const featured =
        articles.find(
            article =>
                article.featured === 1 ||
                article.featured === true ||
                article.featured === "1"
        ) || articles[0];


    renderFeatured(
        featured
    );


    /*
        Everything else goes
        into the news grid.
    */

    newsGrid.innerHTML = "";


    const remaining =
        articles.filter(
            article =>
                article !== featured
        );


    remaining.forEach(
        article => {

            newsGrid.appendChild(
                createNewsCard(
                    article
                )
            );

        }
    );

}



/* =========================================================
   Load News
========================================================= */

async function loadNews() {

    const featuredContainer =
        document.getElementById(
            "featuredNews"
        );


    const newsGrid =
        document.getElementById(
            "newsGrid"
        );


    const noNews =
        document.getElementById(
            "noNews"
        );


    if (
        !featuredContainer ||
        !newsGrid ||
        !noNews
    ) {

        console.error(
            "News page HTML is missing required elements."
        );

        return;

    }


    newsGrid.innerHTML = `

        <div
            class="news-loading">

            <div
                class="news-loading-icon">

                📰

            </div>

            <p>
                Loading news...
            </p>

        </div>

    `;


    noNews.hidden = true;


    try {

        const response =
            await fetch(
                NEWS_API,
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
                `News API returned HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        renderNews(
            data
        );


    }

    catch (error) {

        console.error(
            "Unable to load news:",
            error
        );


        featuredContainer.innerHTML = "";


        newsGrid.innerHTML = `

            <div
                class="news-error">

                <div
                    class="news-error-icon">

                    ⚠️

                </div>

                <h3>
                    News unavailable
                </h3>

                <p>
                    The news service could not be
                    reached. Please try again later.
                </p>

            </div>

        `;


        noNews.hidden = true;

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


    const mobileNav =
        document.querySelector(
            ".mobile-nav"
        );


    if (
        !mobileMenu ||
        !mobileNav
    ) {

        console.error(
            "Mobile navigation elements are missing."
        );

        return;

    }


    mobileMenu.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            const isOpen =
                mobileNav.classList.toggle(
                    "open"
                );


            mobileMenu.setAttribute(
                "aria-expanded",
                String(isOpen)
            );


            mobileMenu.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
            );

        }
    );


    mobileNav
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileNav.classList.remove(
                            "open"
                        );


                        mobileMenu.setAttribute(
                            "aria-expanded",
                            "false"
                        );


                        mobileMenu.setAttribute(
                            "aria-label",
                            "Open navigation menu"
                        );

                    }
                );

            }
        );



    /*
        Close the menu when clicking
        elsewhere on the page.
    */

    document.addEventListener(
        "click",
        event => {

            if (
                !mobileNav.contains(
                    event.target
                ) &&
                !mobileMenu.contains(
                    event.target
                )
            ) {

                mobileNav.classList.remove(
                    "open"
                );


                mobileMenu.setAttribute(
                    "aria-expanded",
                    "false"
                );

                mobileMenu.setAttribute(
                    "aria-label",
                    "Open navigation menu"
                );

            }

        }
    );

}



/* =========================================================
   Start
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupNewsLightbox();

        setupMobileNavigation();

        loadNews();

    }
);
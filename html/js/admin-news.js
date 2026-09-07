/* =========================================================
   Pi Master - Admin News
   Main Admin News Page
   ========================================================= */


/* =========================================================
   Elements
========================================================= */

const newsList = document.getElementById("newsList");
const emptyNews = document.getElementById("emptyNews");
const newsForm = document.getElementById("newsForm");

const articleId = document.getElementById("articleId");
const newsTitle = document.getElementById("newsTitle");
const newsSummary = document.getElementById("newsSummary");
const newsContent = document.getElementById("newsContent");
const newsAuthor = document.getElementById("newsAuthor");

const newsImageInput = document.getElementById("newsImage");
const newsImagePreview = document.getElementById("newsImagePreview");
const newsImagePreviewImg = document.getElementById("newsImagePreviewImg");
const removeNewsImageButton =
    document.getElementById("removeNewsImage");

const newsPublished = document.getElementById("newsPublished");
const newsFeatured = document.getElementById("newsFeatured");

const editorTitle = document.getElementById("editorTitle");
const cancelEdit = document.getElementById("cancelEdit");
const refreshNews = document.getElementById("refreshNews");
const adminStatus = document.getElementById("adminStatus");

const totalCount = document.getElementById("totalCount");
const publishedCount = document.getElementById("publishedCount");
const draftCount = document.getElementById("draftCount");
const featuredCount = document.getElementById("featuredCount");


let articles = [];
let uploadedNewsImage = null;


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
   Escape HTML
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
   Date
========================================================= */

function formatDate(value) {

    if (!value) {
        return "Unknown date";
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
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================================================
   Image
========================================================= */

function getImage(article) {

    if (
        article.image &&
        String(article.image).trim()
    ) {
        return String(article.image).trim();
    }

    return "/images/logo.png";
}


/* =========================================================
   Load Articles
========================================================= */

async function loadNews() {

    try {

        hideStatus();

        const response = await fetch(
            "/api/admin/news"
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load news articles."
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Invalid news response."
            );
        }

        articles = data;

        updateStatistics();

        renderArticles();

    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Unable to load news.",
            "error"
        );

    }
}


/* =========================================================
   Statistics
========================================================= */

function updateStatistics() {

    totalCount.textContent =
        articles.length;

    publishedCount.textContent =
        articles.filter(
            article =>
                Number(article.published) === 1
        ).length;

    draftCount.textContent =
        articles.filter(
            article =>
                Number(article.published) === 0
        ).length;

    featuredCount.textContent =
        articles.filter(
            article =>
                Number(article.featured) === 1
        ).length;
}


/* =========================================================
   Render
========================================================= */

function renderArticles() {

    newsList.innerHTML = "";

    if (articles.length === 0) {

        emptyNews.hidden = false;

        return;
    }

    emptyNews.hidden = true;

    articles.forEach(article => {

        newsList.appendChild(
            createArticleCard(article)
        );

    });
}


/* =========================================================
   Article Card
========================================================= */

function createArticleCard(article) {

    const card =
        document.createElement("article");

    card.className =
        "admin-news-item";


    const image =
        document.createElement("img");

    image.className =
        "admin-news-image";

    image.src =
        getImage(article);

    image.alt =
        article.title ||
        "News image";

    image.onerror =
        function () {

            this.src =
                "/images/logo.png";

        };

    card.appendChild(image);


    const content =
        document.createElement("div");

    content.className =
        "admin-news-content";


    const title =
        document.createElement("h3");

    title.textContent =
        article.title ||
        "Untitled Article";

    content.appendChild(title);


    const summary =
        document.createElement("p");

    summary.className =
        "admin-news-summary";

    summary.textContent =
        article.summary ||
        article.content ||
        "";

    content.appendChild(summary);


    const badges =
        document.createElement("div");

    badges.className =
        "admin-news-badges";


    if (Number(article.published) === 1) {

        badges.appendChild(
            createBadge(
                "Published",
                "published"
            )
        );

    } else {

        badges.appendChild(
            createBadge(
                "Draft",
                "draft"
            )
        );

    }


    if (Number(article.featured) === 1) {

        badges.appendChild(
            createBadge(
                "Featured",
                "featured"
            )
        );

    }


    content.appendChild(badges);


    const meta =
        document.createElement("div");

    meta.className =
        "admin-news-meta";


    const author =
        document.createElement("span");

    author.textContent =
        `By ${article.author || "Admin"}`;

    meta.appendChild(author);


    const date =
        document.createElement("span");

    date.textContent =
        formatDate(article.created_at);

    meta.appendChild(date);


    content.appendChild(meta);


    const actions =
        document.createElement("div");

    actions.className =
        "admin-news-actions";


    const editButton =
        createButton(
            "✏ Edit",
            "button button-secondary"
        );

    editButton.addEventListener(
        "click",
        () => editArticle(article)
    );

    actions.appendChild(editButton);


    const publishButton =
        createButton(
            Number(article.published) === 1
                ? "Hide"
                : "Publish",
            "button button-secondary"
        );

    publishButton.addEventListener(
        "click",
        () => togglePublished(article.id)
    );

    actions.appendChild(publishButton);


    const featureButton =
        createButton(
            Number(article.featured) === 1
                ? "★ Unfeature"
                : "☆ Feature",
            "button button-secondary"
        );

    featureButton.addEventListener(
        "click",
        () => toggleFeatured(article.id)
    );

    actions.appendChild(featureButton);


    const deleteButton =
        createButton(
            "Delete",
            "button button-danger"
        );

    deleteButton.addEventListener(
        "click",
        () => deleteArticle(article.id)
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
        `admin-news-badge ${type}`;

    badge.textContent =
        text;

    return badge;
}


/* =========================================================
   Button
========================================================= */

function createButton(text, className) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        className;

    button.textContent =
        text;

    return button;
}


/* =========================================================
   Image Upload
========================================================= */

if (newsImageInput) {

    newsImageInput.addEventListener(
        "change",
        async function () {

            const file =
                this.files[0];

            if (!file) {
                return;
            }


            try {

                if (
                    file.size >
                    10 * 1024 * 1024
                ) {

                    throw new Error(
                        "Image is too large. Maximum size is 10 MB."
                    );

                }


                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];


                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {

                    throw new Error(
                        "Invalid image type. Use JPG, PNG or WebP."
                    );

                }


                /* Show preview immediately */

                const previewURL =
                    URL.createObjectURL(file);

                newsImagePreviewImg.src =
                    previewURL;

                newsImagePreview.hidden =
                    false;


                showStatus(
                    "Uploading image..."
                );


                /* Upload image */

                uploadedNewsImage =
                    await uploadNewsImage(file);


                /*
                   Store the returned URL on the
                   form element so the article can
                   use it when saved.
                */

                newsImageInput.dataset.imageUrl =
                    uploadedNewsImage;


                showStatus(
                    "Image uploaded successfully.",
                    "success"
                );


            } catch (error) {

                console.error(error);

                uploadedNewsImage =
                    null;

                newsImageInput.value = "";

                newsImageInput.dataset.imageUrl =
                    "";

                newsImagePreview.hidden =
                    true;

                newsImagePreviewImg.src =
                    "";

                showStatus(
                    error.message ||
                    "Unable to upload image.",
                    "error"
                );

            }

        }
    );
}


/* =========================================================
   Remove Image
========================================================= */

if (removeNewsImageButton) {

    removeNewsImageButton.addEventListener(
        "click",
        function () {

            newsImageInput.value = "";

            newsImageInput.dataset.imageUrl =
                "";

            uploadedNewsImage =
                null;

            newsImagePreviewImg.src =
                "";

            newsImagePreview.hidden =
                true;

        }
    );
}


/* =========================================================
   Edit Article
========================================================= */

function editArticle(article) {

    articleId.value =
        article.id;

    newsTitle.value =
        article.title || "";

    newsSummary.value =
        article.summary || "";

    newsContent.value =
        article.content || "";

    newsAuthor.value =
        article.author || "Admin";


    /*
       The file input itself cannot be populated
       with an existing file.

       Instead, store the existing image URL.
    */

    uploadedNewsImage =
        article.image || null;

    newsImageInput.value = "";

    newsImageInput.dataset.imageUrl =
        article.image || "";


    if (article.image) {

        newsImagePreviewImg.src =
            article.image;

        newsImagePreview.hidden =
            false;

    } else {

        newsImagePreviewImg.src =
            "";

        newsImagePreview.hidden =
            true;

    }


    newsPublished.checked =
        Number(article.published) === 1;

    newsFeatured.checked =
        Number(article.featured) === 1;


    editorTitle.textContent =
        "Edit News Article";

    cancelEdit.hidden =
        false;


    window.scrollTo({
        top:
            document.querySelector(
                ".admin-news-editor"
            ).offsetTop - 30,
        behavior: "smooth"
    });
}


/* =========================================================
   Reset Editor
========================================================= */

function resetEditor() {

    newsForm.reset();

    articleId.value =
        "";

    newsAuthor.value =
        "Finley";

    newsPublished.checked =
        true;

    newsFeatured.checked =
        false;


    uploadedNewsImage =
        null;

    newsImageInput.dataset.imageUrl =
        "";

    newsImagePreviewImg.src =
        "";

    newsImagePreview.hidden =
        true;


    editorTitle.textContent =
        "Create News Article";

    cancelEdit.hidden =
        true;
}


/* =========================================================
   Upload News Image
========================================================= */

async function uploadNewsImage(file) {

    if (!file) {
        return null;
    }


    const formData =
        new FormData();

    formData.append(
        "image",
        file
    );


    const response =
        await fetch(
            "/api/admin/news/upload-image",
            {
                method: "POST",
                body: formData
            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.success
    ) {

        throw new Error(
            data.error ||
            "Unable to upload image."
        );

    }


    return data.url;
}


/* =========================================================
   Save Article
========================================================= */

newsForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const id =
            articleId.value;


        /*
           Use the uploaded image URL.

           If no new image was selected while
           editing, keep the existing image.
        */

        const image =
            newsImageInput.dataset.imageUrl ||
            uploadedNewsImage ||
            "";


        const payload = {

            title:
                newsTitle.value.trim(),

            summary:
                newsSummary.value.trim(),

            content:
                newsContent.value.trim(),

            author:
                newsAuthor.value.trim() ||
                "Admin",

            image:
                image,

            published:
                newsPublished.checked
                    ? 1
                    : 0,

            featured:
                newsFeatured.checked
                    ? 1
                    : 0

        };


        try {

            const url =
                id
                    ? `/api/admin/news/${id}`
                    : "/api/admin/news";


            const response =
                await fetch(
                    url,
                    {
                        method:
                            id
                                ? "PUT"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.error ||
                    "Unable to save article."
                );

            }


            showStatus(
                id
                    ? "Article updated."
                    : "Article created.",
                "success"
            );


            resetEditor();

            await loadNews();

        } catch (error) {

            console.error(error);

            showStatus(
                error.message ||
                "Unable to save article.",
                "error"
            );

        }

    }
);


/* =========================================================
   Publish
========================================================= */

async function togglePublished(id) {

    await postAction(
        `/api/admin/news/${id}/publish`,
        "Article publication status updated."
    );
}


/* =========================================================
   Featured
========================================================= */

async function toggleFeatured(id) {

    await postAction(
        `/api/admin/news/${id}/feature`,
        "Article featured status updated."
    );
}


/* =========================================================
   Generic POST Action
========================================================= */

async function postAction(
    url,
    successMessage
) {

    try {

        const response =
            await fetch(
                url,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Action failed."
            );

        }


        showStatus(
            successMessage,
            "success"
        );


        await loadNews();

    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Action failed.",
            "error"
        );

    }
}


/* =========================================================
   Delete
========================================================= */

async function deleteArticle(id) {

    const article =
        articles.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!article) {
        return;
    }


    if (
        !confirm(
            `Delete "${article.title}"? This cannot be undone.`
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/admin/news/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to delete article."
            );

        }


        showStatus(
            "Article deleted.",
            "success"
        );


        await loadNews();

    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Unable to delete article.",
            "error"
        );

    }
}


/* =========================================================
   Events
========================================================= */

if (cancelEdit) {

    cancelEdit.addEventListener(
        "click",
        resetEditor
    );

}


if (refreshNews) {

    refreshNews.addEventListener(
        "click",
        loadNews
    );

}


/* =========================================================
   Start
========================================================= */

loadNews();
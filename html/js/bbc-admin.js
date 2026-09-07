/* =========================================================
   Pi Master - BBC News Administration
========================================================= */


const API_BASE = "/api/bbc";


let articles = [];

let editingId = null;

let selectedImageFile = null;



/* =========================================================
   Elements
========================================================= */

const form =
    document.getElementById("newsForm");

const titleInput =
    document.getElementById("title");

const summaryInput =
    document.getElementById("summary");

const contentInput =
    document.getElementById("content");

const publishedInput =
    document.getElementById("published");

const featuredInput =
    document.getElementById("featured");

const imageFileInput =
    document.getElementById("imageFile");

const existingImageInput =
    document.getElementById("existingImage");

const imagePreview =
    document.getElementById("imagePreview");

const previewImage =
    document.getElementById("previewImage");

const removeImageButton =
    document.getElementById("removeImage");

const articlesGrid =
    document.getElementById("articlesGrid");

const emptyArticles =
    document.getElementById("emptyArticles");

const adminStatus =
    document.getElementById("adminStatus");

const editorTitle =
    document.getElementById("editorTitle");

const saveButton =
    document.getElementById("saveButton");

const cancelEditButton =
    document.getElementById("cancelEdit");

const refreshButton =
    document.getElementById("refreshArticles");



/* =========================================================
   Status
========================================================= */

function showStatus(message, type = "") {

    adminStatus.textContent = message;

    adminStatus.className = "bbc-status";

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
   Date
========================================================= */

function formatDate(value) {

    if (!value) {

        return "Unknown date";

    }


    const date =
        new Date(
            String(value).replace(" ", "T") + "Z"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

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
   Load Articles
========================================================= */

async function loadArticles() {

    try {

        hideStatus();

        const response =
            await fetch(
                `${API_BASE}/news`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !Array.isArray(data)
        ) {

            throw new Error(
                data.error ||
                "Unable to load BBC articles."
            );

        }


        articles = data;

        renderArticles();


    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Unable to load BBC articles.",
            "error"
        );

    }

}



/* =========================================================
   Render Articles
========================================================= */

function renderArticles() {

    articlesGrid.innerHTML = "";


    if (articles.length === 0) {

        emptyArticles.hidden = false;

        return;

    }


    emptyArticles.hidden = true;


    articles.forEach(
        article => {

            articlesGrid.appendChild(
                createArticleCard(article)
            );

        }
    );

}



/* =========================================================
   Article Card
========================================================= */

function createArticleCard(article) {

    const card =
        document.createElement("article");

    card.className =
        "bbc-article-card";


    /*
        Image
    */

    if (article.image) {

        const image =
            document.createElement("img");

        image.className =
            "bbc-article-image";

        image.src =
            article.image;

        image.alt =
            article.title || "BBC article";

        image.loading =
            "lazy";

        image.onerror =
            function () {

                this.style.display = "none";

            };


        card.appendChild(image);

    } else {

        const noImage =
            document.createElement("div");

        noImage.className =
            "bbc-article-no-image";

        noImage.textContent =
            "📰";

        card.appendChild(noImage);

    }



    /*
        Content
    */

    const content =
        document.createElement("div");

    content.className =
        "bbc-article-content";


    const title =
        document.createElement("h3");

    title.textContent =
        article.title || "Untitled Article";

    content.appendChild(title);



    if (article.summary) {

        const summary =
            document.createElement("p");

        summary.className =
            "bbc-article-summary";

        summary.textContent =
            article.summary;

        content.appendChild(summary);

    }



    /*
        Badges
    */

    const badges =
        document.createElement("div");

    badges.className =
        "bbc-article-meta";


    const publishBadge =
        document.createElement("span");

    publishBadge.className =
        Number(article.published) === 1
            ? "bbc-badge bbc-badge-published"
            : "bbc-badge bbc-badge-draft";

    publishBadge.textContent =
        Number(article.published) === 1
            ? "PUBLISHED"
            : "DRAFT";

    badges.appendChild(
        publishBadge
    );


    if (
        Number(article.featured) === 1
    ) {

        const featuredBadge =
            document.createElement("span");

        featuredBadge.className =
            "bbc-badge bbc-badge-featured";

        featuredBadge.textContent =
            "FEATURED";

        badges.appendChild(
            featuredBadge
        );

    }


    const author =
        document.createElement("span");

    author.textContent =
        `BBC • ${formatDate(article.created_at)}`;

    badges.appendChild(author);


    content.appendChild(badges);



    /*
        Actions
    */

    const actions =
        document.createElement("div");

    actions.className =
        "bbc-article-actions";


    const editButton =
        createButton(
            "Edit",
            "button"
        );

    editButton.addEventListener(
        "click",
        () => editArticle(article.id)
    );

    actions.appendChild(
        editButton
    );



    const publishButton =
        createButton(
            Number(article.published) === 1
                ? "Unpublish"
                : "Publish",
            "button button-secondary"
        );

    publishButton.addEventListener(
        "click",
        () => togglePublished(article.id)
    );

    actions.appendChild(
        publishButton
    );



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

    actions.appendChild(
        featureButton
    );



    const deleteButton =
        createButton(
            "Delete",
            "button button-danger"
        );

    deleteButton.addEventListener(
        "click",
        () => deleteArticle(article.id)
    );

    actions.appendChild(
        deleteButton
    );


    content.appendChild(actions);

    card.appendChild(content);


    return card;

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
   Image Selection
========================================================= */

imageFileInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];


        if (!file) {

            return;

        }


        if (
            ![
                "image/jpeg",
                "image/png",
                "image/webp"
            ].includes(file.type)
        ) {

            showStatus(
                "Please select a JPG, PNG or WebP image.",
                "error"
            );

            this.value = "";

            return;

        }


        if (
            file.size > 10 * 1024 * 1024
        ) {

            showStatus(
                "The image must be smaller than 10 MB.",
                "error"
            );

            this.value = "";

            return;

        }


        selectedImageFile =
            file;


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                previewImage.src =
                    event.target.result;

                imagePreview.hidden =
                    false;

            };


        reader.readAsDataURL(file);

    }
);



/* =========================================================
   Remove Image
========================================================= */

removeImageButton.addEventListener(
    "click",
    function () {

        selectedImageFile =
            null;

        imageFileInput.value =
            "";

        existingImageInput.value =
            "";

        previewImage.src =
            "";

        imagePreview.hidden =
            true;

    }
);



/* =========================================================
   Upload Image
========================================================= */

async function uploadImage(file) {

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
            `${API_BASE}/upload`,
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


    return data.image;

}



/* =========================================================
   Submit
========================================================= */

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        try {

            hideStatus();

            saveButton.disabled =
                true;

            saveButton.textContent =
                editingId
                    ? "Saving..."
                    : "Publishing...";



            /*
                Upload new image first.
            */

            let image =
                existingImageInput.value ||
                null;


            if (selectedImageFile) {

                image =
                    await uploadImage(
                        selectedImageFile
                    );

            }



            const payload = {

                title:
                    titleInput.value.trim(),

                summary:
                    summaryInput.value.trim(),

                content:
                    contentInput.value.trim(),

                /*
                    IMPORTANT:
                    BBC is hard-coded here.
                    There is no author input.
                */

                author:
                    "BBC",

                image:
                    image,

                published:
                    publishedInput.checked,

                featured:
                    featuredInput.checked

            };



            let response;


            if (editingId) {

                response =
                    await fetch(
                        `${API_BASE}/news/${editingId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(payload)
                        }
                    );

            } else {

                response =
                    await fetch(
                        `${API_BASE}/news`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(payload)
                        }
                    );

            }


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
                editingId
                    ? "BBC article updated successfully."
                    : "BBC article published successfully.",
                "success"
            );


            resetForm();

            await loadArticles();


        } catch (error) {

            console.error(error);

            showStatus(
                error.message ||
                "Unable to save article.",
                "error"
            );


        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingId
                    ? "Save Changes"
                    : "Publish Article";

        }

    }
);



/* =========================================================
   Edit
========================================================= */

function editArticle(id) {

    const article =
        articles.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!article) {

        return;

    }


    editingId =
        article.id;


    editorTitle.textContent =
        "Edit BBC Article";


    titleInput.value =
        article.title || "";


    summaryInput.value =
        article.summary || "";


    contentInput.value =
        article.content || "";


    publishedInput.checked =
        Number(article.published) === 1;


    featuredInput.checked =
        Number(article.featured) === 1;


    existingImageInput.value =
        article.image || "";


    selectedImageFile =
        null;


    imageFileInput.value =
        "";


    if (article.image) {

        previewImage.src =
            article.image;

        imagePreview.hidden =
            false;

    } else {

        imagePreview.hidden =
            true;

    }


    saveButton.textContent =
        "Save Changes";


    cancelEditButton.hidden =
        false;


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}



/* =========================================================
   Cancel Edit
========================================================= */

cancelEditButton.addEventListener(
    "click",
    function () {

        resetForm();

        hideStatus();

    }
);



/* =========================================================
   Reset Form
========================================================= */

function resetForm() {

    editingId =
        null;


    selectedImageFile =
        null;


    form.reset();


    publishedInput.checked =
        true;


    featuredInput.checked =
        false;


    existingImageInput.value =
        "";


    imageFileInput.value =
        "";


    imagePreview.hidden =
        true;


    previewImage.src =
        "";


    editorTitle.textContent =
        "Create News Article";


    saveButton.textContent =
        "Publish Article";


    cancelEditButton.hidden =
        true;

}



/* =========================================================
   Publish Toggle
========================================================= */

async function togglePublished(id) {

    try {

        const response =
            await fetch(
                `${API_BASE}/news/${id}/publish`,
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
                "Unable to change publication status."
            );

        }


        showStatus(
            data.published
                ? "Article published."
                : "Article unpublished.",
            "success"
        );


        await loadArticles();


    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Unable to change publication status.",
            "error"
        );

    }

}



/* =========================================================
   Featured Toggle
========================================================= */

async function toggleFeatured(id) {

    try {

        const response =
            await fetch(
                `${API_BASE}/news/${id}/feature`,
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
                "Unable to change featured status."
            );

        }


        showStatus(
            data.featured
                ? "Article is now featured."
                : "Article removed from featured.",
            "success"
        );


        await loadArticles();


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
            `Delete "${article.title}"?\n\nThis cannot be undone.`
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/news/${id}`,
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
            "BBC article deleted.",
            "success"
        );


        if (
            Number(editingId) === Number(id)
        ) {

            resetForm();

        }


        await loadArticles();


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
   Refresh
========================================================= */

refreshButton.addEventListener(
    "click",
    loadArticles
);



/* =========================================================
   Initial Load
========================================================= */

loadArticles();
/* =========================================================
   Pi Master - Gallery Upload
========================================================= */

const uploadForm = document.getElementById("uploadForm");
const imageInput = document.getElementById("image");
const previewContainer = document.getElementById("previewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImage = document.getElementById("removeImage");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");
const dropZone = document.getElementById("dropZone");


/* =========================================================
   Show Status
========================================================= */

function showStatus(message, type) {

    uploadStatus.textContent = message;

    uploadStatus.className = `upload-status ${type}`;

    uploadStatus.hidden = false;

}


/* =========================================================
   Preview Image
========================================================= */

function showPreview(file) {

    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        showStatus(
            "Please select an image file.",
            "error"
        );

        return;

    }


    if (file.size > 10 * 1024 * 1024) {

        showStatus(
            "The image must be smaller than 10 MB.",
            "error"
        );

        imageInput.value = "";

        return;

    }


    const reader = new FileReader();


    reader.onload = function(event) {

        imagePreview.src = event.target.result;

        previewContainer.hidden = false;

    };


    reader.readAsDataURL(file);

}


/* =========================================================
   File Selected
========================================================= */

imageInput.addEventListener(
    "change",
    () => {

        const file = imageInput.files[0];

        showPreview(file);

    }
);


/* =========================================================
   Remove Image
========================================================= */

removeImage.addEventListener(
    "click",
    () => {

        imageInput.value = "";

        imagePreview.src = "";

        previewContainer.hidden = true;

        uploadStatus.hidden = true;

    }
);


/* =========================================================
   Drag & Drop
========================================================= */

dropZone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropZone.classList.add("dragging");

    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove("dragging");

    }
);


dropZone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropZone.classList.remove("dragging");


        const file = event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        const dataTransfer = new DataTransfer();

        dataTransfer.items.add(file);

        imageInput.files = dataTransfer.files;

        showPreview(file);

    }
);


/* =========================================================
   Submit
========================================================= */

uploadForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const file = imageInput.files[0];


        if (!file) {

            showStatus(
                "Please select an image.",
                "error"
            );

            return;

        }


        uploadButton.disabled = true;

        uploadButton.textContent = "Uploading...";

        uploadStatus.hidden = true;


        try {

            const formData = new FormData(uploadForm);


            const response = await fetch(
                "/api/gallery/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


            let data;


            try {

                data = await response.json();

            } catch {

                throw new Error(
                    "The server returned an invalid response."
                );

            }


            if (!response.ok || !data.success) {

                throw new Error(
                    data.error ||
                    "Upload failed."
                );

            }


            showStatus(
                "Screenshot uploaded successfully! It is now waiting for approval.",
                "success"
            );


            uploadForm.reset();

            imagePreview.src = "";

            previewContainer.hidden = true;


        } catch (error) {

            console.error(
                "Upload error:",
                error
            );


            showStatus(
                error.message ||
                "The screenshot could not be uploaded.",
                "error"
            );

        } finally {

            uploadButton.disabled = false;

            uploadButton.textContent =
                "Upload Screenshot";

        }

    }
);
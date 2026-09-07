/*
    Pi Master Website

    app.js

    Handles:
    - Server status
    - Latest news
    - Gallery slideshow
    - Community spotlight
*/


// =====================================
// API location
// =====================================

const API_BASE =
    window.location.protocol === "https:"
        ? "/api"
        : "http://192.168.50.20:5050/api";





// =====================================
// Server Status
// =====================================


async function loadStatus() {

    try {

        const response =
            await fetch(`${API_BASE}/status`);


        const data =
            await response.json();



        const status =
            document.getElementById(
                "server-status"
            );


        const players =
            document.getElementById(
                "player-count"
            );



        if (data.online) {

            status.innerHTML =
                "🟢 Online";

        } else {

            status.innerHTML =
                "🔴 Offline";

        }



        players.innerHTML =
            `${data.players}/${data.max_players}`;



    }

    catch(error) {

        console.error(
            "Status error:",
            error
        );


        document.getElementById(
            "server-status"
        ).innerHTML =
            "Unknown";


        document.getElementById(
            "player-count"
        ).innerHTML =
            "-";

    }

}





// =====================================
// News
// =====================================


async function loadNews() {


    try {


        const response =
            await fetch(
                `${API_BASE}/news`
            );


        const news =
            await response.json();



        const container =
            document.getElementById(
                "latest-news"
            );



        container.innerHTML = "";



        if(news.length === 0) {


            container.innerHTML =
                `
                <div class="news-card">

                    <h3>
                        No news yet
                    </h3>

                    <p>
                        Check back soon!
                    </p>

                </div>
                `;


            return;

        }




        news
            .slice(0,3)
            .forEach(item => {


                container.innerHTML +=
                `

                <div class="news-card">

                    <h3>
                        ${item.title}
                    </h3>

                    <p>
                        ${item.content}
                    </p>

                    <div class="news-date">
                        ${item.date}
                    </div>

                </div>

                `;


            });



    }


    catch(error) {

        console.error(
            "News error:",
            error
        );

    }


}





// =====================================
// Gallery
// =====================================

let galleryImages = [];

let galleryIndex = 0;


async function loadGallery() {

    try {

        const response = await fetch(
            `${API_BASE}/gallery`
        );


        if (!response.ok) {

            throw new Error(
                `Gallery API returned ${response.status}`
            );

        }


        const data = await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Gallery API returned invalid data"
            );

        }


        // Convert SQLite rows into usable objects
        const images = data
            .map(item => ({

                id: item[0],

                filename: item[1],

                title: item[2],

                caption: item[3],

                uploaded_by: item[4],

                created_at: item[5],

                approved: Number(item[6]),

                featured: Number(item[7])

            }))
            .filter(item =>
                item.approved === 1 &&
                item.filename
            );


        // Prefer featured images
        const featuredImages =
            images.filter(
                item => item.featured === 1
            );


        if (featuredImages.length > 0) {

            galleryImages =
                featuredImages;

        }

        else {

            galleryImages =
                images;

        }


        // Create the image paths
        galleryImages =
            galleryImages.map(item => ({

                path:
                    `/uploads/gallery/${encodeURIComponent(
                        String(item.filename).trim()
                    )}`,

                caption:
                    item.caption ||
                    item.title ||
                    "Community screenshot"

            }));


        if (galleryImages.length > 0) {

            showGalleryImage();


            setInterval(
                showGalleryImage,
                8000
            );

        }

        else {

            const image =
                document.getElementById(
                    "featured-image"
                );

            const caption =
                document.getElementById(
                    "gallery-caption"
                );


            if (image) {

                image.src =
                    "/images/logo.png";

            }


            if (caption) {

                caption.textContent =
                    "No approved community screenshots yet.";

            }

        }

    }

    catch (error) {

        console.error(
            "Gallery error:",
            error
        );


        const image =
            document.getElementById(
                "featured-image"
            );

        const caption =
            document.getElementById(
                "gallery-caption"
            );


        if (image) {

            image.src =
                "/images/logo.png";

        }


        if (caption) {

            caption.textContent =
                "Unable to load community screenshots.";

        }

    }

}

function showGalleryImage() {

    if (
        galleryImages.length === 0
    ) {

        return;

    }


    const image =
        galleryImages[
            galleryIndex
        ];


    const imageElement =
        document.getElementById(
            "featured-image"
        );

    const captionElement =
        document.getElementById(
            "gallery-caption"
        );


    if (!imageElement) {

        return;

    }


    imageElement.src =
        image.path;


    imageElement.onerror = function() {

        this.src = "/images/logo.png";

    };


    if (captionElement) {

        captionElement.textContent =
            image.caption ||
            "Community screenshot";

    }


    galleryIndex++;


    if (
        galleryIndex >= galleryImages.length
    ) {

        galleryIndex = 0;

    }

}






// =====================================
// Community
// =====================================


async function loadCommunity() {


    try {


        const response =
            await fetch(
                `${API_BASE}/community`
            );


        const data =
            await response.json();



        const container =
            document.getElementById(
                "community-spotlight"
            );



        if(
            data.length === 0
        ) {

            return;

        }



        container.innerHTML = "";



        data.forEach(item => {


            container.innerHTML +=
            `

            <div class="spotlight-card">

                <h3>
                    ${item.title}
                </h3>

                <p>
                    ${item.content}
                </p>

            </div>

            `;


        });



    }


    catch(error) {


        console.error(
            "Community error:",
            error
        );


    }


}





// =====================================
// Start
// =====================================


loadStatus();

loadNews();

loadGallery();

loadCommunity();



// Update status every 30 seconds

setInterval(
    loadStatus,
    30000
);

// =========================================================
// Mobile Navigation Menu
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const menuButton = document.querySelector(".mobile-menu");
    const navLinks = document.querySelector(".nav-links");


    if (!menuButton || !navLinks) {
        return;
    }


    menuButton.addEventListener("click", () => {

        navLinks.classList.toggle("mobile-open");

    });


    // Close the menu after selecting a page

    navLinks.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("mobile-open");

        });

    });

});
```javascript
/* =========================================================
   Pi Master - Community
========================================================= */


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

        console.warn(
            "Mobile navigation elements not found."
        );

        return;

    }



    /* -----------------------------------------------------
       Open / Close Menu
    ----------------------------------------------------- */

    mobileMenu.addEventListener(
        "click",
        function(event) {

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

        }
    );



    /* -----------------------------------------------------
       Close Menu After Selecting a Page
    ----------------------------------------------------- */

    mobileNav
        .querySelectorAll("a")
        .forEach(
            function(link) {

                link.addEventListener(
                    "click",
                    function() {

                        mobileNav.classList.remove(
                            "open"
                        );


                        mobileMenu.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );



    /* -----------------------------------------------------
       Close Menu When Clicking Outside
    ----------------------------------------------------- */

    document.addEventListener(
        "click",
        function(event) {

            if (
                !mobileNav.contains(event.target) &&
                !mobileMenu.contains(event.target)
            ) {

                mobileNav.classList.remove(
                    "open"
                );


                mobileMenu.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );



    /* -----------------------------------------------------
       Close Menu With Escape
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape"
            ) {

                mobileNav.classList.remove(
                    "open"
                );


                mobileMenu.setAttribute(
                    "aria-expanded",
                    "false"
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
    function() {

        setupMobileNavigation();

    }
);
```

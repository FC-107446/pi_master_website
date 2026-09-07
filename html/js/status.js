/* =========================================================
   Pi Master - Server Status
========================================================= */

const API_URL = "/api/status";



/* =========================================================
   Helpers
========================================================= */

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function formatPlayers(players) {

    if (!Array.isArray(players)) {
        return [];
    }

    return players;

}



/* =========================================================
   Update Status Indicator
========================================================= */

function updateStatusIndicator(online) {

    const dot = document.getElementById("status-dot");
    const text = document.getElementById("status-text");

    if (!dot || !text) {
        return;
    }


    dot.classList.remove("online", "offline");


    if (online) {

        dot.classList.add("online");

        text.textContent = "Server Online";

    } else {

        dot.classList.add("offline");

        text.textContent = "Server Offline";

    }

}



/* =========================================================
   Update Player List
========================================================= */

function updatePlayerList(players) {

    const container = document.getElementById("player-list");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!players || players.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    👥
                </div>

                <h3>
                    No players online
                </h3>

                <p>
                    There are currently no players on the server.
                </p>

            </div>

        `;

        return;
    }



    players.forEach(player => {

        const card = document.createElement("div");

        card.className = "player-card";


        const name =
            typeof player === "string"
                ? player
                : player.name || player.username || "Unknown Player";


        card.innerHTML = `

            <div class="player-avatar">
                👤
            </div>

            <div>

                <strong>
                    ${name}
                </strong>

                <span>
                    Currently online
                </span>

            </div>

        `;


        container.appendChild(card);

    });

}



/* =========================================================
   Fetch Server Status
========================================================= */

async function loadServerStatus() {

    try {

        const response = await fetch(
            API_URL,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                `API returned ${response.status}`
            );

        }


        const data = await response.json();


        console.log(
            "Pi Master status:",
            data
        );



        /* ===========================
           Online
        ============================ */

        const online =
            data.online === true ||
            data.status === "online";


        updateStatusIndicator(online);


        setText(
            "server-status",
            online ? "Online" : "Offline"
        );


        setText(
            "server-message",
            online
                ? "The Minecraft server is running normally."
                : "The Minecraft server is currently offline."
        );



        /* ===========================
           Players
        ============================ */

        const players =
            Number(data.players) || 0;


        const maxPlayers =
            Number(data.max_players) ||
            Number(data.maxPlayers) ||
            null;


        if (maxPlayers) {

            setText(
                "player-count",
                `${players} / ${maxPlayers}`
            );

        } else {

            setText(
                "player-count",
                players
            );

        }



        /* ===========================
           Version
        ============================ */

        setText(
            "server-version",
            data.version ||
            data.minecraft_version ||
            "Unknown"
        );



        /* ===========================
           Ping
        ============================ */

        const ping =
            data.ping;


        if (
            ping !== undefined &&
            ping !== null
        ) {

            setText(
                "server-ping",
                `${ping} ms`
            );

        } else {

            setText(
                "server-ping",
                "Unavailable"
            );

        }



        /* ===========================
           Players List
        ============================ */

        updatePlayerList(
            formatPlayers(
                data.player_list ||
                data.playerList ||
                data.players_list ||
                []
            )
        );



        /* ===========================
           Last Updated
        ============================ */

        const now =
            new Date();


        setText(
            "last-updated",
            now.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            )
        );



    } catch (error) {


        console.error(
            "Unable to load Pi Master status:",
            error
        );


        updateStatusIndicator(false);


        setText(
            "server-status",
            "Unavailable"
        );


        setText(
            "server-message",
            "Unable to connect to the server API."
        );


        setText(
            "player-count",
            "—"
        );


        setText(
            "server-version",
            "—"
        );


        setText(
            "server-ping",
            "—"
        );


        const playerList =
            document.getElementById(
                "player-list"
            );


        if (playerList) {

            playerList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        Status unavailable
                    </h3>

                    <p>
                        The website could not connect
                        to the Pi Master API.
                    </p>

                </div>

            `;

        }


        setText(
            "last-updated",
            "Connection failed"
        );

    }

}



/* =========================================================
   Automatic Refresh
========================================================= */

loadServerStatus();


setInterval(
    loadServerStatus,
    15000
);
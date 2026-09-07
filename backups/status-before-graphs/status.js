/*
    Pi Master Minecraft Website

    status.js

    Handles live server dashboard updates
*/


// =================================
// API location
// =================================

const STATUS_API =
    window.location.protocol === "https:"
        ? "/api/status"
        : "http://192.168.50.20:5050/api/status";

console.log("Hostname:", location.hostname);
console.log("Using API:", STATUS_API);

// =================================
// Update status page
// =================================

async function updateServerStatus() {


    try {


        const response = await fetch(
            STATUS_API
        );


        if (!response.ok) {

            throw new Error(
                "API unavailable"
            );

        }


        const data =
            await response.json();



        updateMinecraftStatus(data);


        updateSystemStatus(data);


        updatePlayers(data);



    }


    catch(error) {


        console.log(
            "Status error:",
            error
        );


        showOffline();


    }


}






// =================================
// Minecraft information
// =================================

function updateMinecraftStatus(data) {

    const players =
        document.getElementById(
            "players"
        );

    if(players) {

        players.textContent =
            `${data.players} / ${data.max_players}`;

    }

    const version =
        document.getElementById(
            "version"
        );

    if(version) {

        version.textContent =
            data.version || "Unknown";

    }

    const ping =
        document.getElementById(
            "ping"
        );

    if(ping) {

        ping.textContent =
            `${data.ping} ms`;

    }

    const status = document.getElementById("server-status");

    if (status) {
        if (data.online) {
            status.className = "status online";
            status.innerHTML = '<span class="status-dot"></span> Online';
        } else {
            status.className = "status offline";
            status.innerHTML = '<span class="status-dot"></span> Offline';
        }
    }

}

// =================================
// Ubuntu system information
// =================================

function updateSystemStatus(data) {


    const cpu =
        document.getElementById(
            "cpu"
        );


    if(cpu){

        cpu.textContent =
            `${data.cpu}%`;

    }




    const ram =
        document.getElementById(
            "ram"
        );


    if(ram){

        ram.textContent =
            `${data.ram}%`;

    }




    const disk =
        document.getElementById(
            "disk"
        );


    if(disk){

        disk.textContent =
            `${data.disk}%`;

    }




    const uptime =
        document.getElementById(
            "uptime"
        );


    if(uptime){

        uptime.textContent =
            data.uptime;

    }



}







// =================================
// Player list
// =================================

function updatePlayers(data) {


    const container =
        document.getElementById(
            "player-list"
        );


    if(!container){

        return;

    }



    container.innerHTML = "";



    if(
        !data.player_list ||
        data.player_list.length === 0
    ) {


        container.innerHTML = `

        <div class="player">

            <div class="player-avatar">
                👤
            </div>

            <div>

                <div class="player-name">
                    No players online
                </div>

                <div class="player-time">
                    Waiting for players
                </div>

            </div>

        </div>

        `;


        return;

    }





    data.player_list.forEach(
        player => {


        container.innerHTML += `

        <div class="player">


            <div class="player-avatar">

                👤

            </div>



            <div>


                <div class="player-name">

                    ${player}

                </div>


                <div class="player-time">

                    Online

                </div>


            </div>


        </div>


        `;


    });



}







// =================================
// Offline display
// =================================

function showOffline(){


    const players =
        document.getElementById(
            "players"
        );


    if(players){

        players.textContent =
            "Offline";

    }


}







// =================================
// Start dashboard
// =================================


document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateServerStatus();

        setInterval(
            updateServerStatus,
            15000
        );

    }
);

let charts = {};


async function loadHistory(){

    try {

        const response = await fetch("/api/history");

        const data = await response.json();


        data.reverse();


        createChart(
            "cpuChart",
            "CPU %",
            data.map(x => x.cpu),
            "%"
        );


        createChart(
            "ramChart",
            "RAM %",
            data.map(x => x.ram),
            "%"
        );


        createChart(
            "playerChart",
            "Players",
            data.map(x => x.players),
            ""
        );


        createChart(
            "pingChart",
            "Ping",
            data.map(x => x.ping),
            "ms"
        );


    }
    catch(error){

        console.log(
            "History error:",
            error
        );

    }

}





function createChart(
    id,
    label,
    values,
    unit
){


    const ctx =
        document.getElementById(id);


    if(!ctx)
        return;



    if(charts[id])
        charts[id].destroy();



    charts[id] = new Chart(
        ctx,
        {

            type:"line",

            data:{

                labels:
                    values.map(
                        (_,i)=>i
                    ),


                datasets:[{

                    label:label,

                    data:values,

                    tension:0.3

                }]

            },


            options:{

                responsive:true,


                plugins:{

                    legend:{
                        display:true
                    }

                }

            }

        }

    );


}





document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        loadHistory();

    }
);
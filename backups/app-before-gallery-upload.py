from flask import Flask, jsonify
from flask_cors import CORS

from mcstatus import BedrockServer

import sqlite3
import psutil
import os
import time
from datetime import datetime


app = Flask(__name__)

CORS(app)


# -----------------------------
# Configuration
# -----------------------------

MC_HOST = os.getenv(
    "MINECRAFT_HOST",
    "pimaster.coeus1.tech"
)

MC_PORT = int(
    os.getenv(
        "MINECRAFT_PORT",
        19132
    )
)


DATABASE = "/app/database/pimaster.db"


START_TIME = time.time()



# -----------------------------
# Database
# -----------------------------

def db_connection():

    return sqlite3.connect(
        DATABASE
    )





# -----------------------------
# Utility
# -----------------------------

def get_uptime():

    seconds = int(
        time.time() - START_TIME
    )

    days = seconds // 86400

    hours = (
        seconds % 86400
    ) // 3600

    minutes = (
        seconds % 3600
    ) // 60


    return (
        f"{days}d "
        f"{hours}h "
        f"{minutes}m"
    )





# -----------------------------
# Minecraft Status
# -----------------------------

@app.route("/api/status")
def status():


    data = {

        "online": False,

        "players": 0,

        "max_players": 0,

        "version": "Unknown",

        "ping": 0,

        "cpu": psutil.cpu_percent(),

        "ram": psutil.virtual_memory().percent,

        "disk": psutil.disk_usage("/").percent,

        "uptime": get_uptime()

    }



    try:

        server = BedrockServer(
            MC_HOST,
            MC_PORT
        )


        result = server.status()


        data["online"] = True

        data["players"] = result.players.online

        data["max_players"] = result.players.max

        data["version"] = result.version.name

        data["ping"] = round(
            result.latency
        )


    except Exception as e:

        print(
            "Minecraft error:",
            e
        )



    save_stats(data)


    return jsonify(data)






# -----------------------------
# Stats History
# -----------------------------

def save_stats(data):

    try:

        con = db_connection()

        cur = con.cursor()


        cur.execute(
            """
            INSERT INTO stats_history
            (
            players,
            cpu,
            ram,
            disk,
            ping
            )
            VALUES
            (?, ?, ?, ?, ?)
            """,
            (
                data["players"],
                data["cpu"],
                data["ram"],
                data["disk"],
                data["ping"]
            )
        )


        con.commit()

        con.close()


    except Exception as e:

        print(
            "Stats save error:",
            repr(e)
        )

@app.route("/api/history")
def history():

    con = db_connection()

    cur = con.cursor()

    rows = cur.execute(
        """
        SELECT
            timestamp,
            cpu,
            ram,
            disk,
            players,
            ping
        FROM stats_history
        ORDER BY id DESC
        LIMIT 720
        """
    ).fetchall()

    con.close()


    data = []

    for row in rows:
        data.append({
            "time": row[0],
            "cpu": row[1],
            "ram": row[2],
            "disk": row[3],
            "players": row[4],
            "ping": row[5]
        })


    return jsonify(data)

#------------------------------
# News
# -----------------------------

@app.route("/api/news")
def news():

    con = db_connection()

    con.row_factory = sqlite3.Row

    cur = con.cursor()

    rows = cur.execute(
        """
        SELECT
            id,
            title,
            summary,
            content,
            image,
            author,
            created_at,
            featured
        FROM news
        WHERE published = 1
        ORDER BY featured DESC,
                 created_at DESC
        """
    ).fetchall()

    con.close()

    return jsonify(
        [dict(row) for row in rows]
    )




# -----------------------------
# Gallery
# -----------------------------

@app.route("/api/gallery")
def gallery():

    con = db_connection()

    cur = con.cursor()


    rows = cur.execute(
        """
        SELECT *
        FROM gallery
        ORDER BY id DESC
        """
    ).fetchall()


    con.close()


    return jsonify(rows)






# -----------------------------
# Community
# -----------------------------

@app.route("/api/community")
def community():

    con = db_connection()

    cur = con.cursor()


    rows = cur.execute(
        """
        SELECT *
        FROM community
        ORDER BY id DESC
        """
    ).fetchall()


    con.close()


    return jsonify(rows)






@app.route("/")
def home():

    return "Pi Master API Online"





app.run(
    host="0.0.0.0",
    port=5000
)

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
from mcstatus import BedrockServer

import sqlite3
import psutil
import os
import uuid
import time
from datetime import datetime


app = Flask(__name__)

CORS(app)


# -----------------------------
# Gallery Upload Configuration
# -----------------------------

UPLOAD_FOLDER = "/app/uploads/gallery"

ALLOWED_IMAGE_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_SIZE




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
# News Image Upload Configuration
# -----------------------------

NEWS_UPLOAD_FOLDER = "/app/uploads/news"

ALLOWED_NEWS_IMAGE_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}


def allowed_news_image(filename):

    if not filename:
        return False

    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_NEWS_IMAGE_EXTENSIONS

  
# -----------------------------
# News Image Upload
# -----------------------------

@app.route("/api/admin/news/upload-image", methods=["POST"])
def upload_news_image():

    if "image" not in request.files:

        return jsonify({
            "success": False,
            "error": "No image supplied."
        }), 400


    file = request.files["image"]


    if not file or not file.filename:

        return jsonify({
            "success": False,
            "error": "No image selected."
        }), 400


    if not allowed_news_image(file.filename):

        return jsonify({
            "success": False,
            "error": "Invalid image type. Use JPG, JPEG, PNG or WebP."
        }), 400


    os.makedirs(
        NEWS_UPLOAD_FOLDER,
        exist_ok=True
    )


    extension = (
        file.filename
        .rsplit(".", 1)[1]
        .lower()
    )


    filename = (
        f"{uuid.uuid4().hex}"
        f".{extension}"
    )


    filepath = os.path.join(
        NEWS_UPLOAD_FOLDER,
        filename
    )


    file.save(filepath)


    return jsonify({
        "success": True,
        "filename": filename,
        "url": f"/uploads/news/{filename}"
    })
    

# -----------------------------
# Admin News
# -----------------------------

@app.route("/api/admin/news")
def admin_news():

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
            published,
            featured
        FROM news
        ORDER BY created_at DESC
        """
    ).fetchall()

    con.close()

    return jsonify(
        [dict(row) for row in rows]
    )


@app.route("/api/admin/news", methods=["POST"])
def create_news():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "error": "No data supplied."
        }), 400


    title = str(
        data.get("title", "")
    ).strip()

    content = str(
        data.get("content", "")
    ).strip()


    if not title:
        return jsonify({
            "success": False,
            "error": "Title is required."
        }), 400


    if not content:
        return jsonify({
            "success": False,
            "error": "Article content is required."
        }), 400


    summary = str(
        data.get("summary", "")
    ).strip()

    image = str(
        data.get("image", "")
    ).strip()

    author = str(
        data.get("author", "Admin")
    ).strip() or "Admin"


    published = (
        1
        if data.get("published")
        else 0
    )

    featured = (
        1
        if data.get("featured")
        else 0
    )


    con = db_connection()

    cur = con.cursor()


    # If this article is featured,
    # remove featured status from all
    # other articles.

    if featured:

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            """
        )


    cur.execute(
        """
        INSERT INTO news
        (
            title,
            summary,
            content,
            image,
            author,
            published,
            featured
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            title,
            summary,
            content,
            image or None,
            author,
            published,
            featured
        )
    )


    con.commit()

    new_id = cur.lastrowid

    con.close()


    return jsonify({
        "success": True,
        "id": new_id
    }), 201



@app.route(
    "/api/admin/news/<int:news_id>",
    methods=["PUT"]
)
def update_news(news_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "error": "No data supplied."
        }), 400


    title = str(
        data.get("title", "")
    ).strip()

    content = str(
        data.get("content", "")
    ).strip()


    if not title:
        return jsonify({
            "success": False,
            "error": "Title is required."
        }), 400


    if not content:
        return jsonify({
            "success": False,
            "error": "Article content is required."
        }), 400


    summary = str(
        data.get("summary", "")
    ).strip()

    image = str(
        data.get("image", "")
    ).strip()

    author = str(
        data.get("author", "Admin")
    ).strip() or "Admin"


    published = (
        1
        if data.get("published")
        else 0
    )

    featured = (
        1
        if data.get("featured")
        else 0
    )


    con = db_connection()

    cur = con.cursor()


    existing = cur.execute(
        """
        SELECT id
        FROM news
        WHERE id = ?
        """,
        (news_id,)
    ).fetchone()


    if not existing:

        con.close()

        return jsonify({
            "success": False,
            "error": "Article not found."
        }), 404


    if featured:

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            """
        )


    cur.execute(
        """
        UPDATE news
        SET
            title = ?,
            summary = ?,
            content = ?,
            image = ?,
            author = ?,
            published = ?,
            featured = ?
        WHERE id = ?
        """,
        (
            title,
            summary,
            content,
            image or None,
            author,
            published,
            featured,
            news_id
        )
    )


    con.commit()

    con.close()


    return jsonify({
        "success": True
    })



@app.route(
    "/api/admin/news/<int:news_id>",
    methods=["DELETE"]
)
def delete_news(news_id):

    con = db_connection()

    cur = con.cursor()


    existing = cur.execute(
        """
        SELECT id
        FROM news
        WHERE id = ?
        """,
        (news_id,)
    ).fetchone()


    if not existing:

        con.close()

        return jsonify({
            "success": False,
            "error": "Article not found."
        }), 404


    cur.execute(
        """
        DELETE FROM news
        WHERE id = ?
        """,
        (news_id,)
    )


    con.commit()

    con.close()


    return jsonify({
        "success": True
    })



@app.route(
    "/api/admin/news/<int:news_id>/publish",
    methods=["POST"]
)
def toggle_news_published(news_id):

    con = db_connection()

    cur = con.cursor()


    row = cur.execute(
        """
        SELECT published
        FROM news
        WHERE id = ?
        """,
        (news_id,)
    ).fetchone()


    if not row:

        con.close()

        return jsonify({
            "success": False,
            "error": "Article not found."
        }), 404


    new_value = (
        0
        if int(row[0]) == 1
        else 1
    )


    cur.execute(
        """
        UPDATE news
        SET published = ?
        WHERE id = ?
        """,
        (
            new_value,
            news_id
        )
    )


    con.commit()

    con.close()


    return jsonify({
        "success": True,
        "published": new_value
    })



@app.route(
    "/api/admin/news/<int:news_id>/feature",
    methods=["POST"]
)
def toggle_news_featured(news_id):

    con = db_connection()

    cur = con.cursor()


    row = cur.execute(
        """
        SELECT featured
        FROM news
        WHERE id = ?
        """,
        (news_id,)
    ).fetchone()


    if not row:

        con.close()

        return jsonify({
            "success": False,
            "error": "Article not found."
        }), 404


    currently_featured = int(row[0]) == 1


    if currently_featured:

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            WHERE id = ?
            """,
            (news_id,)
        )

        new_value = 0


    else:

        # Only one article can be featured.

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            """
        )


        cur.execute(
            """
            UPDATE news
            SET featured = 1
            WHERE id = ?
            """,
            (news_id,)
        )

        new_value = 1


    con.commit()

    con.close()


    return jsonify({
        "success": True,
        "featured": new_value
    })
    
    
# -----------------------------
# Gallery Upload Helpers
# -----------------------------

def allowed_image(filename):

    if not filename:
        return False

    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_IMAGE_EXTENSIONS





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
        WHERE approved = 1
        ORDER BY id DESC
        """
    ).fetchall()

    con.close()

    return jsonify(rows)




# -----------------------------
# Upload Gallery Image
# -----------------------------

@app.route("/api/gallery/upload", methods=["POST"])
def upload_gallery_image():

    try:

        uploaded_by = request.form.get(
            "uploaded_by",
            ""
        ).strip()


        title = request.form.get(
            "title",
            ""
        ).strip()


        caption = request.form.get(
            "caption",
            ""
        ).strip()


        image = request.files.get("image")



        # -----------------------------
        # Validate name
        # -----------------------------

        if not uploaded_by:

            return jsonify({
                "success": False,
                "error": "Please enter your name."
            }), 400


        if len(uploaded_by) > 50:

            return jsonify({
                "success": False,
                "error": "Name is too long."
            }), 400



        # -----------------------------
        # Validate title
        # -----------------------------

        if not title:

            return jsonify({
                "success": False,
                "error": "Please enter a title."
            }), 400


        if len(title) > 100:

            return jsonify({
                "success": False,
                "error": "Title is too long."
            }), 400



        # -----------------------------
        # Validate image
        # -----------------------------

        if not image:

            return jsonify({
                "success": False,
                "error": "Please select an image."
            }), 400


        if not image.filename:

            return jsonify({
                "success": False,
                "error": "Invalid image filename."
            }), 400


        if not allowed_image(image.filename):

            return jsonify({
                "success": False,
                "error":
                    "Invalid image type. "
                    "Use JPG, JPEG, PNG or WebP."
            }), 400



        # -----------------------------
        # Make sure upload directory exists
        # -----------------------------

        os.makedirs(
            UPLOAD_FOLDER,
            exist_ok=True
        )



        # -----------------------------
        # Generate safe filename
        # -----------------------------

        original_name = secure_filename(image.filename)

        extension = original_name.rsplit(".", 1)[1].lower()

        filename = f"{uuid.uuid4().hex}.{extension}"


        filepath = os.path.join(
            UPLOAD_FOLDER,
            filename
        )



        # -----------------------------
        # Save image
        # -----------------------------

        image.save(filepath)



        # -----------------------------
        # Database
        # -----------------------------

        con = db_connection()

        cur = con.cursor()


        cur.execute(
            """
            INSERT INTO gallery
            (
                filename,
                title,
                caption,
                uploaded_by,
                approved,
                featured
            )
            VALUES (?, ?, ?, ?, 0, 0)
            """,
            (
                filename,
                title,
                caption,
                uploaded_by
            )
        )


        con.commit()


        gallery_id = cur.lastrowid


        con.close()



        # -----------------------------
        # Success
        # -----------------------------

        return jsonify({

            "success": True,

            "message":
                "Screenshot uploaded successfully "
                "and is awaiting approval.",

            "id":
                gallery_id

        }), 201



    except Exception as error:

        print(
            "Gallery upload error:",
            error
        )


        return jsonify({

            "success": False,

            "error":
                "The screenshot could not be uploaded."

        }), 500






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







# =========================================================
# Admin Gallery
# =========================================================

@app.route("/api/admin/gallery")
def admin_gallery():

    con = db_connection()

    cur = con.cursor()

    rows = cur.execute(
        """
        SELECT
            id,
            filename,
            title,
            caption,
            uploaded_by,
            created_at,
            approved,
            featured
        FROM gallery
        ORDER BY id DESC
        """
    ).fetchall()

    con.close()

    return jsonify([
        {
            "id": row[0],
            "filename": row[1],
            "title": row[2],
            "caption": row[3],
            "uploaded_by": row[4],
            "created_at": row[5],
            "approved": row[6],
            "featured": row[7]
        }
        for row in rows
    ])


# =========================================================
# Approve Gallery Image
# =========================================================

@app.route(
    "/api/admin/gallery/<int:gallery_id>/approve",
    methods=["POST"]
)
def approve_gallery(gallery_id):

    con = db_connection()

    cur = con.cursor()

    cur.execute(
        """
        UPDATE gallery
        SET approved = 1
        WHERE id = ?
        """,
        (gallery_id,)
    )

    con.commit()

    changed = cur.rowcount

    con.close()

    if changed == 0:

        return jsonify({
            "success": False,
            "error": "Gallery item not found."
        }), 404

    return jsonify({
        "success": True
    })


# =========================================================
# Feature / Unfeature Gallery Image
# =========================================================

@app.route(
    "/api/admin/gallery/<int:gallery_id>/feature",
    methods=["POST"]
)
def feature_gallery(gallery_id):

    con = db_connection()

    cur = con.cursor()

    row = cur.execute(
        """
        SELECT featured
        FROM gallery
        WHERE id = ?
        """,
        (gallery_id,)
    ).fetchone()


    if row is None:

        con.close()

        return jsonify({
            "success": False,
            "error": "Gallery item not found."
        }), 404


    # SQLite returns a tuple, so featured is row[0]
    current_value = row[0]

    new_value = 0 if current_value else 1


    cur.execute(
        """
        UPDATE gallery
        SET featured = ?
        WHERE id = ?
        """,
        (new_value, gallery_id)
    )


    con.commit()

    con.close()


    return jsonify({
        "success": True,
        "featured": new_value
    })


# =========================================================
# Delete Gallery Image
# =========================================================

@app.route(
    "/api/admin/gallery/<int:gallery_id>",
    methods=["DELETE"]
)
def delete_gallery(gallery_id):

    con = db_connection()

    cur = con.cursor()

    row = cur.execute(
        """
        SELECT filename
        FROM gallery
        WHERE id = ?
        """,
        (gallery_id,)
    ).fetchone()


    if row is None:

        con.close()

        return jsonify({
            "success": False,
            "error": "Gallery item not found."
        }), 404


    # SQLite returns a tuple.
    # filename is the first and only selected column.
    filename = row[0]


    # Delete database record
    cur.execute(
        """
        DELETE FROM gallery
        WHERE id = ?
        """,
        (gallery_id,)
    )


    con.commit()

    con.close()


    # Delete the physical image file
    if filename:

        filepath = os.path.join(
            UPLOAD_FOLDER,
            filename
        )


        if os.path.exists(filepath):

            try:

                os.remove(filepath)

            except OSError as error:

                print(
                    f"Could not delete image {filepath}: {error}"
                )


    return jsonify({
        "success": True
    })

    
# =========================================================
# BBC News Administration
# =========================================================

BBC_UPLOAD_FOLDER = "/app/uploads/bbc"


# Make sure the BBC upload directory exists.

os.makedirs(
    BBC_UPLOAD_FOLDER,
    exist_ok=True
)


# ---------------------------------------------------------
# BBC News List
# ---------------------------------------------------------

@app.route("/api/bbc/news")
def bbc_news():

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
            published,
            featured
        FROM news
        WHERE author = 'BBC'
        ORDER BY created_at DESC
        """
    ).fetchall()

    con.close()

    return jsonify(
        [dict(row) for row in rows]
    )


# ---------------------------------------------------------
# BBC Image Upload
# ---------------------------------------------------------

@app.route(
    "/api/bbc/upload",
    methods=["POST"]
)
def bbc_upload():

    if "image" not in request.files:

        return jsonify({
            "success": False,
            "error": "No image supplied."
        }), 400


    file = request.files["image"]


    if not file.filename:

        return jsonify({
            "success": False,
            "error": "No image selected."
        }), 400


    if not allowed_image(file.filename):

        return jsonify({
            "success": False,
            "error": "Only JPG, JPEG, PNG and WebP images are allowed."
        }), 400


    extension = (
        file.filename
        .rsplit(".", 1)[1]
        .lower()
    )


    filename = (
        f"{uuid.uuid4().hex}.{extension}"
    )


    filepath = os.path.join(
        BBC_UPLOAD_FOLDER,
        filename
    )


    file.save(filepath)


    return jsonify({
        "success": True,
        "image": f"/uploads/bbc/{filename}"
    })


# ---------------------------------------------------------
# BBC Create News
# ---------------------------------------------------------

@app.route(
    "/api/bbc/news",
    methods=["POST"]
)
def create_bbc_news():

    data = request.get_json()


    if not data:

        return jsonify({
            "success": False,
            "error": "No data supplied."
        }), 400


    title = str(
        data.get("title", "")
    ).strip()


    summary = str(
        data.get("summary", "")
    ).strip()


    content = str(
        data.get("content", "")
    ).strip()


    image = str(
        data.get("image", "")
    ).strip()


    if not title:

        return jsonify({
            "success": False,
            "error": "Headline is required."
        }), 400


    if not content:

        return jsonify({
            "success": False,
            "error": "Article content is required."
        }), 400


    published = (
        1
        if data.get("published")
        else 0
    )


    featured = (
        1
        if data.get("featured")
        else 0
    )


    con = db_connection()

    cur = con.cursor()


    # Only one article can be featured.

    if featured:

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            """
        )


    cur.execute(
        """
        INSERT INTO news
        (
            title,
            summary,
            content,
            image,
            author,
            published,
            featured
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            title,
            summary,
            content,
            image or None,

            # IMPORTANT:
            # BBC is always forced here.
            "BBC",

            published,
            featured
        )
    )


    con.commit()

    new_id = cur.lastrowid

    con.close()


    return jsonify({
        "success": True,
        "id": new_id
    }), 201


# ---------------------------------------------------------
# BBC Update News
# ---------------------------------------------------------

@app.route(
    "/api/bbc/news/<int:news_id>",
    methods=["PUT"]
)
def update_bbc_news(news_id):

    data = request.get_json()


    if not data:

        return jsonify({
            "success": False,
            "error": "No data supplied."
        }), 400


    title = str(
        data.get("title", "")
    ).strip()


    summary = str(
        data.get("summary", "")
    ).strip()


    content = str(
        data.get("content", "")
    ).strip()


    image = str(
        data.get("image", "")
    ).strip()


    if not title:

        return jsonify({
            "success": False,
            "error": "Headline is required."
        }), 400


    if not content:

        return jsonify({
            "success": False,
            "error": "Article content is required."
        }), 400


    published = (
        1
        if data.get("published")
        else 0
    )


    featured = (
        1
        if data.get("featured")
        else 0
    )


    con = db_connection()

    cur = con.cursor()


    existing = cur.execute(
        """
        SELECT
            id,
            image
        FROM news
        WHERE id = ?
          AND author = 'BBC'
        """,
        (news_id,)
    ).fetchone()


    if not existing:

        con.close()

        return jsonify({
            "success": False,
            "error": "BBC article not found."
        }), 404


    if featured:

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            """
        )


    cur.execute(
        """
        UPDATE news
        SET
            title = ?,
            summary = ?,
            content = ?,
            image = ?,
            author = 'BBC',
            published = ?,
            featured = ?
        WHERE id = ?
          AND author = 'BBC'
        """,
        (
            title,
            summary,
            content,
            image or None,
            published,
            featured,
            news_id
        )
    )


    con.commit()

    con.close()


    return jsonify({
        "success": True
    })


# ---------------------------------------------------------
# BBC Delete News
# ---------------------------------------------------------

@app.route(
    "/api/bbc/news/<int:news_id>",
    methods=["DELETE"]
)
def delete_bbc_news(news_id):

    con = db_connection()

    cur = con.cursor()


    existing = cur.execute(
        """
        SELECT
            id,
            image
        FROM news
        WHERE id = ?
          AND author = 'BBC'
        """,
        (news_id,)
    ).fetchone()


    if not existing:

        con.close()

        return jsonify({
            "success": False,
            "error": "BBC article not found."
        }), 404


    image = existing[1]


    cur.execute(
        """
        DELETE FROM news
        WHERE id = ?
          AND author = 'BBC'
        """,
        (news_id,)
    )


    con.commit()

    con.close()


    # Remove the BBC image if it belongs
    # to the BBC upload directory.

    if image:

        if image.startswith(
            "/uploads/bbc/"
        ):

            filename = os.path.basename(
                image
            )

            filepath = os.path.join(
                BBC_UPLOAD_FOLDER,
                filename
            )


            if os.path.isfile(filepath):

                try:

                    os.remove(filepath)

                except OSError:

                    pass


    return jsonify({
        "success": True
    })


# ---------------------------------------------------------
# BBC Publish / Unpublish
# ---------------------------------------------------------

@app.route(
    "/api/bbc/news/<int:news_id>/publish",
    methods=["POST"]
)
def toggle_bbc_published(news_id):

    con = db_connection()

    cur = con.cursor()


    row = cur.execute(
        """
        SELECT published
        FROM news
        WHERE id = ?
          AND author = 'BBC'
        """,
        (news_id,)
    ).fetchone()


    if not row:

        con.close()

        return jsonify({
            "success": False,
            "error": "BBC article not found."
        }), 404


    new_value = (
        0
        if int(row[0]) == 1
        else 1
    )


    cur.execute(
        """
        UPDATE news
        SET published = ?
        WHERE id = ?
          AND author = 'BBC'
        """,
        (
            new_value,
            news_id
        )
    )


    con.commit()

    con.close()


    return jsonify({
        "success": True,
        "published": new_value
    })


# ---------------------------------------------------------
# BBC Featured
# ---------------------------------------------------------

@app.route(
    "/api/bbc/news/<int:news_id>/feature",
    methods=["POST"]
)
def toggle_bbc_featured(news_id):

    con = db_connection()

    cur = con.cursor()


    row = cur.execute(
        """
        SELECT featured
        FROM news
        WHERE id = ?
          AND author = 'BBC'
        """,
        (news_id,)
    ).fetchone()


    if not row:

        con.close()

        return jsonify({
            "success": False,
            "error": "BBC article not found."
        }), 404


    currently_featured = int(row[0]) == 1


    if currently_featured:

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            WHERE id = ?
              AND author = 'BBC'
            """,
            (news_id,)
        )

        new_value = 0


    else:

        # There can only be one featured
        # article across the public News page.

        cur.execute(
            """
            UPDATE news
            SET featured = 0
            """
        )


        cur.execute(
            """
            UPDATE news
            SET featured = 1
            WHERE id = ?
              AND author = 'BBC'
            """,
            (news_id,)
        )

        new_value = 1


    con.commit()

    con.close()


    return jsonify({
        "success": True,
        "featured": new_value
    })

# =========================================================
# Start Server
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000
    )
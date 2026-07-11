import sqlite3

DATABASE = "chatbot.db"


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_connection():
    conn = sqlite3.connect(
        DATABASE,
        check_same_thread=False
    )

    conn.row_factory = sqlite3.Row

    return conn


# ==========================================
# CREATE TABLES
# ==========================================

def create_tables():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT 'New Chat',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (session_id)
            REFERENCES chat_sessions(id)
            ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()


# ==========================================
# CREATE CHAT
# ==========================================

def create_session(title="New Chat"):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO chat_sessions (title)
        VALUES (?)
        """,
        (title,)
    )

    conn.commit()

    session_id = cursor.lastrowid

    conn.close()

    return session_id


# ==========================================
# GET ALL CHATS
# ==========================================

def get_sessions():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, title, created_at
        FROM chat_sessions
        ORDER BY id DESC
    """)

    sessions = cursor.fetchall()

    conn.close()

    return sessions


# ==========================================
# GET SINGLE SESSION
# ==========================================

def get_session(session_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, title, created_at
        FROM chat_sessions
        WHERE id = ?
        """,
        (session_id,)
    )

    session = cursor.fetchone()

    conn.close()

    return session


# ==========================================
# RENAME CHAT
# ==========================================

def rename_session(session_id, title):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE chat_sessions
        SET title = ?
        WHERE id = ?
        """,
        (
            title,
            session_id
        )
    )

    conn.commit()

    updated = cursor.rowcount

    conn.close()

    return updated > 0


# ==========================================
# DELETE ONE CHAT
# ==========================================

def delete_session(session_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM messages
        WHERE session_id = ?
        """,
        (session_id,)
    )

    cursor.execute(
        """
        DELETE FROM chat_sessions
        WHERE id = ?
        """,
        (session_id,)
    )

    conn.commit()

    deleted = cursor.rowcount

    conn.close()

    return deleted > 0


# ==========================================
# DELETE ALL CHATS
# ==========================================

def delete_all_sessions():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM messages"
    )

    cursor.execute(
        "DELETE FROM chat_sessions"
    )

    conn.commit()
    conn.close()


# ==========================================
# SAVE MESSAGE
# ==========================================

def save_message(session_id, role, message):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO messages (
            session_id,
            role,
            message
        )
        VALUES (?, ?, ?)
        """,
        (
            session_id,
            role,
            message
        )
    )

    conn.commit()

    message_id = cursor.lastrowid

    conn.close()

    return message_id


# ==========================================
# GET CHAT MESSAGES
# ==========================================

def get_messages(session_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            role,
            message,
            created_at
        FROM messages
        WHERE session_id = ?
        ORDER BY id ASC
        """,
        (session_id,)
    )

    messages = cursor.fetchall()

    conn.close()

    return messages


# ==========================================
# GET LAST USER MESSAGE
# ==========================================

def get_last_user_message(session_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT message
        FROM messages
        WHERE session_id = ?
        AND role = 'user'
        ORDER BY id DESC
        LIMIT 1
        """,
        (session_id,)
    )

    message = cursor.fetchone()

    conn.close()

    return message


# ==========================================
# DELETE LAST ASSISTANT MESSAGE
# ==========================================

def delete_last_assistant_message(session_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM messages
        WHERE session_id = ?
        AND role = 'assistant'
        ORDER BY id DESC
        LIMIT 1
        """,
        (session_id,)
    )

    message = cursor.fetchone()

    if message:

        cursor.execute(
            """
            DELETE FROM messages
            WHERE id = ?
            """,
            (message["id"],)
        )

    conn.commit()
    conn.close()


# ==========================================
# SEARCH CHAT HISTORY
# ==========================================

def search_sessions(keyword):

    conn = get_connection()
    cursor = conn.cursor()

    search_value = f"%{keyword}%"

    cursor.execute(
        """
        SELECT DISTINCT
            chat_sessions.id,
            chat_sessions.title,
            chat_sessions.created_at

        FROM chat_sessions

        LEFT JOIN messages
        ON chat_sessions.id = messages.session_id

        WHERE chat_sessions.title LIKE ?
        OR messages.message LIKE ?

        ORDER BY chat_sessions.id DESC
        """,
        (
            search_value,
            search_value
        )
    )

    sessions = cursor.fetchall()

    conn.close()

    return sessions


# ==========================================
# AUTO CHAT TITLE
# ==========================================

def update_session_title_if_new(session_id, message):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT title
        FROM chat_sessions
        WHERE id = ?
        """,
        (session_id,)
    )

    session = cursor.fetchone()

    if session and session["title"] == "New Chat":

        title = message.strip()

        if len(title) > 35:
            title = title[:35] + "..."

        cursor.execute(
            """
            UPDATE chat_sessions
            SET title = ?
            WHERE id = ?
            """,
            (
                title,
                session_id
            )
        )

    conn.commit()
    conn.close()


# ==========================================
# INITIALIZE DATABASE
# ==========================================

create_tables()
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    Response,
    stream_with_context
)

from openai import OpenAI

from config import Config

from database import (
    create_session,
    get_sessions,
    get_session,
    rename_session,
    delete_session,
    delete_all_sessions,
    save_message,
    get_messages,
    get_last_user_message,
    delete_last_assistant_message,
    search_sessions,
    update_session_title_if_new
)


# ==========================================
# FLASK APP
# ==========================================

app = Flask(__name__)
app.config.from_object(Config)


# ==========================================
# OPENROUTER CLIENT
# ==========================================

client = OpenAI(
    base_url=Config.OPENROUTER_BASE_URL,
    api_key=Config.OPENROUTER_API_KEY
)


# ==========================================
# OPENROUTER ERROR HANDLER
# ==========================================

def get_ai_error_message(error):

    error_text = str(error).lower()

    if (
        "401" in error_text
        or "unauthorized" in error_text
        or "api key" in error_text
    ):
        return (
            "🔑 OpenRouter API key error. "
            "Please check your API key."
        )

    if (
        "402" in error_text
        or "credits" in error_text
    ):
        return (
            "⚠️ OpenRouter credits are unavailable. "
            "Please check your account."
        )

    if (
        "429" in error_text
        or "rate limit" in error_text
    ):
        return (
            "⚠️ AI request limit reached. "
            "Please try again later."
        )

    if (
        "503" in error_text
        or "unavailable" in error_text
    ):
        return (
            "🤖 AI model is temporarily unavailable. "
            "Please try again."
        )

    return (
        "❌ Unable to generate AI response. "
        "Please try again."
    )


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return render_template("index.html")


# ==========================================
# NEW CHAT
# ==========================================

@app.route(
    "/new_chat",
    methods=["POST"]
)
def new_chat():

    session_id = create_session(
        "New Chat"
    )

    return jsonify({
        "status": "success",
        "session_id": session_id
    })


# ==========================================
# GET HISTORY
# ==========================================

@app.route(
    "/history",
    methods=["GET"]
)
def history():

    sessions = get_sessions()

    data = []

    for session in sessions:

        data.append({
            "id": session["id"],
            "title": session["title"],
            "created_at": session["created_at"]
        })

    return jsonify(data)


# ==========================================
# OPEN OLD CHAT
# ==========================================

@app.route(
    "/chat/<int:session_id>",
    methods=["GET"]
)
def open_chat(session_id):

    session = get_session(
        session_id
    )

    if not session:

        return jsonify({
            "status": "error",
            "message": "Chat not found"
        }), 404

    messages = get_messages(
        session_id
    )

    data = []

    for message in messages:

        data.append({
            "id": message["id"],
            "role": message["role"],
            "message": message["message"],
            "created_at": message["created_at"]
        })

    return jsonify({
        "status": "success",
        "session_id": session_id,
        "title": session["title"],
        "messages": data
    })


# ==========================================
# SEARCH HISTORY
# ==========================================

@app.route(
    "/search",
    methods=["GET"]
)
def search():

    keyword = request.args.get(
        "q",
        ""
    ).strip()

    if keyword:

        sessions = search_sessions(
            keyword
        )

    else:

        sessions = get_sessions()

    data = []

    for session in sessions:

        data.append({
            "id": session["id"],
            "title": session["title"]
        })

    return jsonify(data)


# ==========================================
# RENAME CHAT
# ==========================================

@app.route(
    "/rename_chat",
    methods=["POST"]
)
def rename_chat():

    data = request.get_json(
        silent=True
    ) or {}

    session_id = data.get(
        "session_id"
    )

    title = data.get(
        "title",
        ""
    ).strip()

    if not session_id:

        return jsonify({
            "status": "error",
            "message": "Session ID required"
        }), 400

    if not title:

        return jsonify({
            "status": "error",
            "message": "Chat name required"
        }), 400

    success = rename_session(
        session_id,
        title
    )

    if not success:

        return jsonify({
            "status": "error",
            "message": "Chat not found"
        }), 404

    return jsonify({
        "status": "success",
        "title": title
    })


# ==========================================
# DELETE ONE CHAT
# ==========================================

@app.route(
    "/delete_chat/<int:session_id>",
    methods=["DELETE"]
)
def delete_chat(session_id):

    success = delete_session(
        session_id
    )

    if not success:

        return jsonify({
            "status": "error",
            "message": "Chat not found"
        }), 404

    return jsonify({
        "status": "success"
    })


# ==========================================
# DELETE ALL CHATS
# ==========================================

@app.route(
    "/delete_all",
    methods=["DELETE"]
)
def delete_all():

    delete_all_sessions()

    return jsonify({
        "status": "success"
    })


# ==========================================
# BUILD AI PROMPT
# ==========================================

def build_prompt(
    session_id,
    persona,
    user_message
):

    messages = get_messages(
        session_id
    )

    prompt = f"""
You are an AI chatbot.

Current persona:
{persona}

Follow the selected persona naturally.

Give helpful, clear and accurate answers.

Conversation history:
"""

    for message in messages:

        role = message["role"]
        text = message["message"]

        if role == "user":

            prompt += (
                f"\nUser: {text}"
            )

        elif role == "assistant":

            prompt += (
                f"\nAssistant: {text}"
            )

    prompt += f"""

User: {user_message}

Assistant:
"""

    return prompt

# ==========================================
# STREAM CHAT
# ==========================================

@app.route(
    "/chat",
    methods=["POST"]
)
def chat():

    data = request.get_json(
        silent=True
    ) or {}

    user_message = data.get(
        "message",
        ""
    ).strip()

    session_id = data.get(
        "session_id"
    )

    persona = data.get(
        "persona",
        "General AI"
    ).strip()

    if not user_message:

        return jsonify({
            "status": "error",
            "message": "Please enter a message"
        }), 400

    if not session_id:

        session_id = create_session(
            "New Chat"
        )

    session = get_session(
        session_id
    )

    if not session:

        session_id = create_session(
            "New Chat"
        )

    prompt = build_prompt(
        session_id,
        persona,
        user_message
    )

    save_message(
        session_id,
        "user",
        user_message
    )

    update_session_title_if_new(
        session_id,
        user_message
    )

    def generate():

        complete_response = ""

        yield (
            f"__SESSION_ID__:"
            f"{session_id}\n"
        )

        try:

            response_stream = (
                client.chat.completions.create(
                    model=Config.AI_MODEL,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    stream=True
                )
            )

            for chunk in response_stream:

                text = None

                if (
                    chunk.choices
                    and chunk.choices[0].delta
                ):
                    text = (
                        chunk.choices[0]
                        .delta.content
                    )

                if text:

                    complete_response += text

                    yield text

            if complete_response.strip():

                save_message(
                    session_id,
                    "assistant",
                    complete_response
                )

        except Exception as error:

            print(
                "OpenRouter Chat Error:",
                repr(error)
            )

            friendly_error = (
                get_ai_error_message(
                    error
                )
            )

            yield friendly_error

    return Response(
        stream_with_context(
            generate()
        ),
        mimetype="text/plain"
    )


# ==========================================
# REGENERATE RESPONSE
# ==========================================

@app.route(
    "/regenerate/<int:session_id>",
    methods=["POST"]
)
def regenerate(session_id):

    session = get_session(
        session_id
    )

    if not session:

        return jsonify({
            "status": "error",
            "message": "Chat not found"
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    persona = data.get(
        "persona",
        "General AI"
    ).strip()

    last_user = get_last_user_message(
        session_id
    )

    if not last_user:

        return jsonify({
            "status": "error",
            "message": "No user message found"
        }), 400

    user_message = last_user[
        "message"
    ]

    delete_last_assistant_message(
        session_id
    )

    prompt = build_prompt(
        session_id,
        persona,
        user_message
    )

    def generate():

        complete_response = ""

        try:

            response_stream = (
                client.chat.completions.create(
                    model=Config.AI_MODEL,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    stream=True
                )
            )

            for chunk in response_stream:

                text = None

                if (
                    chunk.choices
                    and chunk.choices[0].delta
                ):
                    text = (
                        chunk.choices[0]
                        .delta.content
                    )

                if text:

                    complete_response += text

                    yield text

            if complete_response.strip():

                save_message(
                    session_id,
                    "assistant",
                    complete_response
                )

        except Exception as error:

            print(
                "OpenRouter Regenerate Error:",
                repr(error)
            )

            friendly_error = (
                get_ai_error_message(
                    error
                )
            )

            yield friendly_error

    return Response(
        stream_with_context(
            generate()
        ),
        mimetype="text/plain"
    )


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/health")
def health():

    return jsonify({
        "status": "running",
        "provider": "OpenRouter",
        "model": Config.AI_MODEL
    })


# ==========================================
# ERROR HANDLERS
# ==========================================

@app.errorhandler(404)
def page_not_found(error):

    return jsonify({
        "status": "error",
        "message": "Route not found"
    }), 404


@app.errorhandler(500)
def server_error(error):

    print(
        "Server Error:",
        repr(error)
    )

    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500


# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == "__main__":

    app.run(
        debug=Config.DEBUG,
        host="127.0.0.1",
        port=5000,
        use_reloader=False,
        threaded=True
    )
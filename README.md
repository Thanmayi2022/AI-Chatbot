# 🤖 AI Chatbot

A modern **ChatGPT-inspired AI chatbot** built using **Python, Flask, OpenRouter API, and SQLite**.

The application provides real-time AI responses with a clean and responsive chat interface. It also supports chat history management, persona selection, streaming responses, and dark/light themes.

## ✨ Features

- 💬 AI-powered chatbot
- 🆕 New Chat
- 🔍 Search Chat History
- 📜 Chat History Sidebar
- 📂 Open Previous Chats
- ⋮ Three-Dot Chat Menu
- ✏️ Rename Chat
- 🗑️ Delete Individual Chat
- 🧹 Delete All Chats
- 🌙 Dark Mode
- ☀️ Light Mode
- 🎭 Persona Selection
- ⌨️ Enter to Send
- 📤 Send Button
- 💾 SQLite Chat Storage
- 🤖 OpenRouter API Integration
- ⚡ Streaming AI Responses
- ⌛ Typing Animation
- 📋 Copy AI Response
- 🔄 Regenerate Response
- 📱 Responsive Design
- 🖱️ Collapsible Sidebar

## 🛠️ Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Python
- Flask

### AI Integration

- OpenRouter API
- OpenAI Python SDK

### Database

- SQLite

## 📁 Project Structure

```text
AI-chatbot/
│
├── app.py
├── config.py
├── database.py
├── chatbot.db
├── requirements.txt
├── .env
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

## ⚙️ Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Open the project folder:

```bash
cd AI-chatbot
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## 🔑 Environment Variables

Create a `.env` file in the project root.

```env
SECRET_KEY=your_secret_key

DATABASE=chatbot.db

OPENROUTER_API_KEY=your_openrouter_api_key

AI_MODEL=openrouter/free
```

> Never upload your real `.env` file or API key to GitHub.

## ▶️ Run the Project

```bash
python app.py
```

Open the application in your browser:


## 🧠 How It Works

1. The user sends a message from the chatbot interface.
2. Flask receives the request.
3. Previous conversation history is loaded from SQLite.
4. A prompt is created using the selected persona and chat history.
5. The request is sent to OpenRouter.
6. The AI response is streamed to the frontend.
7. User and AI messages are saved in SQLite.
8. Previous conversations can be opened, searched, renamed, regenerated, or deleted.

## 🔒 Security

API keys are stored using environment variables.

The `.env` file should be added to `.gitignore`.

```text
.env
__pycache__/
*.pyc
chatbot.db
```

## 🚀 Future Enhancements

- User Login and Registration
- Multiple AI Model Selection
- File Upload and Document Chat
- Voice Input
- AI Voice Response
- Markdown Rendering
- Code Syntax Highlighting
- Image Generation
- Cloud Deployment


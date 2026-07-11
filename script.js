// ==========================================
// ELEMENTS
// ==========================================

const appContainer = document.getElementById("app-container");
const sidebar = document.getElementById("sidebar");
const sidebarResizer = document.getElementById("sidebar-resizer");

const menuToggleBtn = document.getElementById("menu-toggle-btn");
const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
const sidebarOpenHandle = document.getElementById("sidebar-open-handle");

const newChatBtn = document.getElementById("new-chat-btn");
const deleteAllBtn = document.getElementById("delete-all-btn");

const historySearch = document.getElementById("history-search");
const historyList = document.getElementById("history-list");

const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");

const personaSelect = document.getElementById("persona-select");

const chatBox = document.getElementById("chat-box");
const welcomeScreen = document.getElementById("welcome-screen");
const typingStatus = document.getElementById("typing-status");

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

const regenerateBtn = document.getElementById("regenerate-btn");
const copyBtn = document.getElementById("copy-btn");


// ==========================================
// STATE
// ==========================================

let currentSessionId = null;
let isGenerating = false;
let activeDropdown = null;
let searchTimer = null;


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadTheme();
    loadSidebarState();
    loadSidebarWidth();
    loadHistory();

    messageInput.focus();

});


// ==========================================
// THEME
// ==========================================

function loadTheme() {

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark");

    }

    updateThemeIcon();

}


themeToggleBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const theme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

    localStorage.setItem("theme", theme);

    updateThemeIcon();

});


function updateThemeIcon() {

    const dark = document.body.classList.contains("dark");

    themeIcon.className = dark
        ? "fa-solid fa-sun"
        : "fa-solid fa-moon";

}


// ==========================================
// SIDEBAR OPEN / CLOSE
// ==========================================

function openSidebar() {

    appContainer.classList.remove("sidebar-collapsed");

    localStorage.setItem("sidebarCollapsed", "false");

}


function closeSidebar() {

    appContainer.classList.add("sidebar-collapsed");

    localStorage.setItem("sidebarCollapsed", "true");

    closeDropdown();

}


function toggleSidebar() {

    appContainer.classList.toggle("sidebar-collapsed");

    const collapsed = appContainer.classList.contains(
        "sidebar-collapsed"
    );

    localStorage.setItem(
        "sidebarCollapsed",
        collapsed
    );

    closeDropdown();

}


function loadSidebarState() {

    const collapsed = localStorage.getItem(
        "sidebarCollapsed"
    );

    if (collapsed === "true") {

        closeSidebar();

    }

}


menuToggleBtn.addEventListener("click", toggleSidebar);
sidebarCloseBtn.addEventListener("click", closeSidebar);
sidebarOpenHandle.addEventListener("click", openSidebar);


// ==========================================
// SIDEBAR RESIZE
// ==========================================

let resizing = false;


sidebarResizer.addEventListener("mousedown", event => {

    if (window.innerWidth <= 768) return;

    resizing = true;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    event.preventDefault();

});


document.addEventListener("mousemove", event => {

    if (!resizing) return;

    let width = event.clientX;

    width = Math.max(220, width);
    width = Math.min(430, width);

    document.documentElement.style.setProperty(
        "--sidebar-width",
        `${width}px`
    );

});


document.addEventListener("mouseup", () => {

    if (!resizing) return;

    resizing = false;

    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    const width = getComputedStyle(
        document.documentElement
    ).getPropertyValue("--sidebar-width");

    localStorage.setItem(
        "sidebarWidth",
        width.trim()
    );

});


function loadSidebarWidth() {

    const width = localStorage.getItem(
        "sidebarWidth"
    );

    if (width) {

        document.documentElement.style.setProperty(
            "--sidebar-width",
            width
        );

    }

}


// ==========================================
// HISTORY
// ==========================================

async function loadHistory(query = "") {

    try {

        const url = query
            ? `/search?q=${encodeURIComponent(query)}`
            : "/history";

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error("History request failed");

        }

        const sessions = await response.json();

        renderHistory(sessions);

    } catch (error) {

        console.error("History Error:", error);

        historyList.innerHTML = `
            <div class="history-empty">
                Unable to load history
            </div>
        `;

    }

}


function renderHistory(sessions) {

    historyList.innerHTML = "";

    if (!sessions.length) {

        historyList.innerHTML = `
            <div class="history-empty">
                No chat history
            </div>
        `;

        return;

    }

    sessions.forEach(session => {

        const historyItem = document.createElement("div");

        historyItem.className = "history-item";

        historyItem.dataset.sessionId = session.id;

        if (
            Number(currentSessionId) ===
            Number(session.id)
        ) {

            historyItem.classList.add("active");

        }

        const chatButton = document.createElement("button");

        chatButton.className = "history-chat-btn";
        chatButton.textContent = session.title || "New Chat";
        chatButton.title = session.title || "New Chat";

        chatButton.addEventListener("click", () => {

            openChat(session.id);

        });


        const menuButton = document.createElement("button");

        menuButton.className = "history-menu-btn";

        menuButton.innerHTML = `
            <i class="fa-solid fa-ellipsis"></i>
        `;

        menuButton.title = "Chat options";

        menuButton.addEventListener("click", event => {

            event.stopPropagation();

            toggleHistoryMenu(
                historyItem,
                session
            );

        });


        historyItem.appendChild(chatButton);
        historyItem.appendChild(menuButton);

        historyList.appendChild(historyItem);

    });

}


// ==========================================
// SEARCH HISTORY
// ==========================================

historySearch.addEventListener("input", event => {

    clearTimeout(searchTimer);

    const query = event.target.value.trim();

    searchTimer = setTimeout(() => {

        loadHistory(query);

    }, 300);

});


// ==========================================
// THREE DOT MENU
// ==========================================

function toggleHistoryMenu(historyItem, session) {

    if (
        activeDropdown &&
        activeDropdown.parentElement === historyItem
    ) {

        closeDropdown();

        return;

    }

    closeDropdown();

    const template = document.getElementById(
        "history-menu-template"
    );

    const dropdown = template.content
        .firstElementChild
        .cloneNode(true);

    const openButton = dropdown.querySelector(
        '[data-action="open"]'
    );

    const renameButton = dropdown.querySelector(
        '[data-action="rename"]'
    );

    const deleteButton = dropdown.querySelector(
        '[data-action="delete"]'
    );


    openButton.addEventListener("click", event => {

        event.stopPropagation();

        closeDropdown();

        openChat(session.id);

    });


    renameButton.addEventListener("click", event => {

        event.stopPropagation();

        closeDropdown();

        renameChat(
            session.id,
            session.title
        );

    });


    deleteButton.addEventListener("click", event => {

        event.stopPropagation();

        closeDropdown();

        deleteChat(session.id);

    });


    historyItem.appendChild(dropdown);

    activeDropdown = dropdown;

}


function closeDropdown() {

    if (activeDropdown) {

        activeDropdown.remove();

        activeDropdown = null;

    }

}


document.addEventListener("click", event => {

    if (
        activeDropdown &&
        !activeDropdown.contains(event.target)
    ) {

        closeDropdown();

    }

});


// ==========================================
// NEW CHAT
// ==========================================

newChatBtn.addEventListener("click", async () => {

    if (isGenerating) return;

    try {

        const response = await fetch("/new_chat", {

            method: "POST"

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to create chat"
            );

        }

        currentSessionId = data.session_id;

        clearChat();

        await loadHistory();

        messageInput.focus();

        if (window.innerWidth <= 768) {

            closeSidebar();

        }

    } catch (error) {

        console.error(error);

        alert("Unable to create new chat");

    }

});


// ==========================================
// CLEAR CHAT
// ==========================================

function clearChat() {

    chatBox.innerHTML = `
        <div
            class="welcome-screen"
            id="welcome-screen"
        >
            <div class="welcome-icon">
                <i class="fa-solid fa-robot"></i>
            </div>

            <h2>How can I help you today?</h2>

            <p>
                Start a new conversation with your AI assistant.
            </p>
        </div>
    `;

}


// ==========================================
// OPEN OLD CHAT
// ==========================================

async function openChat(sessionId) {

    if (isGenerating) return;

    try {

        const response = await fetch(
            `/chat/${sessionId}`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to open chat"
            );

        }

        currentSessionId = data.session_id;

        chatBox.innerHTML = "";

        if (!data.messages.length) {

            clearChat();

        } else {

            data.messages.forEach(message => {

                appendMessage(
                    message.role,
                    message.message
                );

            });

        }

        await loadHistory(
            historySearch.value.trim()
        );

        scrollChatToBottom();

        if (window.innerWidth <= 768) {

            closeSidebar();

        }

    } catch (error) {

        console.error(error);

        alert("Unable to open chat");

    }

}


// ==========================================
// RENAME CHAT
// ==========================================

async function renameChat(sessionId, oldTitle) {

    const newTitle = prompt(
        "Enter new chat name:",
        oldTitle || ""
    );

    if (newTitle === null) return;

    const cleanTitle = newTitle.trim();

    if (!cleanTitle) {

        alert("Chat name cannot be empty");

        return;

    }

    try {

        const response = await fetch("/rename_chat", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                session_id: sessionId,

                title: cleanTitle

            })

        });


        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Rename failed"
            );

        }

        await loadHistory(
            historySearch.value.trim()
        );

    } catch (error) {

        console.error("Rename Error:", error);

        alert(error.message);

    }

}


// ==========================================
// DELETE CHAT
// ==========================================

async function deleteChat(sessionId) {

    const confirmed = confirm(
        "Delete this chat?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `/delete_chat/${sessionId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Delete failed"
            );

        }

        if (
            Number(currentSessionId) ===
            Number(sessionId)
        ) {

            currentSessionId = null;

            clearChat();

        }

        await loadHistory(
            historySearch.value.trim()
        );

    } catch (error) {

        console.error("Delete Error:", error);

        alert(error.message);

    }

}


// ==========================================
// DELETE ALL CHATS
// ==========================================

deleteAllBtn.addEventListener("click", async () => {

    if (isGenerating) return;

    const confirmed = confirm(
        "Delete all chat history?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch("/delete_all", {

            method: "DELETE"

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Delete all failed"
            );

        }

        currentSessionId = null;

        historySearch.value = "";

        clearChat();

        await loadHistory();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});


// ==========================================
// APPEND MESSAGE
// ==========================================

function appendMessage(role, text = "") {

    const welcome = chatBox.querySelector(
        ".welcome-screen"
    );

    if (welcome) {

        welcome.remove();

    }

    const message = document.createElement("div");

    const safeRole = role === "user"
        ? "user"
        : "assistant";

    message.className = `message ${safeRole}`;

    const bubble = document.createElement("div");

    bubble.className = "message-bubble";

    bubble.textContent = text;

    message.appendChild(bubble);

    chatBox.appendChild(message);

    scrollChatToBottom();

    return bubble;

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    if (isGenerating) return;

    const userMessage = messageInput.value.trim();

    if (!userMessage) return;

    const persona = personaSelect.value;

    messageInput.value = "";

    autoResizeTextarea();

    appendMessage(
        "user",
        userMessage
    );

    const assistantBubble = appendMessage(
        "assistant",
        ""
    );

    setGenerating(true);

    typingStatus.classList.remove("hidden");

    try {

        const response = await fetch("/chat", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                message: userMessage,

                session_id: currentSessionId,

                persona: persona

            })

        });


        if (!response.ok) {

            const data = await response.json();

            throw new Error(
                data.message || "Chat request failed"
            );

        }


        if (!response.body) {

            throw new Error(
                "Streaming is not supported"
            );

        }


        const reader = response.body.getReader();

        const decoder = new TextDecoder();

        let completeText = "";

        let sessionBuffer = "";

        let sessionChecked = false;


        while (true) {

            const { value, done } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(
                value,
                {
                    stream: true
                }
            );


            if (!sessionChecked) {

                sessionBuffer += chunk;

                const newlineIndex = sessionBuffer.indexOf("\n");

                if (newlineIndex === -1) {

                    continue;

                }

                const firstLine = sessionBuffer
                    .slice(0, newlineIndex);

                let remainingText = sessionBuffer
                    .slice(newlineIndex + 1);


                if (
                    firstLine.startsWith(
                        "__SESSION_ID__:"
                    )
                ) {

                    const sessionId = firstLine
                        .replace(
                            "__SESSION_ID__:",
                            ""
                        )
                        .trim();

                    currentSessionId = Number(
                        sessionId
                    );

                } else {

                    remainingText =
                        firstLine +
                        "\n" +
                        remainingText;

                }

                sessionChecked = true;

                completeText += remainingText;

                assistantBubble.textContent =
                    completeText;

            } else {

                completeText += chunk;

                assistantBubble.textContent =
                    completeText;

            }


            scrollChatToBottom();

        }


        if (!completeText.trim()) {

            assistantBubble.textContent =
                "No response received.";

        }


        await loadHistory(
            historySearch.value.trim()
        );

    } catch (error) {

        console.error("Chat Error:", error);

        assistantBubble.textContent =
            `Error: ${error.message}`;

    } finally {

        typingStatus.classList.add("hidden");

        setGenerating(false);

        messageInput.focus();

    }

}


sendBtn.addEventListener("click", sendMessage);


// ==========================================
// ENTER TO SEND
// ==========================================

messageInput.addEventListener("keydown", event => {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }

});


// ==========================================
// TEXTAREA AUTO RESIZE
// ==========================================

messageInput.addEventListener(
    "input",
    autoResizeTextarea
);


function autoResizeTextarea() {

    messageInput.style.height = "auto";

    messageInput.style.height = `${Math.min(
        messageInput.scrollHeight,
        150
    )}px`;

}


// ==========================================
// GENERATING STATE
// ==========================================

function setGenerating(value) {

    isGenerating = value;

    sendBtn.disabled = value;

    regenerateBtn.disabled = value;

}


// ==========================================
// REGENERATE RESPONSE
// ==========================================

regenerateBtn.addEventListener("click", async () => {

    if (
        isGenerating ||
        !currentSessionId
    ) {

        return;

    }


    const messages = chatBox.querySelectorAll(
        ".message.assistant"
    );

    if (!messages.length) {

        alert("No AI response to regenerate");

        return;

    }


    const lastAssistantMessage =
        messages[messages.length - 1];

    lastAssistantMessage.remove();


    const assistantBubble = appendMessage(
        "assistant",
        ""
    );


    setGenerating(true);

    typingStatus.classList.remove("hidden");


    try {

        const response = await fetch(
            `/regenerate/${currentSessionId}`,
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    persona: personaSelect.value

                })

            }
        );


        if (!response.ok) {

            const data = await response.json();

            throw new Error(
                data.message || "Regenerate failed"
            );

        }


        const reader = response.body.getReader();

        const decoder = new TextDecoder();

        let completeText = "";


        while (true) {

            const { value, done } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(
                value,
                {
                    stream: true
                }
            );

            completeText += chunk;

            assistantBubble.textContent =
                completeText;

            scrollChatToBottom();

        }


        if (!completeText.trim()) {

            assistantBubble.textContent =
                "No response received.";

        }

    } catch (error) {

        console.error(
            "Regenerate Error:",
            error
        );

        assistantBubble.textContent =
            `Error: ${error.message}`;

    } finally {

        typingStatus.classList.add("hidden");

        setGenerating(false);

    }

});


// ==========================================
// COPY LAST AI RESPONSE
// ==========================================

copyBtn.addEventListener("click", async () => {

    const assistantMessages =
        chatBox.querySelectorAll(
            ".message.assistant .message-bubble"
        );


    if (!assistantMessages.length) {

        alert("No AI response to copy");

        return;

    }


    const lastMessage =
        assistantMessages[
            assistantMessages.length - 1
        ].textContent;


    try {

        await navigator.clipboard.writeText(
            lastMessage
        );

        const originalHTML = copyBtn.innerHTML;

        copyBtn.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <span>Copied</span>
        `;


        setTimeout(() => {

            copyBtn.innerHTML = originalHTML;

        }, 1500);

    } catch (error) {

        console.error("Copy Error:", error);

        alert("Unable to copy response");

    }

});


// ==========================================
// SCROLL CHAT
// ==========================================

function scrollChatToBottom() {

    chatBox.scrollTop = chatBox.scrollHeight;

}


// ==========================================
// ESC KEY
// ==========================================

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeDropdown();

    }

});
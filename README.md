
# 🚀 Sockify - Real-Time Chat App

Sockify is a sleek, real-time messaging application built with Node.js, Express, and Socket.io. It supports public room-based chatting, private direct messages (DMs), and live typing indicators.



## ✨ Features

* Public Chat Rooms: Join specific channels like `#general`, `#tech`, or `#sports`.
* Direct Messaging (DM): Chat privately with any online user by clicking their name in the sidebar.
* Real-Time Typing Indicators: See when someone is typing in a room or a private chat.
* Live Online List: A dynamic sidebar showing all currently connected users.
* Connection Status: Visual indicators showing whether you are connected or disconnected from the server.

## 🛠️ Tech Stack

* Frontend:HTML5, CSS3, Vanilla JavaScript.
* Backend: Node.js, Express.
* Real-Time Engine:Socket.io.
* Development: Nodemon (for auto-restarting the server).

## 📥 Installation & Setup

1.  Clone the repository:
   
    git clone https://github.com/Subhrajit-Deka-2007/Spokify.git
    cd sockify
    

2.  Install dependencies:
    
    npm install
  

3.  Start the server:
    * Using standard Node:
      
        node server.js
      
    * Using Nodemon (recommended for development):
      
        npm run dev 
        # Note: You may need to add "dev": "nodemon server.js" to your package.json scripts
        

4.  Open the app:
    Go to http://localhost:3000 in your browser. Open multiple tabs to test the chat between different users!

## 📂 Project Structure


sockify/
├── public/              # Frontend files
│   ├── index.html       # UI Structure
│   ├── style.css        # Styling & Layout
│   └── app.js           # Frontend Socket logic
├── server.js            # Node.js Backend logic
├── package.json         # Dependencies and scripts
└── .gitignore           # Files to ignore (node_modules, etc.)

## 📝 Key Socket Events used

| Event | Type | Description |
| :--- | :--- | :--- |
| joinRoom | Emit | Moves a user into a specific chat channel. |
| roomMessage | Emit | Sends a message to everyone in the current room. |
| privateMessage| Emit | Sends a 1-on-1 message to a specific Socket ID. |
| typing | Emit | Notifies others that the user is currently typing. |
| onlineUsers | Listen | Updates the UI with the list of active users. |

## 🤝 Contributing

Feel free to fork this project, submit PRs, or report issues. Possible future improvements:
 Database integration (MongoDB/PostgreSQL) to save chat history.
 User Authentication (JWT).
 File/Image sharing.

Created with ❤️ by Subhrajit Deka


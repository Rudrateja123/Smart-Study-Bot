
# Smart Study Bot 🤖💡

An AI-powered tutor that uses Generative AI and emotion recognition to personalize learning. It analyzes a student's facial expressions to detect stress or boredom and dynamically adapts its teaching style. This full-stack app is syllabus-aware, answering questions from uploaded documents and creating quizzes for active learning.

*(**Action:** To add a screenshot, upload an image of your app to a site like [Imgur](https://imgur.com/upload) and paste the link here)*

## Features ✨

* **🧠 Emotion-Aware Tutoring**: Utilizes the user's webcam to detect emotions in real-time. The AI's tone and response style adapt to be more encouraging if the user seems stressed or more engaging if they seem bored.
* **📚 Syllabus-Aware (RAG)**: Users can upload their course materials (PDF, DOCX, TXT files). The bot uses a Retrieval-Augmented Generation (RAG) pipeline to provide answers grounded specifically in that content.
* **🖼️ "Full Picture" Explanations**: Goes beyond simple answers by providing a structured, three-part explanation for every query:
    1.  **The 'What'**: A direct answer to the question.
    2.  **The 'Why'**: An explanation of why the concept is important.
    3.  **The 'Where/When'**: A relatable, real-world example.
* **✍️ Real-time Streaming Responses**: The bot "types" out its answers word-by-word, creating a dynamic and engaging user experience.
* **🎓 Adaptive Difficulty**: Users can switch between "Beginner" and "Advanced" modes to tailor the complexity of the explanations.
* **🔒 Client-Side AI for Privacy**: All emotion detection is performed directly in the user's browser using `face-api.js`. The webcam feed is never sent to the server.
* **🖥️ Modern, Full-Screen UI**: A clean, responsive, and immersive dark-themed user interface built with React.

---

## How It Works ⚙️

1.  **RAG Pipeline**: When a user uploads a document, the backend uses **LangChain** to load, chunk, and embed the text into a **FAISS** vector store. When a question is asked, the system retrieves relevant context to ensure grounded answers.
2.  **Emotion Detection Pipeline**: The React frontend uses `face-api.js` to analyze the webcam stream in the browser. The detected emotion is sent as a simple string with each question.
3.  **Emotion-Aware Prompt Engineering**: The Flask backend constructs a detailed prompt for the **Google Gemini** model, including instructions based on the user's detected emotion, before streaming the response back to the frontend.

---

## Tech Stack 🛠️

* **Frontend**: React, Vite, CSS3, `face-api.js`
* **Backend**: Python, Flask
* **AI & ML**: Google Gemini, LangChain, FAISS, Sentence Transformers

---

## Setup and Installation 🚀

### Prerequisites 🔑

* Git
* Python 3.9+
* Node.js and npm

### 1. Clone the Repository 📂

```bash
git clone [https://github.com/YOUR_USERNAME/smart-study-bot.git](https://github.com/YOUR_USERNAME/smart-study-bot.git)
cd smart-study-bot
````

### 2\. Backend Setup ⚙️

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Create a `.env` file in the `backend` folder and add your key:
    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```
4.  Run the Flask server:
    ```bash
    python app.py
    ```

### 3\. Frontend Setup 🎨

1.  Open a new terminal and navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Run the React development server:
    ```bash
    npm run dev
    ```

<!-- end list -->

```
```

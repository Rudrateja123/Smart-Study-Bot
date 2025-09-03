# backend/app.py - Upgraded for Streaming

import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response # Import Response
import time # For streaming format
from flask_cors import CORS 

# LangChain components for different file types
from langchain_community.document_loaders import PyPDFLoader, UnstructuredWordDocumentLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_google_genai import GoogleGenerativeAI

load_dotenv()
app = Flask(__name__)
CORS(app)
llm = GoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=os.getenv("GOOGLE_API_KEY"))
vector_store = None

# /upload function remains the same as before
@app.route('/upload', methods=['POST'])
def upload_file():
    global vector_store
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filepath = os.path.join("./", file.filename)
    file.save(filepath)

    try:
        if file.filename.endswith('.pdf'):
            loader = PyPDFLoader(filepath)
        elif file.filename.endswith('.docx'):
            loader = UnstructuredWordDocumentLoader(filepath)
        elif file.filename.endswith('.txt'):
            loader = TextLoader(filepath)
        else:
            os.remove(filepath)
            return jsonify({'error': 'Unsupported file type'}), 400

        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
        vector_store = FAISS.from_documents(chunks, embeddings)
        os.remove(filepath)
        return jsonify({'message': f'{file.filename} processed successfully!'}), 200

    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500


# The /ask function is now completely different
@app.route('/ask', methods=['POST'])
def ask_question():
    question = request.json.get('question', '')
    level = request.json.get('level', 'Beginner')
    emotion = request.json.get('emotion', 'neutral')

    if not question:
        return Response("No question provided", status=400)
    
    # --- PROMPT LOGIC IS THE SAME ---
    emotional_instruction = ""
    if emotion in ['sad', 'angry', 'fearful']:
        emotional_instruction = "The student seems stressed or confused. Your tone should be extra patient and encouraging. Break down the answer into smaller, simpler steps."
    elif emotion == 'neutral':
        emotional_instruction = "The student seems disengaged. Try to make the real-world example particularly interesting or surprising to grab their attention."
    elif emotion == 'happy' or emotion == 'surprised':
        emotional_instruction = "The student seems engaged and happy. Maintain a positive and enthusiastic tone. You can ask a follow-up question to encourage deeper thinking."

    base_instructions = f"""
    You are an expert tutor. A {level} student is asking a question. {emotional_instruction}
    Your response must be structured in three distinct parts:
    1.  **Direct Answer (The 'What'):** Provide a clear and direct answer.
    2.  **Importance (The 'Why'):** Explain why this concept is important.
    3.  **Real-World Example (The 'Where/When'):** Give a simple, relatable real-world example.
    Adapt the complexity for a {level} student. Use markdown for formatting.
    """

    if vector_store:
        similar_chunks = vector_store.similarity_search(question, k=3)
        context = "\n".join([chunk.page_content for chunk in similar_chunks])
        prompt = f"""
        {base_instructions} The student's question is: "{question}"
        Use the following context from the student's notes to ground your answer: Context: {context}
        """
    else:
        prompt = f"""
        {base_instructions} The student's question is: "{question}"
        """
    
    # --- STREAMING LOGIC ---
    def stream():
        # Use the .stream() method instead of .invoke()
        for chunk in llm.stream(prompt):
            yield chunk # Send each chunk as it arrives
            time.sleep(0.02) # Small delay for better visual effect

    # Return a streaming response
    return Response(stream(), mimetype='text/plain')


if __name__ == '__main__':
    app.run(debug=True)
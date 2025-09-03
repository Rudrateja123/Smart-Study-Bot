// src/App.jsx - FINAL VERSION with Uploader Re-integrated

import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [level, setLevel] = useState('Beginner');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState('neutral');
  const [uploadStatus, setUploadStatus] = useState(''); // For file upload status

  const videoRef = useRef();
  const detectionIntervalRef = useRef();
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = import.meta.env.BASE_URL + 'models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading AI models:", error);
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadedmetadata', () => {
            setIsCameraOn(true);
            startDetection();
          });
        }
      })
      .catch(err => console.error("Error accessing webcam:", err));
  };
  
  const startDetection = () => {
    clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceExpressions();
        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          const primaryEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
          setDetectedEmotion(primaryEmotion);
        }
      }
    }, 2000);
  };

  // Re-added file upload logic
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadStatus('Uploading and processing...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setUploadStatus(data.message || data.error);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error uploading file.');
    }
  };

 const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    // Add the user message AND a placeholder for the bot's response
    setMessages(prevMessages => [...prevMessages, userMessage, { text: '', sender: 'bot' }]);
    
    const questionToAsk = input;
    setInput('');
    setIsReplying(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionToAsk, level: level, emotion: detectedEmotion }),
      });
      
      if (!response.body) return;

      // Get the response stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Read the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Stream is finished

        const chunk = decoder.decode(value);
        
        // Update the last message (the bot's placeholder) by appending the new chunk
        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const updatedLastMessage = { ...lastMessage, text: lastMessage.text + chunk };
          return [...prevMessages.slice(0, -1), updatedLastMessage];
        });
      }

    } catch (error) {
      console.error('Error asking question:', error);
      const errorMessage = { text: 'Sorry, something went wrong.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages.slice(0, -1), errorMessage]); // Replace placeholder with error
    }
    
    setIsReplying(false);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Smart Study Bot</h1>
        <div className="controls">
          <div className="level-selector">
            <label htmlFor="level">I am a:</label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="Beginner">Beginner</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div className="camera-controls">
            {!isCameraOn ? (
              <button onClick={startVideo} disabled={!modelsLoaded}>
                {modelsLoaded ? 'Enable Camera' : 'Loading AI Models...'}
              </button>
            ) : (
              <p className="emotion-status">Emotion: {detectedEmotion}</p>
            )}
          </div>
        </div>
      </div>
      
      <video ref={videoRef} autoPlay muted style={{ display: 'none' }} />

      <div ref={chatWindowRef} className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-container ${msg.sender}`}>
            <div className={`message-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isReplying && <div className="typing-indicator">Bot is thinking...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask a question..."
        />
        <button onClick={handleSendMessage} disabled={isReplying}>Send</button>
      </div>
      
      {/* Re-added the file uploader here at the bottom */}
      <div className="footer">
        <input type="file" onChange={handleFileUpload} />
        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
      </div>
    </div>
  );
}

export default App;
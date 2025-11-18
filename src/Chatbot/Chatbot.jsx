import React, { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import "./Chatbot.css";

const apiKey ="AIzaSyCPeKwo0gFUDRTOUeBHyNgPU2Gu3WtXds4";


const GEMINI_MODEL = "gemini-2.0-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

const SYSTEM_INSTRUCTION = {
  parts: [
    {
      text: `You are *MEDI-ASSIST*, an AI Clinical Analyst Chatbot integrated into a Hospital Management System (HMS).

Your purpose is to:
- Analyze structured and unstructured patient data (symptoms, vitals, lab reports, notes)
- Provide non-diagnostic clinical insights, triage suggestions, risk indicators, and next-step guidance
- Assist with appointments, patient education, and hospital workflow support
- Follow strict safety, medical accuracy, and ethical guidelines

### 🔒 SAFETY & RESTRICTIONS (MANDATORY)
1. You are *NOT a doctor*. Never claim to diagnose, treat, prescribe, or confirm a medical condition.
2. Always include this disclaimer at the end of every medical response:
   *"⚠️ This is not medical advice. Consult a licensed healthcare professional for diagnosis or treatment."*
3. If information is insufficient, request missing details.
4. Avoid giving medication names or dosages unless explicitly provided in the data.

### 📊 ANALYSIS GUIDELINES
When analyzing patient input, always:
- Refer ONLY to data provided in the chat or patient record
- Use evidence-based reasoning
- Identify possible concerns, red flags, and risk categories
- Suggest next steps such as tests, departments, or specialists
- Use clear, structured markdown formatting

### 🧠 RESPONSE FORMAT (ALWAYS USE)
Your response must include:

#### 1. **Summary**
A clear short summary of the situation.

#### 2. **Clinical Interpretation**
- Symptom analysis  
- Possible causes (non-diagnostic)  
- Risk level (Low / Moderate / High)

#### 3. **Recommended Next Steps**
- What the patient should do  
- Which department or specialist to consult  
- Any tests typically relevant (e.g., CBC, ECG, X-Ray)

#### 4. **If the user asks for appointments**
Provide:
- Available departments  
- Ask for needed details (Date, Time, Doctor Preference, Patient ID)

#### 5. **Final Disclaimer**
Always include:
*"⚠️ This is not medical advice. Consult a licensed healthcare professional for diagnosis or treatment."*

### 👤 TONE & STYLE
- Professional, empathetic, supportive  
- Simple language for patients  
- Clinical accuracy for doctors and staff  
- No panic-inducing language`
    }
  ]
};

const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'API Error'}`);
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hello! I am **MEDI-ASSIST**, your AI Clinical Analyst.\n\nI can help you:\n- 📄 Analyze patient reports\n- 🩺 Interpret symptoms and vitals\n- 📋 Suggest next steps and tests\n- 📅 Assist with appointments\n\nUpload a patient report or ask me anything!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract text from uploaded files
  const extractTextFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          
          // Try to parse as JSON
          try {
            const json = JSON.parse(text);
            resolve({ type: 'json', data: json, text: JSON.stringify(json, null, 2) });
          } catch {
            // Plain text or CSV
            resolve({ type: 'text', data: text, text: text });
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsLoading(true);

    try {
      const newFiles = [];
      let combinedData = patientData || {};

      for (const file of files) {
        const extracted = await extractTextFromFile(file);
        newFiles.push({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
          extractedData: extracted
        });

        // Merge patient data
        if (extracted.type === 'json') {
          combinedData = { ...combinedData, ...extracted.data };
        }
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setPatientData(combinedData);

      setMessages((prev) => [
        ...prev,
        {
          role: "system_info",
          content: `📄 Uploaded: ${newFiles.map(f => `${f.name} (${f.size})`).join(', ')}`
        }
      ]);

      // Auto-analyze if JSON data exists
      if (Object.keys(combinedData).length > 0) {
        setTimeout(() => analyzePatientReport(combinedData), 600);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system_error",
          content: `❌ Upload failed: ${error.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Analyze patient report automatically
  const analyzePatientReport = async (data) => {
    setIsLoading(true);

    try {
      const analysisPrompt = `Analyze this patient report comprehensively:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Provide detailed analysis with Summary, Clinical Interpretation (including risk level), Recommended Next Steps, and Disclaimer.`;

      const payload = {
        contents: [{ parts: [{ text: analysisPrompt }] }],
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      const response = await fetchWithRetry(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate?.finishReason === "SAFETY") {
        throw new Error("Response blocked by safety filters");
      }

      const botText = candidate?.content?.parts?.[0]?.text || 
        "Unable to analyze the report. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: botText }]);
      
      // Add to conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: "Analyze patient report" },
        { role: "model", content: botText }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "system_error", content: `❌ Analysis error: ${err.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message with context
  const handleSendMessage = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage = input.trim();
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setInput("");
      setIsLoading(true);

      try {
        // Build context-aware prompt
        let contextPrompt = userMessage;

        if (patientData && Object.keys(patientData).length > 0) {
          contextPrompt = `Patient Report Context:
\`\`\`json
${JSON.stringify(patientData, null, 2)}
\`\`\`

USER QUERY: ${userMessage}`;
        } else if (uploadedFiles.length > 0) {
          const fileContext = uploadedFiles
            .map(f => `File: ${f.name}\nContent:\n${f.extractedData.text.substring(0, 3000)}`)
            .join('\n\n---\n\n');
          contextPrompt = `${fileContext}\n\nUSER QUERY: ${userMessage}`;
        }

        // Include conversation history for context
        const contents = [
          ...conversationHistory.slice(-6), // Last 6 messages for context
          { role: "user", parts: [{ text: contextPrompt }] }
        ];

        const payload = {
          contents: contents.length > 1 ? contents : [{ parts: [{ text: contextPrompt }] }],
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        };

        const response = await fetchWithRetry(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate?.finishReason === "SAFETY") {
          throw new Error("Response blocked. Please rephrase your question.");
        }

        const botText = candidate?.content?.parts?.[0]?.text || 
          "I couldn't process that request. Please try again.";

        setMessages((prev) => [...prev, { role: "assistant", content: botText }]);
        
        // Update conversation history
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", parts: [{ text: contextPrompt }] },
          { role: "model", parts: [{ text: botText }] }
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "system_error", content: `❌ ${err.message}` }
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, patientData, uploadedFiles, conversationHistory]
  );

  // Clear chat and reset
  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "👋 Hello! I am **MEDI-ASSIST**, your AI Clinical Analyst.\n\nI can help you:\n- 📄 Analyze patient reports\n- 🩺 Interpret symptoms and vitals\n- 📋 Suggest next steps and tests\n- 📅 Assist with appointments\n\nUpload a patient report or ask me anything!"
      }
    ]);
    setUploadedFiles([]);
    setPatientData(null);
    setConversationHistory([]);
  };

  // Remove specific file
  const removeFile = (index) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    
    if (updatedFiles.length === 0) {
      setPatientData(null);
    }
  };

  // Download chat history
  const downloadChatHistory = () => {
    const chatText = messages
      .filter(m => m.role !== 'system_info' && m.role !== 'system_error')
      .map(m => {
        const role = m.role === 'user' ? 'User' : 'MEDI-ASSIST';
        return `${role}:\n${m.content}\n\n`;
      })
      .join('---\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Message = ({ message }) => {
    const isUser = message.role === "user";
    const isSystemInfo = message.role === "system_info";
    const isSystemError = message.role === "system_error";

    const messageClass = isUser
      ? "user-message"
      : isSystemInfo
      ? "system-info"
      : isSystemError
      ? "system-error"
      : "assistant-message";

    if (message.role === "assistant") {
      return (
        <div className="message-row assistant-row">
          <div className={`message-bubble ${messageClass}`}>
            <div
              className="message-content"
              dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
        <div className={`message-bubble ${messageClass}`}>
          {message.content}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      {!isOpen && (
        <div className="chatbot-floating">
          <button className="chatbot-button" onClick={() => setIsOpen(true)}>
            💬
          </button>
        </div>
      )}

      {/* POPUP CHAT WINDOW */}
      {isOpen && (
        <div className="chatbot-floating">
          <div className="chat-container">
            {/* HEADER */}
            <div className="chat-header">
              <div>
                <h1>MEDI-ASSIST</h1>
                <p>AI Clinical Analyst</p>
              </div>
              <div className="header-actions">
                <button 
                  className="icon-button" 
                  onClick={downloadChatHistory}
                  title="Download chat history"
                >
                  💾
                </button>
                <button 
                  className="icon-button" 
                  onClick={clearChat}
                  title="Clear chat"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* UPLOADED FILES SECTION */}
            {uploadedFiles.length > 0 && (
              <div className="files-section">
                <div className="files-header">📎 Uploaded Files:</div>
                <div className="files-list">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{file.size}</span>
                      <button
                        className="file-remove"
                        onClick={() => removeFile(index)}
                        title="Remove file"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT HISTORY */}
            <div className="chat-history">
              {messages.map((msg, i) => (
                <Message key={i} message={msg} />
              ))}

              {isLoading && (
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}

              <div ref={chatEndRef}></div>
            </div>

            {/* INPUT FORM */}
            <div className="input-form">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.json,.csv"
                style={{ display: 'none' }}
                multiple
              />

              <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Upload patient report"
              >
                📎
              </button>

              <div className="input-group">
                <input
                  className="input-field"
                  placeholder="Ask about patient data or medical queries..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={isLoading}
                />

                <button 
                  className="send-button" 
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                >
                  ➤
                </button>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ✖ Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
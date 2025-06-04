// src/App.js
import React, { useState } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import ResultsView from './components/ResultsView';

function App() {
  const [processingState, setProcessingState] = useState('idle'); // idle, uploading, processing, complete
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);

  const handleProcessingComplete = (response) => {
    setResults(response);
    setProcessingState('complete');
    setUploadHistory(prev => [
      {
        id: response.imageId,
        timestamp: new Date().toLocaleString(),
        hasPerson: response.hasPerson
      },
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI Image Analyzer</h1>
        <p>Upload photos to detect people using AWS Rekognition</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <UploadForm 
            processingState={processingState}
            setProcessingState={setProcessingState}
            setImagePreview={setImagePreview}
            onProcessingComplete={handleProcessingComplete}
          />
          
          {imagePreview && (
            <div className="image-preview">
              <img 
                src={imagePreview} 
                alt="Upload preview" 
                className={processingState === 'complete' ? (results.hasPerson ? 'detected' : 'not-detected') : ''}
              />
              {processingState === 'processing' && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <p>Analyzing image...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {processingState === 'complete' && results && (
          <ResultsView results={results} />
        )}

        {uploadHistory.length > 0 && (
          <div className="history-section">
            <h2>Recent Uploads</h2>
            <div className="history-items">
              {uploadHistory.map(item => (
                <div key={item.id} className="history-item">
                  <div className={`status-indicator ${item.hasPerson ? 'detected' : 'not-detected'}`}>
                    {item.hasPerson ? '✓' : '✗'}
                  </div>
                  <div className="item-details">
                    <div>ID: {item.id.slice(0, 8)}</div>
                    <div>{item.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div>Powered by AWS Services</div>
        <div className="aws-logos">
          <span>Fargate</span> • <span>S3</span> • <span>Rekognition</span> • <span>Lambda</span> • <span>Aurora</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
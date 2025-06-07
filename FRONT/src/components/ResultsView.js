// src/components/ResultsView.js
import React from 'react';

const ResultsView = ({ results, onReset }) => {
  return (
    <div className="results-view">
      <h2>Analysis Results</h2>
      
      <div className={`result-summary ${results.hasPerson ? 'person-detected' : 'no-person'}`}>
        {results.hasPerson ? (
          <>
            <div className="result-icon">✅</div>
            <h3>Person Detected!</h3>
          </>
        ) : (
          <>
            <div className="result-icon">❌</div>
            <h3>No Person Detected</h3>
          </>
        )}
      </div>
      
      <div className="result-details">
        <h4>Image Metadata</h4>
        <ul>
          <li><strong>ID:</strong> {results.imageId}</li>
          <li><strong>Type:</strong> {results.metadata.type}</li>
          <li><strong>Size:</strong> {(results.metadata.size / 1024).toFixed(2)} KB</li>
          <li><strong>Uploaded:</strong> {new Date().toLocaleTimeString()}</li>
        </ul>
        
        <h4>Detected Labels</h4>
        <div className="label-container">
          {results.labels.map((label, index) => (
            <span key={index} className="label-tag">{label}</span>
          ))}
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="btn primary" onClick={onReset}>Analyze Another Image</button>
      </div>
    </div>
  );
};

export default ResultsView;
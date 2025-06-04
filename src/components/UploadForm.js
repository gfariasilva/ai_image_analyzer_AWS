// src/components/UploadForm.js
import React, { useRef, useState } from 'react';

const UploadForm = ({ 
  processingState, 
  setProcessingState,
  setImagePreview,
  onProcessingComplete
}) => {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setError('');
    setProcessingState('uploading');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      simulateUploadProcess(file);
    };
    reader.readAsDataURL(file);
  };

  const simulateUploadProcess = async (file) => {
    try {
      // In real app: Get presigned URL from your backend
      setProcessingState('uploading');
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app: Upload to S3 using presigned URL
      setProcessingState('processing');
      
      // Simulate Rekognition processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulated response - Replace with actual API call
      const mockResponse = {
        imageId: `img-${Date.now()}`,
        hasPerson: Math.random() > 0.3,
        confidence: (Math.random() * 40 + 60).toFixed(1),
        labels: ['Person', 'Outdoor', 'Nature', 'Tree', 'Sky'],
        metadata: {
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
      };
      
      onProcessingComplete(mockResponse);
    } catch (err) {
      setError('Processing failed. Please try again.');
      setProcessingState('idle');
    }
  };

  return (
    <div className="upload-form">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        disabled={processingState !== 'idle'}
        hidden
      />
      
      {processingState === 'idle' ? (
        <div className="upload-area" onClick={() => fileInputRef.current.click()}>
          <div className="upload-icon">📁</div>
          <p>Click to upload image</p>
          <p className="upload-hint">Supports JPG, PNG (Max 5MB)</p>
        </div>
      ) : (
        <div className="upload-status">
          {processingState === 'uploading' && (
            <p>Uploading image to cloud storage...</p>
          )}
          {processingState === 'processing' && (
            <p>Analyzing image with AI...</p>
          )}
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default UploadForm;
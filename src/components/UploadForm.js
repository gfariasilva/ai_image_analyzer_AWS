import React, { useRef, useState } from 'react';

const UploadForm = ({ 
  processingState, 
  setProcessingState,
  setImagePreview,
  onProcessingComplete
}) => {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const API_BASE = 'https://rbvablkfn4.execute-api.us-east-1.amazonaws.com';

  const handleFileChange = async (e) => {
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
      processImageUpload(file);
    };
    reader.readAsDataURL(file);
  };

  const processImageUpload = async (file) => {
    try {
      // 1. Get presigned URL for upload
      setProcessingState('uploading');
      // Substitui o GET por um POST com o tipo correto
      const presignedResponse = await fetch(`${API_BASE}/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentType: file.type })  // tipo real: "image/jpeg"
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { url, imageId } = await presignedResponse.json();

      // 2. Upload directly to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload to S3 failed');
      }

      const raw = await fetchWithRetries(imageId);

      // Adapta o resultado bruto
      const result = {
        imageId: raw.imageId,
        hasPerson: raw.has_person, // renomeia para camelCase
        labels: raw.labels,
        metadata: {
          type: raw.type,
          size: 0 // você pode tentar estimar ou ignorar por enquanto
        },
        confidence: 0 // placeholder caso você ainda não tenha esse valor
      };

      onProcessingComplete(result);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Processing failed. Please try again.');
      setProcessingState('idle');
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchWithRetries = async (imageId, retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      const res = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') return data;
      }

      await wait(delay);
    }
    throw new Error('Timed out waiting for processing to complete');
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
          {processingState === 'uploading' && <p>Uploading image to S3...</p>}
          {processingState === 'processing' && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Processing image...</p>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
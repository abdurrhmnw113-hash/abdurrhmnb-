import React, { useState, useCallback } from 'react';
import type { ImageFile } from '../types';

interface ImageUploaderProps {
  id: string;
  onImageUpload: (image: ImageFile | null) => void;
  image: ImageFile | null;
  title: string;
  description: string;
  className?: string;
}

const UploadIcon: React.FC = () => (
    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, onImageUpload, image, title, description, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        onImageUpload({ file, previewUrl });
      } else {
        alert('Please upload a valid image file.');
      }
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleRemoveImage = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if(image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      onImageUpload(null);
  }, [image, onImageUpload]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label
        htmlFor={id}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-[#441c1c] border-dashed rounded-lg cursor-pointer bg-[#200000] hover:bg-[#2c0e0e] transition-colors relative ${isDragging ? 'border-[#EDCB05] bg-[#2c0e0e]' : ''} ${className}`}
      >
        {image ? (
          <>
            <img src={image.previewUrl} alt="Preview" className="object-contain w-full h-full rounded-lg" />
            <button 
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-75 transition-opacity"
                aria-label="Remove image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon/>
            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">{title}</span> or drag and drop</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        )}
        <input id={id} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} />
      </label>
    </div>
  );
};
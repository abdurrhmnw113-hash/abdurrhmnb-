import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageFile, GeneratedResult } from '../types';

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result !== 'string') {
            return reject(new Error('FileReader result is not a string'));
        }
        const base64String = reader.result.split(',')[1];
        resolve({ mimeType: file.type, data: base64String });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const formatImageToAspectRatio = (file: File, aspectRatioString: string): Promise<{mimeType: string, data: string}> => {
  return new Promise((resolve, reject) => {
    const [widthRatio, heightRatio] = aspectRatioString.split(':').map(Number);
    if (!widthRatio || !heightRatio) {
      return reject(new Error('Invalid aspect ratio string.'));
    }
    const targetRatio = widthRatio / heightRatio;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));

        let newWidth, newHeight;
        const imgRatio = img.width / img.height;

        // Determine canvas size to fit the image within the target aspect ratio
        if (imgRatio > targetRatio) {
          // Image is wider than target, so width is the constraining dimension
          newWidth = img.width;
          newHeight = img.width / targetRatio;
        } else {
          // Image is taller than or equal to target, so height is the constraining dimension
          newHeight = img.height;
          newWidth = img.height * targetRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Center the image on the canvas
        const x = (newWidth - img.width) / 2;
        const y = (newHeight - img.height) / 2;
        
        ctx.drawImage(img, x, y);

        const dataUrl = canvas.toDataURL('image/png');
        const base64String = dataUrl.split(',')[1];
        resolve({ mimeType: 'image/png', data: base64String });
      };
      img.onerror = (error) => reject(error);
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Could not read file for canvas processing.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export const generateEditedImage = async (
  productImage: ImageFile,
  styleImage: ImageFile | null,
  prompt: string,
  aspectRatio: string
): Promise<GeneratedResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!ai) {
        throw new Error('API Key not found.');
    }

    const parts = [];

    // Format product image to the target aspect ratio before sending
    const productImgData = await formatImageToAspectRatio(productImage.file, aspectRatio);
    parts.push({
      inlineData: {
        data: productImgData.data,
        mimeType: productImgData.mimeType,
      },
    });

    if (styleImage) {
        // Style image is used as-is
        const styleImgData = await fileToBase64(styleImage.file);
        parts.push({
            inlineData: {
                data: styleImgData.data,
                mimeType: styleImgData.mimeType,
            },
        });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    let imageUrl = '';
    let text = '';

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                text = part.text;
            } else if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
    }

    if (!imageUrl) {
        throw new Error("API did not return an image. Please try again.");
    }

    return { imageUrl, text };

  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
};
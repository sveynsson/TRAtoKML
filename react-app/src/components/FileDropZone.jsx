import React, { useCallback, useState } from 'react';
import { Upload, FileType } from 'lucide-react';

const FileDropZone = ({ onFileUpload, isLoading, coordinateSystem }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.tra')) {
        onFileUpload(file);
      } else {
        alert('Bitte laden Sie eine .tra-Datei hoch.');
      }
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-3 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
          }
          ${!coordinateSystem ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          shadow-lg hover:shadow-xl
        `}
      >
        <input
          type="file"
          accept=".tra"
          onChange={handleFileInput}
          disabled={!coordinateSystem || isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-all duration-300
            ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            {isLoading ? (
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
            )}
          </div>
          
          <div>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              {isLoading ? 'Datei wird geladen...' : 'TRA-Datei hochladen'}
            </p>
            <p className="text-gray-600">
              {!coordinateSystem 
                ? 'Bitte wählen Sie zuerst ein Koordinatensystem aus' 
                : 'Ziehen Sie eine .tra-Datei hierher oder klicken Sie zum Auswählen'
              }
            </p>
          </div>

          {coordinateSystem && !isLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4">
              <FileType className="w-4 h-4" />
              <span>Nur .tra-Dateien werden unterstützt</span>
            </div>
          )}
        </div>
      </div>

      {!coordinateSystem && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm font-medium">
            ⚠️ Bitte wählen Sie oben ein Koordinatensystem aus, bevor Sie eine Datei hochladen.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;

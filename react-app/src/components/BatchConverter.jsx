import React, { useState, useCallback } from 'react';
import { Upload, Download, Trash2, FileText, Layers } from 'lucide-react';
import { parseTRAFile } from '../utils/traParser';
import { transformCoordinates } from '../utils/coordinateTransform';
import { exportBatchToKML } from '../utils/kmlExport';

const COLORS = [
  { name: 'Rot', hex: '#FF0000', kml: 'ff0000ff' },
  { name: 'Grün', hex: '#00FF00', kml: 'ff00ff00' },
  { name: 'Blau', hex: '#0000FF', kml: 'ffff0000' },
  { name: 'Gelb', hex: '#FFFF00', kml: 'ff00ffff' },
  { name: 'Magenta', hex: '#FF00FF', kml: 'ffff00ff' },
  { name: 'Cyan', hex: '#00FFFF', kml: 'ffffff00' },
  { name: 'Orange', hex: '#FF8800', kml: 'ff0088ff' },
  { name: 'Lila', hex: '#8800FF', kml: 'ffff0088' },
  { name: 'Pink', hex: '#FF0088', kml: 'ff8800ff' },
  { name: 'Türkis', hex: '#00FF88', kml: 'ff88ff00' },
];

const BatchConverter = ({ coordinateSystem }) => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFilesUpload = useCallback(async (uploadedFiles) => {
    if (!coordinateSystem) {
      setError('Bitte wählen Sie zuerst ein Koordinatensystem aus.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const processedFiles = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        if (!file.name.endsWith('.tra')) {
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const parsedRecords = parseTRAFile(arrayBuffer);

        if (parsedRecords.length === 0) {
          continue;
        }

        // Transform coordinates to WGS84
        const transformedRecords = parsedRecords.map(record => ({
          ...record,
          ...transformCoordinates(record.rY, record.rX, coordinateSystem)
        }));

        const colorIndex = processedFiles.length % COLORS.length;
        
        processedFiles.push({
          id: Date.now() + i,
          name: file.name,
          records: transformedRecords,
          color: COLORS[colorIndex],
          pointCount: transformedRecords.length
        });
      }

      setFiles(prev => [...prev, ...processedFiles]);
      setError('');
    } catch (err) {
      setError(`Fehler beim Laden der Dateien: ${err.message}`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [coordinateSystem]);

  const handleFileInput = useCallback((e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length > 0) {
      handleFilesUpload(uploadedFiles);
    }
  }, [handleFilesUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const uploadedFiles = Array.from(e.dataTransfer.files);
    if (uploadedFiles.length > 0) {
      handleFilesUpload(uploadedFiles);
    }
  }, [handleFilesUpload]);

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const changeColor = useCallback((id, newColor) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, color: newColor } : f
    ));
  }, []);

  const handleExport = useCallback(() => {
    if (files.length === 0) {
      setError('Bitte laden Sie mindestens eine TRA-Datei hoch.');
      return;
    }

    try {
      const kmlContent = exportBatchToKML(files);
      
      const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'trassen_batch.kml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setError('');
    } catch (err) {
      setError(`Fehler beim Export: ${err.message}`);
      console.error(err);
    }
  }, [files]);

  const clearAll = useCallback(() => {
    setFiles([]);
    setError('');
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${!coordinateSystem 
            ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' 
            : 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
          }
        `}
      >
        <input
          type="file"
          accept=".tra"
          multiple
          onChange={handleFileInput}
          disabled={!coordinateSystem || isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center space-y-3">
          {isProcessing ? (
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Upload className="w-10 h-10 text-blue-600" />
          )}
          
          <div>
            <p className="text-lg font-semibold text-gray-800">
              {isProcessing ? 'Dateien werden verarbeitet...' : 'Mehrere TRA-Dateien hochladen'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {!coordinateSystem 
                ? 'Bitte wählen Sie zuerst ein Koordinatensystem aus' 
                : 'Ziehen Sie mehrere .tra-Dateien hierher oder klicken Sie zum Auswählen'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Geladene Trassen ({files.length})
              </h3>
            </div>
            <button
              onClick={clearAll}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Alle löschen</span>
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-6 h-6 rounded border-2 border-gray-300"
                    style={{ backgroundColor: file.color.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-sm text-gray-600">{file.pointCount} Punkte</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={file.color.name}
                    onChange={(e) => {
                      const newColor = COLORS.find(c => c.name === e.target.value);
                      if (newColor) changeColor(file.id, newColor);
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {COLORS.map((color) => (
                      <option key={color.name} value={color.name}>
                        {color.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleExport}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center space-x-2 shadow-md font-medium"
            >
              <Download className="w-5 h-5" />
              <span>Alle Trassen als KML exportieren</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchConverter;
